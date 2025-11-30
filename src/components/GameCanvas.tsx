import { useEffect, useRef, useState, useCallback } from 'react';
import { Weapon, PlayerStats, Projectile, PowerUp, Position, BloodParticle, SlashAnimation, HealthPickup, AmmoPickup, VestPickup, ActiveAbilityType, ActiveAbilityState } from '../types/game';
import { getAbilityByType } from '../data/activeAbilities';
import { PixelIcon } from '../utils/pixelIcons';
import { WeaponManager } from '../managers/WeaponManager';
import { EnemyManager } from '../managers/EnemyManager';
import { WaveManager } from '../managers/WaveManager';
import { useGameLoop } from '../hooks/useGameLoop';
import { useKeyboard } from '../hooks/useKeyboard';
import { checkCollision, generateId, distance, distanceToLineSegment } from '../utils/gameUtils';
import { spriteManager } from '../utils/spriteManager';
import { GAME_BALANCE } from '../data/gameBalance';
import { useMusic } from '../contexts/MusicContext';
import GameUI from './GameUI';
import PowerUpSelection from './PowerUpSelection';
import GameOver from './GameOver';

interface GameCanvasProps {
  weapon: Weapon;
  onReturnToMenu: () => void;
}

const PLAYER_SIZE = GAME_BALANCE.player.size;

const GameCanvas = ({ weapon, onReturnToMenu }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useKeyboard();
  const { isSfxEnabled } = useMusic();

  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const canvasWidth = canvasSize.width;
  const canvasHeight = canvasSize.height;

  const [playerPos, setPlayerPos] = useState<Position>({
    x: canvasWidth / 2,
    y: canvasHeight / 2,
  });

  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    maxHealth: GAME_BALANCE.player.startingMaxHealth,
    health: GAME_BALANCE.player.startingHealth,
    blueHealth: 0,
    movementSpeed: GAME_BALANCE.player.baseMovementSpeed,
    damage: GAME_BALANCE.player.startingDamage,
    attackSpeed: GAME_BALANCE.player.startingAttackSpeed,
    projectileSize: GAME_BALANCE.player.startingProjectileSize,
    knockback: GAME_BALANCE.player.startingKnockback,
    cooldownReduction: GAME_BALANCE.player.startingCooldownReduction,
  });

  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [availablePowerUps, setAvailablePowerUps] = useState<PowerUp[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const showExitConfirmRef = useRef(false);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  // Active abilities - start empty, obtained from power-ups
  const [activeAbilities, setActiveAbilities] = useState<ActiveAbilityState[]>([]);

  const weaponManagerRef = useRef<WeaponManager>(new WeaponManager(weapon));
  // Callback for enemy projectile sound - will be set in useEffect
  const playEnemyProjectileSoundRef = useRef<(() => void) | null>(null);
  const playBerserkerSoundRef = useRef<(() => void) | null>(null);
  const playChargingSoundRef = useRef<(() => void) | null>(null);
  const stopChargingSoundRef = useRef<(() => void) | null>(null);
  const playChargedShotSoundRef = useRef<(() => void) | null>(null);
  const playWeakEnemyBlastSoundRef = useRef<(() => void) | null>(null);
  const playNormalEnemyDeathSoundRef = useRef<(() => void) | null>(null);
  
  const enemyManagerRef = useRef<EnemyManager>(
    new EnemyManager(canvasWidth, canvasHeight, () => {
      // Temporary callback, will be replaced in useEffect
      if (playEnemyProjectileSoundRef.current) {
        playEnemyProjectileSoundRef.current();
      }
    }, () => {
      // Temporary callback, will be replaced in useEffect
      if (playBerserkerSoundRef.current) {
        playBerserkerSoundRef.current();
      }
    }, () => {
      // Temporary callback, will be replaced in useEffect
      if (playChargingSoundRef.current) {
        playChargingSoundRef.current();
      }
    }, () => {
      // Temporary callback, will be replaced in useEffect
      if (stopChargingSoundRef.current) {
        stopChargingSoundRef.current();
      }
    }, () => {
      // Temporary callback, will be replaced in useEffect
      if (playChargedShotSoundRef.current) {
        playChargedShotSoundRef.current();
      }
    }, () => {
      // Temporary callback, will be replaced in useEffect
      if (playWeakEnemyBlastSoundRef.current) {
        playWeakEnemyBlastSoundRef.current();
      }
    }, () => {
      // Temporary callback, will be replaced in useEffect
      if (playNormalEnemyDeathSoundRef.current) {
        playNormalEnemyDeathSoundRef.current();
      }
    }, () => {
      // Temporary callback, will be replaced in useEffect
      if (isSfxEnabled && enemyProjectileDestroyedSoundRef.current) {
        const sound = enemyProjectileDestroyedSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    }, () => {
      // Temporary callback, will be replaced in useEffect
      if (isSfxEnabled && enemySplitSoundRef.current) {
        const sound = enemySplitSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    })
  );
  const waveManagerRef = useRef<WaveManager>(new WaveManager());

  // Cleanup function to stop all playing sounds
  const cleanupAllSounds = useCallback(() => {
    // Stop charging sound
    if (currentChargingSoundRef.current) {
      currentChargingSoundRef.current.pause();
      currentChargingSoundRef.current.currentTime = 0;
      currentChargingSoundRef.current = null;
    }
    
    // Stop all audio elements by pausing and resetting them
    // Note: We can't track all cloned sounds, but stopping the main refs helps
    if (stopChargingSoundRef.current) {
      stopChargingSoundRef.current();
    }
  }, []);

  const projectilesRef = useRef<Projectile[]>([]);
  const bloodParticlesRef = useRef<BloodParticle[]>([]);
  const slashAnimationsRef = useRef<SlashAnimation[]>([]);
  const healthPickupsRef = useRef<HealthPickup[]>([]);
  const ammoPickupsRef = useRef<AmmoPickup[]>([]);
  const vestPickupsRef = useRef<VestPickup[]>([]);
  const [currentAmmo, setCurrentAmmo] = useState<number>(0);
  const currentAmmoRef = useRef<number>(0);
  const swordAttackAngleRef = useRef<number | null>(null);
  const swordAttackTimeRef = useRef<number>(0);
  const lastDamageTimeRef = useRef<number>(0);
  const isMouseDownRef = useRef<boolean>(false);
  const lastHealthPickupSpawnRef = useRef<number>(0);
  const lastAmmoPickupSpawnRef = useRef<number>(0);
  const lastVestPickupSpawnRef = useRef<number>(0);
  const lastFireRingDamageRef = useRef<number>(0);
  const fireRingAnimationRef = useRef<number>(0);
  const lastShieldBlockSoundRef = useRef<number>(0);
  const playerPosRef = useRef<Position>(playerPos);
  const playerStatsRef = useRef<PlayerStats>(playerStats);
  const spritesLoadedRef = useRef<boolean>(false);
  const screenShakeRef = useRef<{ x: number; y: number; intensity: number; endTime: number } | null>(null);
  const lastLaserBeamCountRef = useRef<number>(0);
  // Energy beam sprite sheet animation frame counter
  const energyBeamFrameRef = useRef<number>(0);
  const pistolSoundRef = useRef<HTMLAudioElement | null>(null);
  const swordSoundRef = useRef<HTMLAudioElement | null>(null);
  const rifleSoundRef = useRef<HTMLAudioElement | null>(null);
  const shotgunSoundRef = useRef<HTMLAudioElement | null>(null);
  const enemyProjectileSoundRef = useRef<HTMLAudioElement | null>(null);
  const healthPickupSoundRef = useRef<HTMLAudioElement | null>(null);
  const berserkerSoundRef = useRef<HTMLAudioElement | null>(null);
  const chargingSoundRef = useRef<HTMLAudioElement | null>(null);
  const currentChargingSoundRef = useRef<HTMLAudioElement | null>(null);
  const chargedShotSoundRef = useRef<HTMLAudioElement | null>(null);
  const weakEnemyBlastSoundRef = useRef<HTMLAudioElement | null>(null);
  const normalEnemyDeathSoundRef = useRef<HTMLAudioElement | null>(null);
  const enemyProjectileDestroyedSoundRef = useRef<HTMLAudioElement | null>(null);
  const enemySplitSoundRef = useRef<HTMLAudioElement | null>(null);
  const abilityActivationSoundRef = useRef<HTMLAudioElement | null>(null);
  const energyBeamSoundRef = useRef<HTMLAudioElement | null>(null);

  // Update canvas size on window resize
  useEffect(() => {
    const updateCanvasSize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Update canvas element dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }
  }, [canvasWidth, canvasHeight]);

  // Recreate EnemyManager when canvas size changes
  useEffect(() => {
    const playEnemyProjectileSound = () => {
      if (isSfxEnabled && enemyProjectileSoundRef.current) {
        const sound = enemyProjectileSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    const playBerserkerSound = () => {
      if (isSfxEnabled && berserkerSoundRef.current) {
        const sound = berserkerSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    const playChargingSound = () => {
      // Stop any currently playing charging sound
      if (currentChargingSoundRef.current) {
        currentChargingSoundRef.current.pause();
        currentChargingSoundRef.current.currentTime = 0;
        currentChargingSoundRef.current = null;
      }
      
      if (isSfxEnabled && chargingSoundRef.current) {
        const sound = chargingSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.loop = true; // Loop the charging sound
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
        currentChargingSoundRef.current = sound; // Track the currently playing sound
      }
    };
    const stopChargingSound = () => {
      if (currentChargingSoundRef.current) {
        currentChargingSoundRef.current.pause();
        currentChargingSoundRef.current.currentTime = 0;
        currentChargingSoundRef.current = null;
      }
    };
    const playChargedShotSound = () => {
      // Stop charging sound when shot is fired
      stopChargingSound();
      
      if (isSfxEnabled && chargedShotSoundRef.current) {
        const sound = chargedShotSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    const playWeakEnemyBlastSound = () => {
      if (isSfxEnabled && weakEnemyBlastSoundRef.current) {
        const sound = weakEnemyBlastSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.currentTime = 0; // Start from beginning
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
        
        // Stop after 1 second
        setTimeout(() => {
          sound.pause();
          sound.currentTime = 0;
        }, 1000);
      }
    };
    const playNormalEnemyDeathSound = () => {
      if (isSfxEnabled && normalEnemyDeathSoundRef.current) {
        const sound = normalEnemyDeathSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    const playShieldBlockSound = () => {
      if (isSfxEnabled && enemyProjectileDestroyedSoundRef.current) {
        const sound = enemyProjectileDestroyedSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    const playEnemySplitSound = () => {
      if (isSfxEnabled && enemySplitSoundRef.current) {
        const sound = enemySplitSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    const playEnergyBeamSound = () => {
      if (isSfxEnabled && energyBeamSoundRef.current) {
        const sound = energyBeamSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.7;
        sound.currentTime = 0; // Start from beginning
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
        // Stop after 2 seconds
        setTimeout(() => {
          sound.pause();
          sound.currentTime = 0;
        }, 2000);
      }
    };
    enemyManagerRef.current = new EnemyManager(canvasWidth, canvasHeight, playEnemyProjectileSound, playBerserkerSound, playChargingSound, stopChargingSound, playChargedShotSound, playWeakEnemyBlastSound, playNormalEnemyDeathSound, playShieldBlockSound, playEnemySplitSound, playEnergyBeamSound);
  }, [canvasWidth, canvasHeight, isSfxEnabled]);

  useEffect(() => {
    // Load sprites on mount
    spriteManager.loadSprites().then(() => {
      spritesLoadedRef.current = true;
    });

    // Initialize pistol sound
    const pistolSound = new Audio('/assets/pistol-shot-233473.mp3');
    pistolSound.volume = 0.1; // Set volume to 15% (reduced from 30%)
    pistolSoundRef.current = pistolSound;

    // Initialize sword sound
    const swordSound = new Audio('/assets/sword-slice-393847.mp3');
    swordSound.volume = 0.3; // Set volume to 30%
    swordSoundRef.current = swordSound;

    // Initialize rifle sound
    const rifleSound = new Audio('/assets/powerful-cannon-shot-352459.mp3');
    rifleSound.volume = 0.3; // Set volume to 30%
    rifleSoundRef.current = rifleSound;

    // Initialize shotgun sound
    const shotgunSound = new Audio('/assets/shotgun-146188.mp3');
    shotgunSound.volume = 0.3; // Set volume to 30%
    shotgunSoundRef.current = shotgunSound;

    // Initialize enemy projectile sound
    const enemyProjectileSound = new Audio('/assets/fire-magic-5-378639.mp3');
    enemyProjectileSound.volume = 0.3; // Set volume to 30%
    enemyProjectileSoundRef.current = enemyProjectileSound;

    // Initialize health pickup sound
    const healthPickupSound = new Audio('/assets/health-pickup-6860.mp3');
    healthPickupSound.volume = 0.3; // Set volume to 30%
    healthPickupSoundRef.current = healthPickupSound;

    // Initialize berserker sound
    const berserkerSound = new Audio('/assets/monster-growl-390285.mp3');
    berserkerSound.volume = 0.3; // Set volume to 30%
    berserkerSoundRef.current = berserkerSound;

    // Initialize charging sound
    const chargingSound = new Audio('/assets/062708_laser-charging-81968.mp3');
    chargingSound.volume = 0.3; // Set volume to 30%
    chargingSoundRef.current = chargingSound;

    // Initialize charged shot sound
    const chargedShotSound = new Audio('/assets/lazer-gun-432285.mp3');
    chargedShotSound.volume = 0.3; // Set volume to 30%
    chargedShotSoundRef.current = chargedShotSound;

    // Initialize weak enemy blast sound
    const weakEnemyBlastSound = new Audio('/assets/blast-37988.mp3');
    weakEnemyBlastSound.volume = 0.3; // Set volume to 30%
    weakEnemyBlastSoundRef.current = weakEnemyBlastSound;

    // Initialize normal enemy death sound
    const normalEnemyDeathSound = new Audio('/assets/slime-squish-5-218569.mp3');
    normalEnemyDeathSound.volume = 0.3; // Set volume to 30%
    normalEnemyDeathSoundRef.current = normalEnemyDeathSound;

    // Initialize enemy projectile destroyed sound
    const enemyProjectileDestroyedSound = new Audio('/assets/attack-match-1-394505.mp3');
    enemyProjectileDestroyedSound.volume = 0.3; // Set volume to 30%
    enemyProjectileDestroyedSoundRef.current = enemyProjectileDestroyedSound;

    // Initialize enemy split sound
    const enemySplitSound = new Audio('/assets/impact-thud-372473.mp3');
    enemySplitSound.volume = 0.3; // Set volume to 30%
    enemySplitSoundRef.current = enemySplitSound;

    // Initialize energy beam sound (LAZER enemy major attack)
    const energyBeamSound = new Audio('/assets/heavy-beam-weapon-7052.mp3');
    energyBeamSound.volume = 0.4; // Set volume to 40%
    energyBeamSoundRef.current = energyBeamSound;

    // Initialize ability activation/deactivation sound
    const abilityActivationSound = new Audio('/assets/flame-spell-impact-393919.mp3');
    abilityActivationSound.volume = 0.3; // Set volume to 30%
    abilityActivationSoundRef.current = abilityActivationSound;

    // Create callback for enemy projectile sound
    const playEnemyProjectileSound = () => {
      if (isSfxEnabled && enemyProjectileSoundRef.current) {
        const sound = enemyProjectileSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    
    // Create callback for berserker sound
    const playBerserkerSound = () => {
      if (isSfxEnabled && berserkerSoundRef.current) {
        const sound = berserkerSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    
    // Create callback for charging sound
    const playChargingSound = () => {
      // Stop any currently playing charging sound
      if (currentChargingSoundRef.current) {
        currentChargingSoundRef.current.pause();
        currentChargingSoundRef.current.currentTime = 0;
        currentChargingSoundRef.current = null;
      }
      
      if (isSfxEnabled && chargingSoundRef.current) {
        const sound = chargingSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.loop = true; // Loop the charging sound
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
        currentChargingSoundRef.current = sound; // Track the currently playing sound
      }
    };
    
    // Create callback to stop charging sound
    const stopChargingSound = () => {
      if (currentChargingSoundRef.current) {
        currentChargingSoundRef.current.pause();
        currentChargingSoundRef.current.currentTime = 0;
        currentChargingSoundRef.current = null;
      }
    };
    
    // Create callback for charged shot sound
    const playChargedShotSound = () => {
      // Stop charging sound when shot is fired
      stopChargingSound();
      
      if (isSfxEnabled && chargedShotSoundRef.current) {
        const sound = chargedShotSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    
    // Create callback for weak enemy blast sound (only first 1 second)
    const playWeakEnemyBlastSound = () => {
      if (isSfxEnabled && weakEnemyBlastSoundRef.current) {
        const sound = weakEnemyBlastSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.currentTime = 0; // Start from beginning
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
        
        // Stop after 1 second
        setTimeout(() => {
          sound.pause();
          sound.currentTime = 0;
        }, 1000);
      }
    };
    
    // Create callback for normal enemy death sound
    const playNormalEnemyDeathSound = () => {
      if (isSfxEnabled && normalEnemyDeathSoundRef.current) {
        const sound = normalEnemyDeathSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    
    // Create callback for shield block sound
    const playShieldBlockSound = () => {
      if (isSfxEnabled && enemyProjectileDestroyedSoundRef.current) {
        const sound = enemyProjectileDestroyedSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    
    // Create callback for enemy split sound
    const playEnemySplitSound = () => {
      if (isSfxEnabled && enemySplitSoundRef.current) {
        const sound = enemySplitSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    
    // Create callback for energy beam sound (LAZER enemy major attack)
    const playEnergyBeamSound = () => {
      if (isSfxEnabled && energyBeamSoundRef.current) {
        const sound = energyBeamSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.4;
        sound.currentTime = 0; // Start from beginning
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
        // Stop after 2 seconds
        setTimeout(() => {
          sound.pause();
          sound.currentTime = 0;
        }, 2000);
      }
    };
    
    // Store callbacks in refs so they can be used by EnemyManager
    playEnemyProjectileSoundRef.current = playEnemyProjectileSound;
    playBerserkerSoundRef.current = playBerserkerSound;
    playChargingSoundRef.current = playChargingSound;
    stopChargingSoundRef.current = stopChargingSound;
    playChargedShotSoundRef.current = playChargedShotSound;
    playWeakEnemyBlastSoundRef.current = playWeakEnemyBlastSound;
    playNormalEnemyDeathSoundRef.current = playNormalEnemyDeathSound;
    
    // Update EnemyManager with sound callbacks
    enemyManagerRef.current = new EnemyManager(canvasWidth, canvasHeight, playEnemyProjectileSound, playBerserkerSound, playChargingSound, stopChargingSound, playChargedShotSound, playWeakEnemyBlastSound, playNormalEnemyDeathSound, playShieldBlockSound, playEnemySplitSound, playEnergyBeamSound);

    const waveManager = waveManagerRef.current;
    const enemyManager = enemyManagerRef.current;

    // Calculate initial world mouse position (center of screen)
    const initialWorldMouse = {
      x: playerPos.x,
      y: playerPos.y + 100, // Default to below player
    };

    waveManager.startWave();
    enemyManager.spawnWave(1, playerPos, initialWorldMouse);
    
    // Initialize ammo for starting weapon
    const maxAmmo = weapon.type === 'sword' ? Infinity : (GAME_BALANCE.ammo.maxAmmo[weapon.type as keyof typeof GAME_BALANCE.ammo.maxAmmo] || 0);
    setCurrentAmmo(maxAmmo);
    currentAmmoRef.current = maxAmmo;
  }, [weapon.type]);

  // Cleanup sounds when game ends or component unmounts
  useEffect(() => {
    if (isGameOver) {
      cleanupAllSounds();
    }
    
    // Cleanup on unmount
    return () => {
      cleanupAllSounds();
    };
  }, [isGameOver, cleanupAllSounds]);


  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isMouseDownRef.current = false;
  }, []);

  const fireWeapon = useCallback(() => {
    if (isGameOver || waveManagerRef.current.isShowingPowerUpSelection() || waveManagerRef.current.isWaveCompleted()) return;

    // Check ammo (sword has unlimited ammo)
    if (weapon.type !== 'sword' && currentAmmoRef.current <= 0) {
      return; // Out of ammo, can't fire
    }

    // Convert screen mouse position to world coordinates
    const cameraOffsetX = playerPosRef.current.x - canvasWidth / 2;
    const cameraOffsetY = playerPosRef.current.y - canvasHeight / 2;
    const worldMousePos = {
      x: mousePos.x + cameraOffsetX,
      y: mousePos.y + cameraOffsetY,
    };

    // Calculate gun barrel position (end of gun where bullets spawn)
    const gunAngle = Math.atan2(worldMousePos.y - playerPosRef.current.y, worldMousePos.x - playerPosRef.current.x);
    
    // Different sizes for different weapons
    let gunSize: number;
    if (weapon.type === 'rifle') {
      gunSize = PLAYER_SIZE * 0.9; // Rifle is 90% of player size (bigger)
    } else if (weapon.type === 'pistol') {
      gunSize = PLAYER_SIZE * 0.55; // Pistol is 55% of player size (smaller)
    } else if (weapon.type === 'shotgun') {
      gunSize = PLAYER_SIZE * 0.8; // Shotgun is 80% of player size
    } else {
      gunSize = PLAYER_SIZE * 0.7; // Other weapons are 70% of player size
    }
    
    const gunOffsetX = Math.cos(gunAngle) * (PLAYER_SIZE * 0.1); // Offset along weapon direction
    const gunOffsetY = Math.sin(gunAngle) * (PLAYER_SIZE * 0.1);
    const gunX = playerPosRef.current.x + gunOffsetX + (PLAYER_SIZE * 0.03); // Very small right offset
    const gunY = playerPosRef.current.y + gunOffsetY;
    
    // Calculate barrel tip position (end of gun sprite)
    const barrelLength = gunSize * 0.5; // Barrel extends about half the gun size forward
    const gunBarrelPos = {
      x: gunX + Math.cos(gunAngle) * barrelLength,
      y: gunY + Math.sin(gunAngle) * barrelLength,
    };

    const newProjectiles = weaponManagerRef.current.attack(
      gunBarrelPos, // Use gun barrel position instead of player position
      worldMousePos,
      playerStatsRef.current,
      Date.now()
    );

    if (newProjectiles.length > 0) {
      projectilesRef.current.push(...newProjectiles);
      
      // Decrease ammo (sword has unlimited ammo)
      if (weapon.type !== 'sword') {
        const newAmmo = Math.max(0, currentAmmoRef.current - 1);
        setCurrentAmmo(newAmmo);
        currentAmmoRef.current = newAmmo;
      }
      
      // Play pistol sound effect when pistol, assault rifle, or machine gun is fired
      if (isSfxEnabled && (weapon.type === 'pistol' || weapon.type === 'assault_rifle' || weapon.type === 'machine_gun') && pistolSoundRef.current) {
        const sound = pistolSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.1; // Reduced from 0.3 to 0.15 (15%)
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
      
      // Play rifle sound effect when rifle is fired
      if (isSfxEnabled && weapon.type === 'rifle' && rifleSoundRef.current) {
        const sound = rifleSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
      
      // Play shotgun sound effect when shotgun is fired
      if (isSfxEnabled && weapon.type === 'shotgun' && shotgunSoundRef.current) {
        const sound = shotgunSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
      
      // If sword attack, create slash animation at sword tip (extended for range)
      if (weapon.type === 'sword' && newProjectiles.length > 0) {
        // Play sword sound effect
        if (isSfxEnabled && swordSoundRef.current) {
          const sound = swordSoundRef.current.cloneNode() as HTMLAudioElement;
          sound.volume = 0.3;
          sound.play().catch(() => {
            // Ignore autoplay errors
          });
        }
        
        const slashAngle = Math.atan2(worldMousePos.y - playerPosRef.current.y, worldMousePos.x - playerPosRef.current.x);
        
        // Calculate sword position (same as in rendering)
        const swordSize = PLAYER_SIZE * 0.85; // Match the rendering size
        const swordOffsetX = Math.cos(slashAngle) * (PLAYER_SIZE * 0.1);
        const swordOffsetY = Math.sin(slashAngle) * (PLAYER_SIZE * 0.1);
        const swordX = playerPosRef.current.x + swordOffsetX + (PLAYER_SIZE * 0.03);
        const swordY = playerPosRef.current.y + swordOffsetY;
        
        // Calculate sword tip position
        // The sword PNG is diagonal (45 degrees), so we need to account for that
        // The sprite extends diagonally, so the tip is further along the angle
        // Since the sword sprite is diagonal, the tip extends at the sword angle + the diagonal offset
        const swordTipDistance = swordSize * 0.6; // Slightly more to account for diagonal sprite
        const swordTipX = swordX + Math.cos(slashAngle) * swordTipDistance;
        const swordTipY = swordY + Math.sin(slashAngle) * swordTipDistance;
        
        // Add distance between sword tip and slash animation (gap for visual effect)
        // The slash should be straight along the sword's direction
        const gapDistance = 60; // Distance between sword tip and animation
        const slashX = swordTipX + Math.cos(slashAngle) * gapDistance;
        const slashY = swordTipY + Math.sin(slashAngle) * gapDistance;
        
        slashAnimationsRef.current.push({
          id: `slash-${Date.now()}-${Math.random()}`,
          position: { x: slashX, y: slashY },
          angle: slashAngle, // Align with sword angle
          life: 1.0,
          maxLife: 1.0,
          size: 120, // Size for the PNG
        });
        
        // Track sword attack for animation
        swordAttackAngleRef.current = slashAngle;
        swordAttackTimeRef.current = Date.now();
      }
    }
  }, [isGameOver, mousePos, canvasWidth, canvasHeight, weapon.type, isSfxEnabled]);

  const handleMouseDown = useCallback(() => {
    isMouseDownRef.current = true;
    fireWeapon();
  }, [fireWeapon]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mouseup', handleMouseUp); // Also listen on window in case mouse released outside canvas

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseDown, handleMouseUp]);

  const handlePowerUpSelect = (powerUp: PowerUp) => {
    // Check if this is an ability power-up
    if (powerUp.abilityType) {
      // Add ability to player's abilities if not already owned
      setActiveAbilities((prev) => {
        const alreadyHasAbility = prev.some(a => a.type === powerUp.abilityType);
        if (alreadyHasAbility) {
          // Already have this ability, just apply stat effect if any
          return prev;
        }
        // Add new ability
        return [...prev, { type: powerUp.abilityType!, endTime: 0, cooldownEndTime: 0 }];
      });
    } else {
      // Regular stat power-up
      setPlayerStats((prev) => powerUp.effect(prev));
    }
    
    setAvailablePowerUps([]);

    const waveManager = waveManagerRef.current;
    const enemyManager = enemyManagerRef.current;

    // Calculate world mouse position for enemy spawning direction
    const cameraOffsetX = playerPosRef.current.x - canvasWidth / 2;
    const cameraOffsetY = playerPosRef.current.y - canvasHeight / 2;
    const worldMousePos = {
      x: mousePos.x + cameraOffsetX,
      y: mousePos.y + cameraOffsetY,
    };

    waveManager.nextWave();
    enemyManager.spawnWave(waveManager.getCurrentWave(), playerPosRef.current, worldMousePos);
    
    // Reset ammo for new wave
    const maxAmmo = weapon.type === 'sword' ? Infinity : (GAME_BALANCE.ammo.maxAmmo[weapon.type as keyof typeof GAME_BALANCE.ammo.maxAmmo] || 0);
    setCurrentAmmo(maxAmmo);
    currentAmmoRef.current = maxAmmo;
  };

  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    playerStatsRef.current = playerStats;
  }, [playerStats]);

  // Get max ammo for current weapon
  const getMaxAmmo = useCallback(() => {
    if (weapon.type === 'sword') return Infinity; // Sword has unlimited ammo
    const maxAmmoMap = GAME_BALANCE.ammo.maxAmmo;
    return maxAmmoMap[weapon.type as keyof typeof maxAmmoMap] || 0;
  }, [weapon.type]);

  // Create health pickup at position
  const createHealthPickup = useCallback((position: Position) => {
    const healthPickup: HealthPickup = {
      id: generateId(),
      position: { ...position },
      healAmount: GAME_BALANCE.healthPickups.healAmount,
      size: GAME_BALANCE.healthPickups.size,
      life: 0, // For pulsing animation
    };
    healthPickupsRef.current.push(healthPickup);
  }, []);

  // Create ammo pickup at position
  const createAmmoPickup = useCallback((position: Position) => {
    const ammoPickup: AmmoPickup = {
      id: generateId(),
      position: { ...position },
      ammoAmount: GAME_BALANCE.ammo.pickupAmount,
      size: GAME_BALANCE.ammo.size,
      life: 0, // For pulsing animation
    };
    ammoPickupsRef.current.push(ammoPickup);
  }, []);

  // Create vest pickup at position
  const createVestPickup = useCallback((position: Position) => {
    const vestPickup: VestPickup = {
      id: generateId(),
      position: { ...position },
      blueHealthAmount: GAME_BALANCE.vests.blueHealthAmount,
      size: GAME_BALANCE.vests.size,
      life: 0, // For pulsing animation
    };
    vestPickupsRef.current.push(vestPickup);
  }, []);

  // Apply damage to player (uses blue health first, then regular health)
  const applyDamage = useCallback((damage: number, stats: PlayerStats): PlayerStats => {
    let remainingDamage = damage;
    let newBlueHealth = stats.blueHealth;
    let newHealth = stats.health;

    // First, damage blue health
    if (newBlueHealth > 0) {
      if (remainingDamage >= newBlueHealth) {
        remainingDamage -= newBlueHealth;
        newBlueHealth = 0;
      } else {
        newBlueHealth -= remainingDamage;
        remainingDamage = 0;
      }
    }

    // Then, damage regular health
    if (remainingDamage > 0) {
      newHealth -= remainingDamage;
    }

    return { ...stats, blueHealth: newBlueHealth, health: newHealth };
  }, []);

  // Create blood particle effect
  const createBloodEffect = useCallback((position: Position, size: number, intensity: number = 1) => {
    const particleCount = Math.floor(size / 3 * intensity); // More particles for larger sizes and higher intensity
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = (2 + Math.random() * 3) * intensity;
      
      bloodParticlesRef.current.push({
        id: `${Date.now()}-${Math.random()}`,
        position: { 
          x: position.x + (Math.random() - 0.5) * size * 0.5,
          y: position.y + (Math.random() - 0.5) * size * 0.5
        },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        size: 3 + Math.random() * 4,
        life: 1.0,
        maxLife: 1.0,
      });
    }
  }, []);

  const createFireExplosion = useCallback((position: Position, size: number, intensity: number = 1) => {
    const particleCount = Math.floor(size / 4 * intensity); // Reduced particle count for less intense explosions
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.6;
      const speed = (2 + Math.random() * 3) * intensity; // Reduced speed
      
      bloodParticlesRef.current.push({
        id: `fire-${Date.now()}-${Math.random()}`,
        position: { 
          x: position.x + (Math.random() - 0.5) * size * 0.2, // Smaller spawn area
          y: position.y + (Math.random() - 0.5) * size * 0.2
        },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        size: 3 + Math.random() * 4, // Smaller particles
        life: 1.0,
        maxLife: 0.8, // Shorter lifetime for less lingering effect
      });
    }
  }, []);

  // Handle E key press to continue to power-up selection or activate abilities
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't handle keys when exit confirmation is shown (let Escape handler take over)
      // Also don't handle Escape key here - let the Escape handler take care of it
      if (showExitConfirm || e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        return;
      }
      
      if (e.key === 'e' || e.key === 'E') {
        const waveManager = waveManagerRef.current;
        
        // First check if wave is completed (priority)
        if (waveManager.isWaveCompleted() && !waveManager.isShowingPowerUpSelection()) {
          waveManager.showPowerUpSelection();
          setAvailablePowerUps(waveManager.getRandomPowerUps(3));
          return;
        }
        
        // Otherwise, try to activate abilities (1 for first, 2 for second)
        // We'll use number keys 1 and 2 for abilities
      }
      
      // Number keys 1-5 activate abilities (if player has them)
      if (e.key >= '1' && e.key <= '5') {
        const abilityIndex = parseInt(e.key) - 1;
        const currentTime = Date.now();
        
        setActiveAbilities((prev) => {
          if (prev[abilityIndex]) {
            const ability = prev[abilityIndex];
            const abilityData = getAbilityByType(ability.type);
            
            if (!abilityData) return prev;
            
            // Check if on cooldown
            if (currentTime < ability.cooldownEndTime) {
              return prev; // Still on cooldown
            }
            
            // Activate ability
            const newAbilities = [...prev];
            newAbilities[abilityIndex] = {
              ...ability,
              endTime: currentTime + abilityData.duration,
              cooldownEndTime: currentTime + abilityData.duration + abilityData.cooldown,
            };
            
            // Play ability activation sound
            if (isSfxEnabled && abilityActivationSoundRef.current) {
              const sound = abilityActivationSoundRef.current.cloneNode() as HTMLAudioElement;
              sound.volume = 0.3;
              sound.play().catch(() => {
                // Ignore autoplay errors
              });
            }
            
            return newAbilities;
          }
          return prev;
        });
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showExitConfirm]);

  // Track ability expiration to play deactivation sound
  const prevActiveAbilitiesRef = useRef<ActiveAbilityState[]>([]);
  useEffect(() => {
    const currentTime = Date.now();
    
    // Check if any ability just expired (was active before, now inactive)
    prevActiveAbilitiesRef.current.forEach((prevAbility) => {
      const wasActive = currentTime < prevAbility.endTime;
      const currentAbility = activeAbilities.find(a => a.type === prevAbility.type);
      
      if (wasActive && currentAbility) {
        const isNowActive = currentTime < currentAbility.endTime;
        if (!isNowActive) {
          // Ability just expired, play deactivation sound
          if (isSfxEnabled && abilityActivationSoundRef.current) {
            const sound = abilityActivationSoundRef.current.cloneNode() as HTMLAudioElement;
            sound.volume = 0.3;
            sound.play().catch(() => {
              // Ignore autoplay errors
            });
          }
        }
      }
    });
    
    // Update previous state
    prevActiveAbilitiesRef.current = activeAbilities;
  }, [activeAbilities]);

  // Update refs when state changes
  useEffect(() => {
    showExitConfirmRef.current = showExitConfirm;
  }, [showExitConfirm]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Handle Escape key to pause game or confirm exit
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      // Check for Escape key (can be 'Escape' or 'Esc' depending on browser)
      if (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27) {
        e.preventDefault();
        e.stopPropagation();
        
        // If exit confirmation is shown, confirm exit
        if (showExitConfirmRef.current) {
          cleanupAllSounds();
          onReturnToMenu();
        } 
        // If paused, resume
        else if (isPausedRef.current) {
          setIsPaused(false);
        }
        // Otherwise, pause the game
        else if (!isGameOver && !waveManagerRef.current.isShowingPowerUpSelection() && !waveManagerRef.current.isWaveCompleted()) {
          setIsPaused(true);
        }
      }
    };

    // Use capture phase to ensure this handler runs first
    window.addEventListener('keydown', handleEscape, true);
    return () => window.removeEventListener('keydown', handleEscape, true);
  }, [cleanupAllSounds, onReturnToMenu, isGameOver]);

  const gameLoop = useCallback(
    (deltaTime: number) => {
      if (isGameOver || waveManagerRef.current.isShowingPowerUpSelection() || waveManagerRef.current.isWaveCompleted()) return;

      // Auto-fire when mouse is held down
      if (isMouseDownRef.current) {
        fireWeapon();
      }

      const enemyManager = enemyManagerRef.current;
      const waveManager = waveManagerRef.current;

      // Check active abilities
      const currentTime = Date.now();
      const isShieldActive = activeAbilities.some(a => a.type === ActiveAbilityType.SHIELD && currentTime < a.endTime);
      const isFireRingActive = activeAbilities.some(a => a.type === ActiveAbilityType.FIRE_RING && currentTime < a.endTime);
      const isSpeedBoostActive = activeAbilities.some(a => a.type === ActiveAbilityType.SPEED_BOOST && currentTime < a.endTime);
      const isDamageBoostActive = activeAbilities.some(a => a.type === ActiveAbilityType.DAMAGE_BOOST && currentTime < a.endTime);
      const isFreezeActive = activeAbilities.some(a => a.type === ActiveAbilityType.FREEZE && currentTime < a.endTime);

      let newPlayerPos = { ...playerPosRef.current };
      // Apply speed boost if active
      const baseSpeed = playerStatsRef.current.movementSpeed;
      const effectiveSpeed = isSpeedBoostActive ? baseSpeed * 1.5 : baseSpeed; // Doubled from 1.5x to 2.0x
      const speed = effectiveSpeed * (deltaTime / 16);

      if (keys['w'] || keys['arrowup']) newPlayerPos.y -= speed;
      if (keys['s'] || keys['arrowdown']) newPlayerPos.y += speed;
      if (keys['a'] || keys['arrowleft']) newPlayerPos.x -= speed;
      if (keys['d'] || keys['arrowright']) newPlayerPos.x += speed;

      // No boundary clamping - infinite world

      setPlayerPos(newPlayerPos);
      playerPosRef.current = newPlayerPos;

      // Update screen shake (for lightning effects)
      const activeLightningBeamsForShake = enemyManager.getLightningBeams();
      const currentLightningCount = activeLightningBeamsForShake.length;
      
      // Trigger shake when new lightning is created
      if (currentLightningCount > lastLaserBeamCountRef.current) {
        // New lightning created - trigger shake
        screenShakeRef.current = {
          x: 0,
          y: 0,
          intensity: 8, // Moderate shake intensity for lightning
          endTime: currentTime + 500, // Shake for duration of lightning
        };
      }
      lastLaserBeamCountRef.current = currentLightningCount;
      
      // Update screen shake - keep shaking while any lightning is active
      const hasActiveLightning = activeLightningBeamsForShake.some(beam => currentTime < beam.endTime);
      
      if (hasActiveLightning) {
        // Keep shaking while lightning is active
        if (!screenShakeRef.current || currentTime >= screenShakeRef.current.endTime) {
          screenShakeRef.current = {
            x: 0,
            y: 0,
            intensity: 6, // Continuous shake intensity
            endTime: currentTime + 100, // Will be extended while lightning is active
          };
        }
        
        // Extend shake duration while lightning is active
        const maxBeamEndTime = Math.max(...activeLightningBeamsForShake.map(b => b.endTime), currentTime);
        screenShakeRef.current.endTime = maxBeamEndTime;
        
        // Calculate shake intensity (stronger at start, gradually decreases)
        const oldestBeam = activeLightningBeamsForShake.reduce((oldest, beam) => 
          beam.startTime < oldest.startTime ? beam : oldest, activeLightningBeamsForShake[0]);
        const beamAge = currentTime - oldestBeam.startTime;
        const totalDuration = 500;
        const shakeProgress = Math.min(1.0, beamAge / totalDuration);
        // Start strong, fade slightly but stay intense
        const currentIntensity = screenShakeRef.current.intensity * (1.0 - shakeProgress * 0.3);
        
        // Random shake offset with some smoothing
        screenShakeRef.current.x = (Math.random() - 0.5) * currentIntensity;
        screenShakeRef.current.y = (Math.random() - 0.5) * currentIntensity;
      } else {
        // No active beams - fade out shake
        if (screenShakeRef.current && currentTime < screenShakeRef.current.endTime) {
          const timeRemaining = screenShakeRef.current.endTime - currentTime;
          const fadeProgress = Math.max(0, 1.0 - timeRemaining / 200); // Fade out over 200ms
          const currentIntensity = screenShakeRef.current.intensity * (1.0 - fadeProgress);
          
          screenShakeRef.current.x = (Math.random() - 0.5) * currentIntensity;
          screenShakeRef.current.y = (Math.random() - 0.5) * currentIntensity;
        } else {
          screenShakeRef.current = null;
        }
      }

      // Calculate world mouse position for enemy spawning direction
      const shakeOffsetX = screenShakeRef.current ? screenShakeRef.current.x : 0;
      const shakeOffsetY = screenShakeRef.current ? screenShakeRef.current.y : 0;
      const cameraOffsetX = newPlayerPos.x - canvasWidth / 2 + shakeOffsetX;
      const cameraOffsetY = newPlayerPos.y - canvasHeight / 2 + shakeOffsetY;
      const worldMousePos = {
        x: mousePos.x + cameraOffsetX,
        y: mousePos.y + cameraOffsetY,
      };

      enemyManager.updateEnemies(newPlayerPos, deltaTime, waveManager.isWaveInProgress(), worldMousePos, isFreezeActive);

      projectilesRef.current.forEach((proj) => {
        proj.position.x += proj.velocity.x;
        proj.position.y += proj.velocity.y;
      });

      // Remove projectiles that are too far from player (infinite world)
      const maxProjectileDistance = 1000;
      projectilesRef.current = projectilesRef.current.filter((proj) => {
        const dx = proj.position.x - newPlayerPos.x;
        const dy = proj.position.y - newPlayerPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < maxProjectileDistance;
      });

      const remainingProjectiles: Projectile[] = [];
      const enemyProjectiles = enemyManager.getEnemyProjectiles();
      
      projectilesRef.current.forEach((proj) => {
        let hit = false;

        // Check collision with enemy projectiles first
        enemyProjectiles.forEach((enemyProj) => {
          if (checkCollision(proj.position, proj.size, enemyProj.position, enemyProj.size)) {
            // Player bullet destroys enemy projectile (unless it's indestructible)
            if (!enemyProj.indestructible) {
              enemyManager.removeEnemyProjectile(enemyProj.id);
              // Create small explosion effect
              createBloodEffect(enemyProj.position, 15, 0.5);
              
              // Play explosion sound effect
              if (isSfxEnabled && enemyProjectileDestroyedSoundRef.current) {
                const sound = enemyProjectileDestroyedSoundRef.current.cloneNode() as HTMLAudioElement;
                sound.volume = 0.3;
                sound.play().catch(() => {
                  // Ignore autoplay errors
                });
              }
              
              // Player projectile is destroyed unless it's piercing
              if (!proj.piercing) {
                hit = true;
              }
            } else {
              // Indestructible projectile (charged shot) - player projectile is destroyed but enemy projectile continues
              if (!proj.piercing) {
                hit = true;
              }
            }
          }
        });

        // Only check enemy collision if projectile hasn't been destroyed
        if (!hit) {
          enemyManager.getEnemies().forEach((enemy) => {
            if (checkCollision(proj.position, proj.size, enemy.position, enemy.size)) {
              // Apply damage boost if active
              const effectiveDamage = isDamageBoostActive ? proj.damage * 5 : proj.damage; // Increased from 3x to 5x
              
              const result = enemyManager.damageEnemy(
                enemy.id,
                effectiveDamage,
                playerStatsRef.current.knockback,
                newPlayerPos
              );
              
              // Create blood effect if enemy was killed
              if (result.killed && result.position) {
                // 20% chance to drop health pickup when enemy is killed
                if (Math.random() < 0.20) {
                  createHealthPickup(result.position);
                }
                
                // Drop ammo pickup from enemies (only if not using sword)
                if (weapon.type !== 'sword' && Math.random() < GAME_BALANCE.ammo.dropChance) {
                  createAmmoPickup(result.position);
                }
                
                // Drop vest pickup from enemies
                if (Math.random() < GAME_BALANCE.vests.dropChance) {
                  createVestPickup(result.position);
                }
                
                // WEAK enemies always create fire explosion effect on death
                if (result.exploded) {
                  createFireExplosion(result.position, enemy.size * 1.2, 1.5); // Smaller, less intense fire explosion
                  // Apply explosion damage to player if explosionDamage > 0 (player was in range)
                  if (result.explosionDamage && result.explosionDamage > 0) {
                    if (isShieldActive) {
                      // Play shield block sound (throttled to prevent spam)
                      if (currentTime - lastShieldBlockSoundRef.current > 200) {
                        if (isSfxEnabled && enemyProjectileDestroyedSoundRef.current) {
                          const sound = enemyProjectileDestroyedSoundRef.current.cloneNode() as HTMLAudioElement;
                          sound.volume = 0.3;
                          sound.play().catch(() => {
                            // Ignore autoplay errors
                          });
                        }
                        lastShieldBlockSoundRef.current = currentTime;
                      }
                    } else {
                      setPlayerStats((prev) => {
                        const newStats = applyDamage(result.explosionDamage!, prev);
                        if (newStats.health <= 0) {
                          createBloodEffect(newPlayerPos, PLAYER_SIZE, 5);
                          setIsGameOver(true);
                          return { ...newStats, health: 0 };
                        }
                        createBloodEffect(newPlayerPos, PLAYER_SIZE * 0.7, 1.5);
                        return newStats;
                      });
                    }
                  }
                } else {
                  createBloodEffect(result.position, enemy.size, 1);
                }
              }
              
              if (!proj.piercing) {
                hit = true;
              }
            }
          });
        }

        // Instant melee attacks disappear immediately after collision check
        if (proj.isInstant) {
          return; // Don't add to remaining projectiles - disappears after one frame
        }

        if (!hit) {
          remainingProjectiles.push(proj);
        }
      });

      projectilesRef.current = remainingProjectiles;

      // Update and remove expired blood particles
      const deltaTimeSeconds = deltaTime / 1000;
      bloodParticlesRef.current = bloodParticlesRef.current
        .map((particle) => {
          // Update position
          particle.position.x += particle.velocity.x * deltaTimeSeconds * 60;
          particle.position.y += particle.velocity.y * deltaTimeSeconds * 60;
          
          // Apply gravity
          particle.velocity.y += 0.3 * deltaTimeSeconds * 60;
          
          // Fade out
          particle.life -= deltaTimeSeconds * 2;
          
          return particle;
        })
        .filter((particle) => particle.life > 0);

      // Update slash animations
      slashAnimationsRef.current = slashAnimationsRef.current
        .map((slash) => {
          slash.life -= deltaTimeSeconds * 5; // Fade out quickly (200ms total)
          return slash;
        })
        .filter((slash) => slash.life > 0);

      // Reset sword attack animation after 200ms
      if (swordAttackAngleRef.current !== null && Date.now() - swordAttackTimeRef.current > 200) {
        swordAttackAngleRef.current = null;
      }

      // Spawn health pickups periodically (some come from enemy drops too)
      const healthPickupSpawnTime = Date.now();
      const healthPickupSpawnInterval = GAME_BALANCE.healthPickups.spawnInterval * 1.2; // Slightly increased to account for enemy drops
      if (healthPickupSpawnTime - lastHealthPickupSpawnRef.current >= healthPickupSpawnInterval) {
        // Spawn health pickup at random position near player but not too close
        const spawnDistance = GAME_BALANCE.healthPickups.spawnDistance.min + 
          Math.random() * (GAME_BALANCE.healthPickups.spawnDistance.max - GAME_BALANCE.healthPickups.spawnDistance.min);
        const angle = Math.random() * Math.PI * 2;
        const healthPickup: HealthPickup = {
          id: generateId(),
          position: {
            x: newPlayerPos.x + Math.cos(angle) * spawnDistance,
            y: newPlayerPos.y + Math.sin(angle) * spawnDistance,
          },
          healAmount: GAME_BALANCE.healthPickups.healAmount,
          size: GAME_BALANCE.healthPickups.size,
          life: 0, // For pulsing animation
        };
        healthPickupsRef.current.push(healthPickup);
        lastHealthPickupSpawnRef.current = healthPickupSpawnTime;
      }

      // Update health pickups animation and check collision with player
      healthPickupsRef.current = healthPickupsRef.current.filter((pickup) => {
        // Update pulsing animation
        pickup.life += deltaTime / 1000 * 3; // Pulse speed
        
        // Check collision with player
        if (checkCollision(pickup.position, pickup.size, newPlayerPos, PLAYER_SIZE)) {
          // Player collected health pickup
          setPlayerStats((prev) => {
            const newHealth = Math.min(prev.maxHealth, prev.health + pickup.healAmount);
            return { ...prev, health: newHealth };
          });
          
          // Play health pickup sound effect
          if (isSfxEnabled && healthPickupSoundRef.current) {
            const sound = healthPickupSoundRef.current.cloneNode() as HTMLAudioElement;
            sound.volume = 0.3;
            sound.play().catch(() => {
              // Ignore autoplay errors
            });
          }
          
          return false; // Remove pickup
        }
        
        // Remove pickups that are too far from player
        const dist = distance(pickup.position, newPlayerPos);
        return dist < GAME_BALANCE.healthPickups.despawnDistance;
      });

      // Spawn ammo pickups periodically (only if not using sword)
      if (weapon.type !== 'sword') {
        const ammoPickupSpawnTime = Date.now();
        const ammoPickupSpawnInterval = GAME_BALANCE.ammo.spawnInterval;
        if (ammoPickupSpawnTime - lastAmmoPickupSpawnRef.current >= ammoPickupSpawnInterval) {
          // Spawn ammo pickup at random position near player but not too close
          const spawnDistance = GAME_BALANCE.ammo.spawnDistance.min + 
            Math.random() * (GAME_BALANCE.ammo.spawnDistance.max - GAME_BALANCE.ammo.spawnDistance.min);
          const angle = Math.random() * Math.PI * 2;
          const ammoPickup: AmmoPickup = {
            id: generateId(),
            position: {
              x: newPlayerPos.x + Math.cos(angle) * spawnDistance,
              y: newPlayerPos.y + Math.sin(angle) * spawnDistance,
            },
            ammoAmount: GAME_BALANCE.ammo.pickupAmount,
            size: GAME_BALANCE.ammo.size,
            life: 0, // For pulsing animation
          };
          ammoPickupsRef.current.push(ammoPickup);
          lastAmmoPickupSpawnRef.current = ammoPickupSpawnTime;
        }
      }

      // Update ammo pickups animation and check collision with player
      if (weapon.type !== 'sword') {
        ammoPickupsRef.current = ammoPickupsRef.current.filter((pickup) => {
          // Update pulsing animation
          pickup.life += deltaTime / 1000 * 3; // Pulse speed
          
          // Check collision with player
          if (checkCollision(pickup.position, pickup.size, newPlayerPos, PLAYER_SIZE)) {
            // Player collected ammo pickup
            const maxAmmo = getMaxAmmo();
            const newAmmo = Math.min(maxAmmo, currentAmmoRef.current + pickup.ammoAmount);
            setCurrentAmmo(newAmmo);
            currentAmmoRef.current = newAmmo;
            
            // Play health pickup sound effect (reuse for ammo)
            if (isSfxEnabled && healthPickupSoundRef.current) {
              const sound = healthPickupSoundRef.current.cloneNode() as HTMLAudioElement;
              sound.volume = 0.3;
              sound.play().catch(() => {
                // Ignore autoplay errors
              });
            }
            
            return false; // Remove pickup
          }
          
          // Remove pickups that are too far from player
          const dist = distance(pickup.position, newPlayerPos);
          return dist < GAME_BALANCE.ammo.despawnDistance;
        });
      }

      // Spawn vest pickups periodically
      const vestPickupSpawnTime = Date.now();
      const vestPickupSpawnInterval = GAME_BALANCE.vests.spawnInterval;
      if (vestPickupSpawnTime - lastVestPickupSpawnRef.current >= vestPickupSpawnInterval) {
        // Spawn vest pickup at random position near player but not too close
        const spawnDistance = GAME_BALANCE.vests.spawnDistance.min + 
          Math.random() * (GAME_BALANCE.vests.spawnDistance.max - GAME_BALANCE.vests.spawnDistance.min);
        const angle = Math.random() * Math.PI * 2;
        const vestPickup: VestPickup = {
          id: generateId(),
          position: {
            x: newPlayerPos.x + Math.cos(angle) * spawnDistance,
            y: newPlayerPos.y + Math.sin(angle) * spawnDistance,
          },
          blueHealthAmount: GAME_BALANCE.vests.blueHealthAmount,
          size: GAME_BALANCE.vests.size,
          life: 0, // For pulsing animation
        };
        vestPickupsRef.current.push(vestPickup);
        lastVestPickupSpawnRef.current = vestPickupSpawnTime;
      }

      // Update vest pickups animation and check collision with player
      vestPickupsRef.current = vestPickupsRef.current.filter((pickup) => {
        // Update pulsing animation
        pickup.life += deltaTime / 1000 * 3; // Pulse speed
        
        // Check collision with player
        if (checkCollision(pickup.position, pickup.size, newPlayerPos, PLAYER_SIZE)) {
          // Player collected vest pickup
          setPlayerStats((prev) => ({
            ...prev,
            blueHealth: Math.min(120, prev.blueHealth + pickup.blueHealthAmount) // Cap at 120
          }));
          
          // Play health pickup sound effect (reuse for vest)
          if (isSfxEnabled && healthPickupSoundRef.current) {
            const sound = healthPickupSoundRef.current.cloneNode() as HTMLAudioElement;
            sound.volume = 0.3;
            sound.play().catch(() => {
              // Ignore autoplay errors
            });
          }
          
          return false; // Remove pickup
        }
        
        // Remove pickups that are too far from player
        const dist = distance(pickup.position, newPlayerPos);
        return dist < GAME_BALANCE.vests.despawnDistance;
      });

      // Fire ring damages nearby enemies (with damage tick rate and persistent burn)
      if (isFireRingActive) {
        const fireRingRadius = 400; // Increased from 300
        const fireRingDamage = 60; // Doubled from 30
        const fireRingTickRate = 500; // Damage every 500ms
        const burnDuration = 3000; // Burn lasts 3 seconds
        
        // Mark enemies in fire ring range and apply burn effect
        enemyManager.getEnemies().forEach((enemy) => {
          const dist = distance(newPlayerPos, enemy.position);
          if (dist < fireRingRadius) {
            // Enemy touches fire ring - apply 3 second burn
            if (!enemy.burnEndTime || enemy.burnEndTime < currentTime + burnDuration) {
              enemy.burnEndTime = currentTime + burnDuration; // Set burn to last at least 3 seconds
            }
            enemy.isBurning = true;
          }
        });
        
        // Apply damage to burning enemies (both in range and with active burn effect)
        if (currentTime - lastFireRingDamageRef.current >= fireRingTickRate) {
          enemyManager.getEnemies().forEach((enemy) => {
            // Check if enemy is burning (either in range or has active burn timer)
            const isInRange = distance(newPlayerPos, enemy.position) < fireRingRadius;
            const hasActiveBurn = enemy.burnEndTime && enemy.burnEndTime > currentTime;
            
            if (isInRange || hasActiveBurn) {
              // Update isBurning status
              enemy.isBurning = hasActiveBurn || isInRange;
              
              // Apply damage
              const result = enemyManager.damageEnemy(
                enemy.id,
                fireRingDamage,
                0,
                newPlayerPos
              );
              if (result.killed && result.position) {
                // 20% chance to drop health pickup when enemy is killed
                if (Math.random() < 0.20) {
                  createHealthPickup(result.position);
                }
                
                // Drop ammo pickup from enemies (only if not using sword)
                if (weapon.type !== 'sword' && Math.random() < GAME_BALANCE.ammo.dropChance) {
                  createAmmoPickup(result.position);
                }
                
                // Drop vest pickup from enemies
                if (Math.random() < GAME_BALANCE.vests.dropChance) {
                  createVestPickup(result.position);
                }
                
                // WEAK enemies always create fire explosion effect on death
                if (result.exploded) {
                  createFireExplosion(result.position, enemy.size * 1.2, 1.5); // Smaller, less intense fire explosion
                  // Apply explosion damage to player if explosionDamage > 0 (player was in range)
                  if (result.explosionDamage && result.explosionDamage > 0) {
                    if (isShieldActive) {
                      // Play shield block sound (throttled to prevent spam)
                      if (currentTime - lastShieldBlockSoundRef.current > 200) {
                        if (isSfxEnabled && enemyProjectileDestroyedSoundRef.current) {
                          const sound = enemyProjectileDestroyedSoundRef.current.cloneNode() as HTMLAudioElement;
                          sound.volume = 0.3;
                          sound.play().catch(() => {
                            // Ignore autoplay errors
                          });
                        }
                        lastShieldBlockSoundRef.current = currentTime;
                      }
                    } else {
                      setPlayerStats((prev) => {
                        const newStats = applyDamage(result.explosionDamage!, prev);
                        if (newStats.health <= 0) {
                          createBloodEffect(newPlayerPos, PLAYER_SIZE, 5);
                          setIsGameOver(true);
                          return { ...newStats, health: 0 };
                        }
                        createBloodEffect(newPlayerPos, PLAYER_SIZE * 0.7, 1.5);
                        return newStats;
                      });
                    }
                  }
                } else {
                  createBloodEffect(result.position, enemy.size, 1);
                }
              }
            }
          });
          lastFireRingDamageRef.current = currentTime;
        }
        
        // Update isBurning status for enemies with active burn timers (even if not in range)
        enemyManager.getEnemies().forEach((enemy) => {
          if (enemy.burnEndTime && enemy.burnEndTime > currentTime) {
            enemy.isBurning = true;
          } else {
            // Only clear isBurning if not in range and burn timer expired
            const dist = distance(newPlayerPos, enemy.position);
            if (dist >= fireRingRadius) {
              enemy.isBurning = false;
            }
          }
        });
        
        // Update fire ring animation
        fireRingAnimationRef.current += deltaTime / 1000 * 2;
      } else {
        // Fire ring not active - clear burn status for enemies whose burn timer expired
        enemyManager.getEnemies().forEach((enemy) => {
          if (enemy.burnEndTime && enemy.burnEndTime <= currentTime) {
            enemy.isBurning = false;
          }
        });
        fireRingAnimationRef.current = 0;
      }
      
      // Apply burn damage to enemies with active burn timers (even if fire ring is not active)
      const burnDamage = 60; // Increased from 30
      const burnTickRate = 500;
      if (!isFireRingActive && currentTime - lastFireRingDamageRef.current >= burnTickRate) {
        enemyManager.getEnemies().forEach((enemy) => {
          // Check if enemy has active burn timer
          const hasActiveBurn = enemy.burnEndTime && enemy.burnEndTime > currentTime;
          
          if (hasActiveBurn) {
            // Apply burn damage
            enemy.isBurning = true;
            const result = enemyManager.damageEnemy(
              enemy.id,
              burnDamage,
              0,
              newPlayerPos
            );
            if (result.killed && result.position) {
              // 20% chance to drop health pickup when enemy is killed
              if (Math.random() < 0.20) {
                createHealthPickup(result.position);
              }
              
              // Drop ammo pickup from enemies (only if not using sword)
              if (weapon.type !== 'sword' && Math.random() < GAME_BALANCE.ammo.dropChance) {
                createAmmoPickup(result.position);
              }
              
              // Drop vest pickup from enemies
              if (Math.random() < GAME_BALANCE.vests.dropChance) {
                createVestPickup(result.position);
              }
              
              createBloodEffect(result.position, enemy.size, 1);
            }
          }
        });
        // Update timer if we have any burning enemies
        if (enemyManager.getEnemies().some(e => e.burnEndTime && e.burnEndTime > currentTime)) {
          lastFireRingDamageRef.current = currentTime;
        }
      }

      // Check collision with lightning beams (player getting hit)
      const lightningBeams = enemyManager.getLightningBeams();
      lightningBeams.forEach((beam) => {
        if (currentTime >= beam.endTime) return; // Lightning expired
        
        // Check if player is in the lightning path
        if (beam.path.length < 2) return;
        
        // Check if player is near any segment of the lightning path
        const playerSize = PLAYER_SIZE;
        const hitRadius = playerSize / 2 + 25; // Slightly larger than player for easier hit
        
        for (let i = 0; i < beam.path.length - 1; i++) {
          const start = beam.path[i];
          const end = beam.path[i + 1];
          
          // Check distance from player to line segment
          const distToSegment = distanceToLineSegment(
            newPlayerPos,
            start,
            end
          );
          
          if (distToSegment <= hitRadius) {
            // Shield blocks all damage
            if (isShieldActive) {
              return;
            }
            
            // Player hit by lightning (one-time damage)
            if (currentTime - lastDamageTimeRef.current > 100) { // Prevent multiple hits in same frame
              setPlayerStats((prev) => {
                const damage = beam.damage;
                const newStats = applyDamage(damage, prev);
                if (newStats.health <= 0) {
                  createBloodEffect(newPlayerPos, PLAYER_SIZE, 5);
                  setIsGameOver(true);
                  return { ...newStats, health: 0 };
                }
                // Small blood effect when taking damage
                createBloodEffect(newPlayerPos, PLAYER_SIZE * 0.3, 0.4);
                return newStats;
              });
              lastDamageTimeRef.current = currentTime;
            }
            break; // Only hit once per lightning
          }
        }
      });
      
      // Check collision with energy beams (major attack from LAZER enemies)
      const energyBeams = enemyManager.getEnergyBeams();
      
      // Add screen shake while any energy beam is active
      if (energyBeams.length > 0 && energyBeams.some(b => currentTime < b.endTime)) {
        const shakeIntensity = GAME_BALANCE.enemies.attack.majorAttackScreenShake;
        screenShakeRef.current = {
          x: (Math.random() - 0.5) * shakeIntensity,
          y: (Math.random() - 0.5) * shakeIntensity,
          intensity: shakeIntensity,
          endTime: currentTime + 100, // Will be extended while beam is active
        };
      }
      
      energyBeams.forEach((beam) => {
        if (currentTime >= beam.endTime) return; // Beam expired
        
        // Check if player is in the energy beam
        const dx = Math.cos(beam.angle);
        const dy = Math.sin(beam.angle);
        
        // Vector from beam start to player
        const toPlayerX = newPlayerPos.x - beam.startPosition.x;
        const toPlayerY = newPlayerPos.y - beam.startPosition.y;
        
        // Distance from point to line
        const distanceToLine = Math.abs(dx * toPlayerY - dy * toPlayerX);
        const beamWidth = GAME_BALANCE.enemies.attack.majorAttackBeamWidth;
        const isInBeam = distanceToLine < beamWidth / 2 + PLAYER_SIZE / 2;
        
        // Check if player is in front of the beam (not behind it)
        const dotProduct = toPlayerX * dx + toPlayerY * dy;
        const isInFront = dotProduct > 0;
        
        if (isInBeam && isInFront) {
          // Wait 300ms after beam starts before knockback/damage can occur (visual sync)
          const beamActiveTime = currentTime - beam.startTime;
          const knockbackDelay = 300; // 300ms delay before knockback starts
          
          if (beamActiveTime >= knockbackDelay && currentTime - lastDamageTimeRef.current > 200) {
            // Apply MASSIVE knockback - push player left or right (randomly if centered)
            const knockbackForce = GAME_BALANCE.enemies.attack.majorAttackBeamKnockback;
            
            // Perpendicular direction to beam (left or right)
            const perpendicularAngle = beam.angle + Math.PI / 2;
            
            // Determine knockback direction - always knock left or right
            // Use beam angle to determine perpendicular, then pick random or based on player position
            const crossProduct = dx * toPlayerY - dy * toPlayerX;
            let knockbackDirection: number;
            
            // If player is within the beam width from center line, use random direction
            const beamHalfWidth = GAME_BALANCE.enemies.attack.majorAttackBeamWidth / 2;
            if (Math.abs(crossProduct) < beamHalfWidth) {
              // Player is in the beam center area - random direction (always knocks)
              knockbackDirection = Math.random() < 0.5 ? 1 : -1;
            } else {
              // Push player further away from beam center
              knockbackDirection = crossProduct > 0 ? 1 : -1;
            }
            
            const knockbackX = Math.cos(perpendicularAngle) * knockbackForce * knockbackDirection;
            const knockbackY = Math.sin(perpendicularAngle) * knockbackForce * knockbackDirection;
            
            // Apply knockback to player position
            newPlayerPos.x += knockbackX;
            newPlayerPos.y += knockbackY;
            setPlayerPos(newPlayerPos);
            playerPosRef.current = newPlayerPos;
            
            // Extra intense screen shake on hit
            screenShakeRef.current = {
              x: (Math.random() - 0.5) * 25,
              y: (Math.random() - 0.5) * 25,
              intensity: 25,
              endTime: currentTime + 300,
            };
            
            // Only apply damage if shield is NOT active
            if (!isShieldActive) {
              setPlayerStats((prev) => {
                const damage = beam.damage;
                const newStats = applyDamage(damage, prev);
                if (newStats.health <= 0) {
                  createBloodEffect(newPlayerPos, PLAYER_SIZE, 5);
                  setIsGameOver(true);
                  return { ...newStats, health: 0 };
                }
                // Big blood effect for massive damage
                createBloodEffect(newPlayerPos, PLAYER_SIZE * 0.8, 2);
                return newStats;
              });
            }
            
            lastDamageTimeRef.current = currentTime;
          }
        }
      });
      
      // Check collision with laser beams (legacy, for other enemies if any)
      const laserBeams = enemyManager.getLaserBeams();
      laserBeams.forEach((beam) => {
        if (currentTime >= beam.endTime) return; // Beam expired
        
        // Check if player is on the "damage side" of the laser beam
        // The laser divides the ground - player takes damage on one side only
        // Calculate which side of the line the player is on
        const dx = Math.cos(beam.angle);
        const dy = Math.sin(beam.angle);
        
        // Vector from beam start to player
        const toPlayerX = newPlayerPos.x - beam.startPosition.x;
        const toPlayerY = newPlayerPos.y - beam.startPosition.y;
        
        // Cross product to determine which side of the line player is on
        const crossProduct = dx * toPlayerY - dy * toPlayerX;
        
        // If cross product is positive, player is on one side; negative = other side
        // We'll damage player on the "positive" side (right side of the beam direction)
        const isOnDamageSide = crossProduct > 0;
        
        // Check if player is close enough to the beam line (within beam width)
        // Distance from point to line
        const distanceToLine = Math.abs(dx * toPlayerY - dy * toPlayerX);
        const beamWidth = GAME_BALANCE.enemies.attack.laserBeamWidth;
        const isNearBeam = distanceToLine < beamWidth + PLAYER_SIZE / 2;
        
        if (isOnDamageSide && isNearBeam) {
          // Shield blocks all damage
          if (isShieldActive) {
            return;
          }
          
          // Player is on the damage side of the beam - take continuous damage
          if (currentTime - lastDamageTimeRef.current > 50) { // Damage every 50ms while in beam
            setPlayerStats((prev) => {
              const damage = beam.damage;
              const newStats = applyDamage(damage, prev);
              if (newStats.health <= 0) {
                createBloodEffect(newPlayerPos, PLAYER_SIZE, 5);
                setIsGameOver(true);
                return { ...newStats, health: 0 };
              }
              // Small blood effect when taking damage
              createBloodEffect(newPlayerPos, PLAYER_SIZE * 0.3, 0.4);
              return newStats;
            });
            lastDamageTimeRef.current = currentTime;
            
            // Apply knockback - push player perpendicular to beam (left or right)
            const knockbackForce = GAME_BALANCE.enemies.attack.laserBeamKnockback;
            // Perpendicular direction (90 degrees rotated from beam direction)
            // If beam goes at angle θ, perpendicular is θ + π/2
            const perpendicularAngle = beam.angle + Math.PI / 2;
            // Push player away from the beam line (in the direction they're already on)
            const knockbackDirection = isOnDamageSide ? 1 : -1; // Push further away from beam
            const knockbackX = Math.cos(perpendicularAngle) * knockbackForce * knockbackDirection;
            const knockbackY = Math.sin(perpendicularAngle) * knockbackForce * knockbackDirection;
            
            // Apply knockback to player position
            newPlayerPos.x += knockbackX;
            newPlayerPos.y += knockbackY;
            setPlayerPos(newPlayerPos);
            playerPosRef.current = newPlayerPos;
          }
        }
      });

      // Check collision with enemy projectiles (player getting hit)
      // Get fresh copy since some may have been destroyed by player bullets
      const remainingEnemyProjectiles = enemyManager.getEnemyProjectiles();
      remainingEnemyProjectiles.forEach((proj) => {
        if (checkCollision(proj.position, proj.size, newPlayerPos, PLAYER_SIZE)) {
          // Shield blocks all damage
          if (isShieldActive) {
            // Just remove projectile, no damage
            enemyManager.removeEnemyProjectile(proj.id);
            
            // Play explosion sound effect (throttled to prevent spam)
            if (currentTime - lastShieldBlockSoundRef.current > 100) {
              if (isSfxEnabled && enemyProjectileDestroyedSoundRef.current) {
                const sound = enemyProjectileDestroyedSoundRef.current.cloneNode() as HTMLAudioElement;
                sound.volume = 0.3;
                sound.play().catch(() => {
                  // Ignore autoplay errors
                });
              }
              lastShieldBlockSoundRef.current = currentTime;
            }
            
            return;
          }
          
          // Player hit by enemy projectile
          if (currentTime - lastDamageTimeRef.current > 300) {
            setPlayerStats((prev) => {
              const damage = proj.damage * 0.3; // Projectiles do 30% of their damage
              const newStats = applyDamage(damage, prev);
              if (newStats.health <= 0) {
                // Large blood effect on death
                createBloodEffect(newPlayerPos, PLAYER_SIZE, 5);
                setIsGameOver(true);
                return { ...newStats, health: 0 };
              }
              // Small blood effect when taking damage
              createBloodEffect(newPlayerPos, PLAYER_SIZE * 0.5, 0.6);
              return newStats;
            });
            lastDamageTimeRef.current = currentTime;
          }
          // Remove projectile after hitting player
          enemyManager.removeEnemyProjectile(proj.id);
          
          // Play explosion sound effect
          if (isSfxEnabled && enemyProjectileDestroyedSoundRef.current) {
            const sound = enemyProjectileDestroyedSoundRef.current.cloneNode() as HTMLAudioElement;
            sound.volume = 0.3;
            sound.play().catch(() => {
              // Ignore autoplay errors
            });
          }
        }
      });

      if (currentTime - lastDamageTimeRef.current > 300) {
        const collisionResult = enemyManager.checkPlayerCollision(newPlayerPos, PLAYER_SIZE);
        const damage = collisionResult.damage;
        
        // Handle weak enemy explosions on contact
        collisionResult.explodedEnemies.forEach((exploded) => {
          // Create fire explosion effect
          createFireExplosion(exploded.position, 60, 1.5);
        });
        
        if (damage > 0) {
          // Shield blocks all damage
          if (isShieldActive) {
            // Play shield block sound (throttled to prevent spam)
            if (currentTime - lastShieldBlockSoundRef.current > 200) {
              if (isSfxEnabled && enemyProjectileDestroyedSoundRef.current) {
                const sound = enemyProjectileDestroyedSoundRef.current.cloneNode() as HTMLAudioElement;
                sound.volume = 0.3;
                sound.play().catch(() => {
                  // Ignore autoplay errors
                });
              }
              lastShieldBlockSoundRef.current = currentTime;
            }
          } else {
            setPlayerStats((prev) => {
              // Explosion damage is already full damage, regular damage is 25%
              const damageMultiplier = collisionResult.explodedEnemies.length > 0 ? 1.0 : 0.25;
              const totalDamage = damage * damageMultiplier;
              const newStats = applyDamage(totalDamage, prev);
              if (newStats.health <= 0) {
                // Large blood effect on death
                createBloodEffect(newPlayerPos, PLAYER_SIZE, 5);
                setIsGameOver(true);
                return { ...newStats, health: 0 };
              }
              // Small blood effect when taking damage (larger for explosions)
              const effectSize = collisionResult.explodedEnemies.length > 0 ? 0.8 : 0.5;
              const effectIntensity = collisionResult.explodedEnemies.length > 0 ? 1.5 : 0.6;
              createBloodEffect(newPlayerPos, PLAYER_SIZE * effectSize, effectIntensity);
              return newStats;
            });
            lastDamageTimeRef.current = currentTime;
          }
        }
      }

      if (enemyManager.isEmpty() && waveManager.isWaveInProgress()) {
        waveManager.completeWave();
        // Don't show power-ups yet - wait for E press
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      // Reuse camera offset already calculated above
      ctx.save();
      ctx.translate(-cameraOffsetX, -cameraOffsetY);

      // Draw background image or fallback grid
      const backgroundSprite = spriteManager.getSprite('background');
      if (backgroundSprite && spritesLoadedRef.current) {
        // Draw tiled background image
        const bgWidth = backgroundSprite.width || 50;
        const bgHeight = backgroundSprite.height || 50;
        const startX = Math.floor((newPlayerPos.x - canvasWidth) / bgWidth) * bgWidth;
        const startY = Math.floor((newPlayerPos.y - canvasHeight) / bgHeight) * bgHeight;
        const endX = newPlayerPos.x + canvasWidth;
        const endY = newPlayerPos.y + canvasHeight;

        for (let x = startX; x < endX; x += bgWidth) {
          for (let y = startY; y < endY; y += bgHeight) {
            ctx.drawImage(backgroundSprite, x, y, bgWidth, bgHeight);
          }
        }
      } else {
        // Fallback to grid if background image not loaded
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(
          newPlayerPos.x - canvasWidth,
          newPlayerPos.y - canvasHeight,
          canvasWidth * 3,
          canvasHeight * 3
        );

        ctx.fillStyle = '#16213e';
        const gridSize = 50;
        const gridStartX = Math.floor((newPlayerPos.x - canvasWidth) / gridSize) * gridSize;
        const gridStartY = Math.floor((newPlayerPos.y - canvasHeight) / gridSize) * gridSize;
        const gridEndX = newPlayerPos.x + canvasWidth;
        const gridEndY = newPlayerPos.y + canvasHeight;

        for (let x = gridStartX; x < gridEndX; x += gridSize) {
          for (let y = gridStartY; y < gridEndY; y += gridSize) {
            if ((Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2 === 0) {
              ctx.fillRect(x, y, gridSize, gridSize);
            }
          }
        }
      }

      // Draw player projectiles with sprites
      projectilesRef.current.forEach((proj) => {
        const angle = Math.atan2(proj.velocity.y, proj.velocity.x);
        spriteManager.drawSprite(
          ctx,
          'projectile',
          proj.position.x,
          proj.position.y,
          proj.size,
          proj.size,
          angle
        );
      });

      // Draw lightning beams (zigzag between enemies)
      const activeLightningBeams = enemyManager.getLightningBeams();
      const currentTimeForLightning = Date.now();
      activeLightningBeams.forEach((beam) => {
        if (currentTimeForLightning >= beam.endTime) return; // Lightning expired
        
        ctx.save();
        
        // Calculate time remaining for fade effect
        const timeRemaining = beam.endTime - currentTimeForLightning;
        const fadeAlpha = Math.min(1.0, timeRemaining / 200); // Fade out in last 200ms
        
        // Lightning properties - thin and crisp
        const lightningWidth = 2; // Thin line
        const zigzagOffset = 8; // Smaller zigzag for crisp look
        
        // Draw zigzag lightning path
        if (beam.path.length >= 2) {
          for (let i = 0; i < beam.path.length - 1; i++) {
            const start = beam.path[i];
            const end = beam.path[i + 1];
            
            // Create jagged lightning effect with more segments for realism
            const segments = 8; // More segments for smoother zigzag
            const points: Position[] = [start];
            
            for (let j = 1; j < segments; j++) {
              const t = j / segments;
              const baseX = start.x + (end.x - start.x) * t;
              const baseY = start.y + (end.y - start.y) * t;
              
              // Add perpendicular offset for zigzag
              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const perpX = -dy / len;
              const perpY = dx / len;
              
              // Random jagged pattern for realistic lightning
              const randomOffset = (Math.random() - 0.5) * 2; // -1 to 1
              const offset = Math.sin(j * Math.PI * 1.5) * zigzagOffset * (0.5 + Math.abs(randomOffset));
              points.push({
                x: baseX + perpX * offset,
                y: baseY + perpY * offset
              });
            }
            points.push(end);
            
            // Draw thin, crisp blue lightning (matching homing orb color)
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Subtle outer glow - blue like homing orb
            ctx.strokeStyle = `rgba(0, 170, 255, ${fadeAlpha * 0.4})`; // #00aaff with alpha
            ctx.lineWidth = lightningWidth + 3;
            ctx.shadowBlur = 4;
            ctx.shadowColor = 'rgba(0, 170, 255, 0.8)'; // #00aaff
            ctx.globalCompositeOperation = 'screen';
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let k = 1; k < points.length; k++) {
              ctx.lineTo(points[k].x, points[k].y);
            }
            ctx.stroke();
            
            // Main lightning - bright blue like homing orb, thin
            ctx.strokeStyle = `rgba(0, 170, 255, ${fadeAlpha * 0.95})`; // #00aaff
            ctx.lineWidth = lightningWidth + 1;
            ctx.shadowBlur = 2;
            ctx.shadowColor = 'rgba(0, 170, 255, 1)'; // #00aaff
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let k = 1; k < points.length; k++) {
              ctx.lineTo(points[k].x, points[k].y);
            }
            ctx.stroke();
            
            // Inner core - lighter blue like homing orb inner glow, very thin
            ctx.strokeStyle = `rgba(102, 204, 255, ${fadeAlpha})`; // #66ccff
            ctx.lineWidth = lightningWidth;
            ctx.shadowBlur = 1;
            ctx.shadowColor = 'rgba(102, 204, 255, 1)'; // #66ccff
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let k = 1; k < points.length; k++) {
              ctx.lineTo(points[k].x, points[k].y);
            }
            ctx.stroke();
          }
        }
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
      });
      
      // Draw energy beams using sprite sheet animation
      const activeEnergyBeams = enemyManager.getEnergyBeams();
      const currentTimeForEnergyBeams = Date.now();
      
      // Update sprite sheet animation frame (12 frames, ~83ms per frame for smooth animation)
      const frameInterval = 83; // ~12fps animation
      energyBeamFrameRef.current = Math.floor(currentTimeForEnergyBeams / frameInterval) % 12;
      
      activeEnergyBeams.forEach((beam) => {
        if (currentTimeForEnergyBeams >= beam.endTime) return; // Beam expired
        
        const beamSprite = spriteManager.getSprite('lazer_beam');
        if (!beamSprite || !beamSprite.complete) return;
        
        ctx.save();
        
        // Sprite sheet info: 12 frames horizontally, 3 rows vertically
        // Total: 1612px width x 519px height
        const totalFrames = 12;
        const totalRows = 3;
        const frameWidth = beamSprite.naturalWidth / totalFrames; // ~134px per frame
        const rowHeight = beamSprite.naturalHeight / totalRows; // ~173px per row
        const currentFrame = energyBeamFrameRef.current;
        const selectedRow = 1; // Use middle row (0, 1, or 2)
        
        // Scale factor to make beam bigger
        const scale = 1; // Make beam larger for visibility
        const scaledWidth = frameWidth * scale;
        const scaledHeight = rowHeight * scale;
        
        // Calculate time remaining for fade effect
        const timeRemaining = beam.endTime - currentTimeForEnergyBeams;
        const fadeAlpha = Math.min(1.0, timeRemaining / 300);
        
        ctx.globalAlpha = fadeAlpha;
        
        // Move to beam start position and rotate
        ctx.translate(beam.startPosition.x, beam.startPosition.y);
        ctx.rotate(beam.angle);
        
        // Draw the current frame multiple times to make beam longer (without stretching)
        // Repeat the frame to double/triple the length
        const repeatCount = 9; // Draw frame 9 times for 9x length (triple the previous)
        const totalBeamLength = repeatCount * scaledWidth;
        const yOffset = 0; // Same offset as sprites
        
        // Draw solid colored beam BEHIND the sprite - thin beam matching laser core
        const beamThickness = 34; // Thin beam to match the laser core
        const beamCenterY = yOffset; // Center of beam
        
        // Create gradient for the beam (blue -> cyan -> yellow -> cyan -> blue)
        const gradient = ctx.createLinearGradient(0, beamCenterY - beamThickness, 0, beamCenterY + beamThickness);
        gradient.addColorStop(0, 'rgba(0, 100, 255, 0)');      // Transparent blue edge
        gradient.addColorStop(0.2, 'rgba(0, 200, 255, 0.6)');  // Cyan
        gradient.addColorStop(0.4, 'rgba(100, 255, 255, 0.8)');// Light cyan
        gradient.addColorStop(0.5, 'rgba(255, 255, 200, 1)');  // Bright yellow-white core
        gradient.addColorStop(0.6, 'rgba(100, 255, 255, 0.8)');// Light cyan
        gradient.addColorStop(0.8, 'rgba(0, 200, 255, 0.6)');  // Cyan
        gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');      // Transparent blue edge
        
        // Draw outer glow
        ctx.shadowColor = '#00BFFF';
        ctx.shadowBlur = 20;
        
        // Draw the gradient beam
        ctx.fillStyle = gradient;
        ctx.fillRect(0, beamCenterY - beamThickness, totalBeamLength, beamThickness * 2);
        
        // Draw bright core line
        ctx.shadowColor = '#FFFF00';
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(255, 255, 220, 0.9)';
        ctx.fillRect(0, beamCenterY - 2, totalBeamLength, 4); // Thin bright core
        
        // Reset shadow for sprite drawing
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        
        // Draw sprite frames on top
        for (let i = 0; i < repeatCount; i++) {
          ctx.drawImage(
            beamSprite,
            currentFrame * frameWidth, selectedRow * rowHeight, frameWidth, rowHeight, // Source: one frame from one row
            i * scaledWidth, -scaledHeight / 2 - 30, scaledWidth, scaledHeight // Destination: each segment placed side by side
          );
        }
        
        ctx.globalAlpha = 1.0;
        ctx.restore();
      });
      
      // Draw laser beams (legacy, for other enemies if any)
      const activeLaserBeams = enemyManager.getLaserBeams();
      const currentTimeForBeams = Date.now();
      activeLaserBeams.forEach((beam) => {
        if (currentTimeForBeams >= beam.endTime) return; // Beam expired
        
        ctx.save();
        
        // Calculate beam end position (extend to edge of screen)
        const maxDistance = Math.max(canvas.width, canvas.height) * 3; // Extend far beyond screen
        const endX = beam.startPosition.x + Math.cos(beam.angle) * maxDistance;
        const endY = beam.startPosition.y + Math.sin(beam.angle) * maxDistance;
        
        // Calculate time remaining for fade effect
        const timeRemaining = beam.endTime - currentTimeForBeams;
        const fadeAlpha = Math.min(1.0, timeRemaining / 300); // Fade out in last 300ms
        
        // MUCH MORE INTENSE laser beam
        const baseBeamWidth = GAME_BALANCE.enemies.attack.laserBeamWidth;
        const beamWidth = baseBeamWidth * 2.5; // Much thicker beam
        
        // Pulsing effect for intensity
        const pulseTime = currentTimeForBeams / 50;
        const pulseIntensity = 0.8 + Math.sin(pulseTime) * 0.2; // Pulse between 0.8 and 1.0
        
        // OUTERMOST GLOW - Massive red glow
        ctx.strokeStyle = `rgba(255, 0, 0, ${fadeAlpha * 0.4 * pulseIntensity})`;
        ctx.lineWidth = beamWidth + 80;
        ctx.shadowBlur = 60;
        ctx.shadowColor = 'rgba(255, 0, 0, 1)';
        ctx.globalCompositeOperation = 'screen';
        ctx.beginPath();
        ctx.moveTo(beam.startPosition.x, beam.startPosition.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // OUTER GLOW - Bright red
        ctx.strokeStyle = `rgba(255, 50, 50, ${fadeAlpha * 0.5 * pulseIntensity})`;
        ctx.lineWidth = beamWidth + 50;
        ctx.shadowBlur = 50;
        ctx.shadowColor = 'rgba(255, 100, 100, 1)';
        ctx.beginPath();
        ctx.moveTo(beam.startPosition.x, beam.startPosition.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // MIDDLE GLOW - Orange-red
        ctx.strokeStyle = `rgba(255, 100, 0, ${fadeAlpha * 0.7 * pulseIntensity})`;
        ctx.lineWidth = beamWidth + 30;
        ctx.shadowBlur = 40;
        ctx.shadowColor = 'rgba(255, 150, 0, 1)';
        ctx.beginPath();
        ctx.moveTo(beam.startPosition.x, beam.startPosition.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // MAIN BEAM - Bright orange
        ctx.strokeStyle = `rgba(255, 150, 50, ${fadeAlpha * 0.95 * pulseIntensity})`;
        ctx.lineWidth = beamWidth;
        ctx.shadowBlur = 30;
        ctx.shadowColor = 'rgba(255, 200, 0, 1)';
        ctx.beginPath();
        ctx.moveTo(beam.startPosition.x, beam.startPosition.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // INNER CORE - Bright yellow-white
        ctx.strokeStyle = `rgba(255, 255, 150, ${fadeAlpha * pulseIntensity})`;
        ctx.lineWidth = beamWidth * 0.5;
        ctx.shadowBlur = 25;
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.beginPath();
        ctx.moveTo(beam.startPosition.x, beam.startPosition.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // INNERMOST CORE - Pure white
        ctx.strokeStyle = `rgba(255, 255, 255, ${fadeAlpha * pulseIntensity})`;
        ctx.lineWidth = beamWidth * 0.25;
        ctx.shadowBlur = 20;
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.beginPath();
        ctx.moveTo(beam.startPosition.x, beam.startPosition.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
      });

      // Draw enemy projectiles (red/orange colored balls, blue for homing, dark red for charged)
      enemyManager.getEnemyProjectiles().forEach((proj) => {
        const angle = Math.atan2(proj.velocity.y, proj.velocity.x);
        ctx.save();
        ctx.translate(proj.position.x, proj.position.y);
        ctx.rotate(angle);
        
        if (proj.isHoming) {
          // Draw blue homing projectile
          ctx.fillStyle = '#00aaff'; // Bright blue color
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#0088ff';
          ctx.beginPath();
          ctx.arc(0, 0, proj.size / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Add inner glow
          ctx.fillStyle = '#66ccff';
          ctx.beginPath();
          ctx.arc(0, 0, proj.size / 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (proj.size >= 40) {
          // Draw charged shot (larger, dark red projectile)
          ctx.fillStyle = '#8b0000'; // Dark red color
          ctx.shadowBlur = 25;
          ctx.shadowColor = '#ff0000';
          ctx.beginPath();
          ctx.arc(0, 0, proj.size / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Add inner glow
          ctx.fillStyle = '#cc0000';
          ctx.beginPath();
          ctx.arc(0, 0, proj.size / 3, 0, Math.PI * 2);
          ctx.fill();
          
          // Add outer glow ring for extra visibility
          ctx.strokeStyle = '#ff4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, proj.size / 2 + 3, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Draw red/orange projectile (normal)
          ctx.fillStyle = '#ff4500'; // Orange-red color
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#ff0000';
          ctx.beginPath();
          ctx.arc(0, 0, proj.size / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Add inner glow
          ctx.fillStyle = '#ff6b35';
          ctx.beginPath();
          ctx.arc(0, 0, proj.size / 3, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      });

      // Draw shield connections between STRONG enemies and shielded enemies
      enemyManager.getEnemies().forEach((strongEnemy) => {
        if (strongEnemy.type === 'strong') {
          enemyManager.getEnemies().forEach((otherEnemy) => {
            if (otherEnemy.id !== strongEnemy.id && otherEnemy.shielded) {
              const dist = Math.sqrt(
                Math.pow(strongEnemy.position.x - otherEnemy.position.x, 2) +
                Math.pow(strongEnemy.position.y - otherEnemy.position.y, 2)
              );
              if (dist <= 200) {
                // Draw connection line
                ctx.save();
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(strongEnemy.position.x, strongEnemy.position.y);
                ctx.lineTo(otherEnemy.position.x, otherEnemy.position.y);
                ctx.stroke();
                ctx.restore();
              }
            }
          });
        }
      });

      // Draw enemies with sprites
      enemyManager.getEnemies().forEach((enemy) => {
        // Get sprite name based on enemy type
        // Split enemies use STRONG sprite (smaller size)
        let spriteName = 'enemy';
        if (enemy.isSplitEnemy) {
          spriteName = 'enemy_strong'; // Split enemies use strong sprite
        } else {
          switch (enemy.type) {
            case 'weak':
              spriteName = 'enemy_weak';
              break;
            case 'normal':
              spriteName = 'enemy_normal';
              break;
            case 'strong':
              spriteName = 'enemy_strong';
              break;
            case 'lazer':
              spriteName = 'enemy_lazer'; // LAZER enemy sprite
              break;
          }
        }

        // Draw shield effect for shielded enemies
        if (enemy.shielded) {
          ctx.save();
          ctx.translate(enemy.position.x, enemy.position.y);
          ctx.strokeStyle = '#00ffff'; // Cyan shield color
          ctx.lineWidth = 3;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00ffff';
          ctx.beginPath();
          ctx.arc(0, 0, enemy.size / 2 + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Draw THUNDER charge effect for LAZER enemies major attack
        if (enemy.type === 'lazer' && enemy.majorAttackChargeStartTime && !enemy.majorAttackTeleportTime) {
          const currentTime = Date.now();
          const chargeTime = GAME_BALANCE.enemies.attack.majorAttackChargeTime;
          const chargeProgress = Math.min((currentTime - enemy.majorAttackChargeStartTime) / chargeTime, 1);
          const pulseIntensity = 0.6 + (chargeProgress * 0.4);
          
          ctx.save();
          ctx.translate(enemy.position.x, enemy.position.y);
          
          // Helper function to draw a proper zigzag lightning bolt
          const drawLightningBolt = (startX: number, startY: number, endX: number, endY: number, branches: boolean = true) => {
            const points: {x: number, y: number}[] = [{x: startX, y: startY}];
            const dx = endX - startX;
            const dy = endY - startY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const segments = Math.max(4, Math.floor(length / 15)); // More segments for longer bolts
            
            // Generate zigzag points
            for (let i = 1; i < segments; i++) {
              const t = i / segments;
              const baseX = startX + dx * t;
              const baseY = startY + dy * t;
              
              // Perpendicular direction for zigzag
              const perpX = -dy / length;
              const perpY = dx / length;
              
              // Sharp zigzag - alternate sides with randomness
              const zigzagAmount = (i % 2 === 0 ? 1 : -1) * (10 + Math.random() * 20);
              points.push({
                x: baseX + perpX * zigzagAmount,
                y: baseY + perpY * zigzagAmount
              });
            }
            points.push({x: endX, y: endY});
            
            // Draw the main bolt path
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y);
            }
            
            // Outer glow
            ctx.strokeStyle = `rgba(0, 80, 200, ${pulseIntensity * 0.4})`;
            ctx.lineWidth = 8;
            ctx.stroke();
            
            // Middle glow
            ctx.strokeStyle = `rgba(0, 150, 255, ${pulseIntensity * 0.7})`;
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // Bright core
            ctx.strokeStyle = `rgba(180, 230, 255, ${pulseIntensity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // White hot center
            ctx.strokeStyle = `rgba(255, 255, 255, ${pulseIntensity * 0.9})`;
            ctx.lineWidth = 1;
            ctx.stroke();
            
            // Draw branches from some points
            if (branches && points.length > 3) {
              for (let i = 1; i < points.length - 1; i++) {
                if (Math.random() < 0.4) { // 40% chance of branch
                  const branchAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * Math.PI * 0.8;
                  const branchLength = 15 + Math.random() * 25;
                  const branchEndX = points[i].x + Math.cos(branchAngle) * branchLength;
                  const branchEndY = points[i].y + Math.sin(branchAngle) * branchLength;
                  
                  // Small branch bolt
                  ctx.beginPath();
                  ctx.moveTo(points[i].x, points[i].y);
                  const midX = points[i].x + Math.cos(branchAngle) * branchLength * 0.5 + (Math.random() - 0.5) * 10;
                  const midY = points[i].y + Math.sin(branchAngle) * branchLength * 0.5 + (Math.random() - 0.5) * 10;
                  ctx.lineTo(midX, midY);
                  ctx.lineTo(branchEndX, branchEndY);
                  
                  ctx.strokeStyle = `rgba(0, 150, 255, ${pulseIntensity * 0.5})`;
                  ctx.lineWidth = 2;
                  ctx.stroke();
                  ctx.strokeStyle = `rgba(200, 240, 255, ${pulseIntensity * 0.8})`;
                  ctx.lineWidth = 1;
                  ctx.stroke();
                }
              }
            }
          };
          
          ctx.shadowColor = 'rgba(0, 170, 255, 0.9)';
          ctx.shadowBlur = 20 + chargeProgress * 15;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'bevel';
          
          // Draw main lightning bolts shooting outward from enemy
          const numBolts = 4 + Math.floor(chargeProgress * 4);
          const innerRadius = enemy.size / 3;
          const outerRadius = (enemy.size / 2) + 40 + (chargeProgress * 50);
          
          // Use time-based seed for flickering effect (bolts change every ~100ms)
          const flickerSeed = Math.floor(currentTime / 80);
          
          for (let i = 0; i < numBolts; i++) {
            // Slight random angle offset that changes with time for flickering
            const baseAngle = (i / numBolts) * Math.PI * 2;
            const angleOffset = Math.sin(flickerSeed + i * 1.7) * 0.3;
            const angle = baseAngle + angleOffset;
            
            const startX = Math.cos(angle) * innerRadius;
            const startY = Math.sin(angle) * innerRadius;
            const endX = Math.cos(angle) * outerRadius;
            const endY = Math.sin(angle) * outerRadius;
            
            drawLightningBolt(startX, startY, endX, endY, true);
          }
          
          // Draw some random arcing bolts between points around the enemy
          const numArcs = Math.floor(chargeProgress * 3);
          for (let i = 0; i < numArcs; i++) {
            const angle1 = Math.random() * Math.PI * 2;
            const angle2 = angle1 + (Math.random() * 0.8 + 0.4) * (Math.random() < 0.5 ? 1 : -1);
            const radius = (enemy.size / 2) + 10 + Math.random() * 30;
            
            const arcStartX = Math.cos(angle1) * radius;
            const arcStartY = Math.sin(angle1) * radius;
            const arcEndX = Math.cos(angle2) * radius;
            const arcEndY = Math.sin(angle2) * radius;
            
            drawLightningBolt(arcStartX, arcStartY, arcEndX, arcEndY, false);
          }
          
          // Draw electric sparks/particles
          const numSparks = 5 + Math.floor(chargeProgress * 10);
          for (let i = 0; i < numSparks; i++) {
            const sparkAngle = Math.random() * Math.PI * 2;
            const sparkDist = (enemy.size / 2) + Math.random() * 50;
            const sparkX = Math.cos(sparkAngle) * sparkDist;
            const sparkY = Math.sin(sparkAngle) * sparkDist;
            
            // Draw spark as small cross/star
            ctx.strokeStyle = `rgba(200, 240, 255, ${0.6 + Math.random() * 0.4})`;
            ctx.lineWidth = 1.5;
            const sparkSize = 3 + Math.random() * 4;
            
            ctx.beginPath();
            ctx.moveTo(sparkX - sparkSize, sparkY);
            ctx.lineTo(sparkX + sparkSize, sparkY);
            ctx.moveTo(sparkX, sparkY - sparkSize);
            ctx.lineTo(sparkX, sparkY + sparkSize);
            ctx.stroke();
          }
          
          ctx.restore();
        }
        
        // Draw THUNDER teleport effect for LAZER enemies (when they just teleported)
        if (enemy.type === 'lazer' && enemy.majorAttackTeleportTime) {
          const currentTime = Date.now();
          const timeSinceTeleport = currentTime - enemy.majorAttackTeleportTime;
          const teleportEffectDuration = 500; // Effect lasts 500ms
          
          if (timeSinceTeleport < teleportEffectDuration) {
            const effectProgress = timeSinceTeleport / teleportEffectDuration;
            const fadeOut = 1 - effectProgress;
            
            ctx.save();
            ctx.translate(enemy.position.x, enemy.position.y);
            
            ctx.shadowColor = 'rgba(0, 170, 255, 0.9)';
            ctx.shadowBlur = 30 * fadeOut;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'bevel';
            
            // Helper to draw teleport lightning bolt
            const drawTeleportBolt = (startX: number, startY: number, endX: number, endY: number) => {
              const points: {x: number, y: number}[] = [{x: startX, y: startY}];
              const dx = endX - startX;
              const dy = endY - startY;
              const length = Math.sqrt(dx * dx + dy * dy);
              const segments = Math.max(3, Math.floor(length / 20));
              
              for (let i = 1; i < segments; i++) {
                const t = i / segments;
                const baseX = startX + dx * t;
                const baseY = startY + dy * t;
                const perpX = -dy / length;
                const perpY = dx / length;
                const zigzag = (i % 2 === 0 ? 1 : -1) * (8 + Math.random() * 15) * fadeOut;
                points.push({x: baseX + perpX * zigzag, y: baseY + perpY * zigzag});
              }
              points.push({x: endX, y: endY});
              
              ctx.beginPath();
              ctx.moveTo(points[0].x, points[0].y);
              for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
              }
              
              ctx.strokeStyle = `rgba(0, 80, 200, ${fadeOut * 0.4})`;
              ctx.lineWidth = 7;
              ctx.stroke();
              ctx.strokeStyle = `rgba(0, 150, 255, ${fadeOut * 0.7})`;
              ctx.lineWidth = 4;
              ctx.stroke();
              ctx.strokeStyle = `rgba(180, 230, 255, ${fadeOut})`;
              ctx.lineWidth = 2;
              ctx.stroke();
              ctx.strokeStyle = `rgba(255, 255, 255, ${fadeOut * 0.8})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            };
            
            // Draw lightning bolts shooting outward (explosion effect)
            const numOutwardBolts = 8;
            const outerRadius = (enemy.size / 2) + 30 + (effectProgress * 80);
            
            for (let i = 0; i < numOutwardBolts; i++) {
              const angle = (i / numOutwardBolts) * Math.PI * 2 + effectProgress * 1.5;
              const innerR = enemy.size / 4;
              const startX = Math.cos(angle) * innerR;
              const startY = Math.sin(angle) * innerR;
              const endX = Math.cos(angle) * outerRadius;
              const endY = Math.sin(angle) * outerRadius;
              
              drawTeleportBolt(startX, startY, endX, endY);
            }
            
            // Draw vertical lightning strikes from above (like teleporting in)
            const numVerticalBolts = 3;
            for (let i = 0; i < numVerticalBolts; i++) {
              const offsetX = (i - 1) * 25 + (Math.random() - 0.5) * 10;
              const topY = -120 * fadeOut;
              const bottomY = 30 * fadeOut;
              
              drawTeleportBolt(offsetX, topY, offsetX + (Math.random() - 0.5) * 20, bottomY);
            }
            
            // Draw bright flash in center that fades
            if (effectProgress < 0.3) {
              const flashIntensity = (0.3 - effectProgress) / 0.3;
              const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.size / 2);
              gradient.addColorStop(0, `rgba(200, 240, 255, ${flashIntensity * 0.8})`);
              gradient.addColorStop(0.5, `rgba(0, 150, 255, ${flashIntensity * 0.4})`);
              gradient.addColorStop(1, 'rgba(0, 100, 255, 0)');
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(0, 0, enemy.size / 2, 0, Math.PI * 2);
              ctx.fill();
            }
            
            // Electric sparks
            const numSparks = Math.floor(8 * fadeOut);
            for (let i = 0; i < numSparks; i++) {
              const sparkAngle = Math.random() * Math.PI * 2;
              const sparkDist = (enemy.size / 2) + Math.random() * 60 * fadeOut;
              const sparkX = Math.cos(sparkAngle) * sparkDist;
              const sparkY = Math.sin(sparkAngle) * sparkDist;
              
              ctx.strokeStyle = `rgba(200, 240, 255, ${fadeOut})`;
              ctx.lineWidth = 1.5;
              const sparkSize = 4 + Math.random() * 5;
              
              ctx.beginPath();
              ctx.moveTo(sparkX - sparkSize, sparkY);
              ctx.lineTo(sparkX + sparkSize, sparkY);
              ctx.moveTo(sparkX, sparkY - sparkSize);
              ctx.lineTo(sparkX, sparkY + sparkSize);
              ctx.stroke();
            }
            
            ctx.restore();
          }
        }

        // Draw charge effect for STRONG enemies charging their shot
        if (enemy.type === 'strong' && enemy.chargeStartTime) {
          const currentTime = Date.now();
          // Charge time decreases with wave (stored in enemy.level)
          const wave = enemy.level || 1;
          let chargeTime = Math.max(1000, 2000 - (wave * 100)); // Same calculation as in EnemyManager
          // Berserker mode: 50% charge time
          if (enemy.isBerserker) {
            chargeTime = chargeTime * 0.5;
          }
          const chargeProgress = Math.min((currentTime - enemy.chargeStartTime) / chargeTime, 1);
          const pulseIntensity = 0.5 + (chargeProgress * 0.5); // Pulse from 0.5 to 1.0
          
          // Use locked target position (where player was when charge started), not current position
          const targetPos = enemy.chargeTargetPos || playerPosRef.current;
          
          ctx.save();
          ctx.translate(enemy.position.x, enemy.position.y);
          ctx.strokeStyle = `rgba(255, 100, 0, ${pulseIntensity})`; // Orange-red pulsing
          ctx.fillStyle = `rgba(255, 100, 0, ${pulseIntensity * 0.3})`;
          ctx.lineWidth = 4;
          ctx.shadowBlur = 20;
          ctx.shadowColor = `rgba(255, 100, 0, ${pulseIntensity})`;
          
          // Pulsing circle that grows as charge progresses
          const chargeRadius = (enemy.size / 2) + (chargeProgress * 15);
          ctx.beginPath();
          ctx.arc(0, 0, chargeRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          
          // Draw dotted line showing the path the charged shot will take (locked to initial target)
          const angle = Math.atan2(
            targetPos.y - enemy.position.y,
            targetPos.x - enemy.position.x
          );
          const maxDistance = 1000; // Maximum line length
          const endX = enemy.position.x + Math.cos(angle) * maxDistance;
          const endY = enemy.position.y + Math.sin(angle) * maxDistance;
          
          ctx.save();
          ctx.strokeStyle = `rgba(255, 100, 0, ${pulseIntensity * 0.6})`;
          ctx.lineWidth = 3;
          ctx.setLineDash([10, 10]); // Dotted line pattern
          ctx.shadowBlur = 5;
          ctx.shadowColor = 'rgba(255, 100, 0, 0.5)';
          ctx.beginPath();
          ctx.moveTo(enemy.position.x, enemy.position.y);
          ctx.lineTo(endX, endY);
          ctx.stroke();
          ctx.setLineDash([]); // Reset line dash
          ctx.restore();
        }

        // Draw burning effect for enemies in fire ring
        if (enemy.isBurning) {
          ctx.save();
          ctx.translate(enemy.position.x, enemy.position.y);
          
          // Pulsing orange glow effect
          const pulseTime = Date.now() / 150;
          const pulseIntensity = Math.sin(pulseTime) * 0.4 + 0.6; // Pulse between 0.2 and 1.0
          
          const glowGradient = ctx.createRadialGradient(0, 0, enemy.size * 0.2, 0, 0, enemy.size * 0.9);
          glowGradient.addColorStop(0, `rgba(255, 140, 0, ${pulseIntensity * 0.9})`);
          glowGradient.addColorStop(0.5, `rgba(255, 100, 0, ${pulseIntensity * 0.6})`);
          glowGradient.addColorStop(1, `rgba(255, 50, 0, 0)`);
          
          ctx.fillStyle = glowGradient;
          ctx.shadowBlur = 25;
          ctx.shadowColor = `rgba(255, 140, 0, ${pulseIntensity})`;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.size * 0.9, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Draw berserker red glow for STRONG enemies in berserker mode
        if (enemy.isBerserker && enemy.type === 'strong') {
          ctx.save();
          ctx.translate(enemy.position.x, enemy.position.y);
          
          // Pulsing red glow effect
          const pulseTime = Date.now() / 200;
          const pulseIntensity = Math.sin(pulseTime) * 0.3 + 0.7; // Pulse between 0.4 and 1.0
          
          const glowGradient = ctx.createRadialGradient(0, 0, enemy.size * 0.3, 0, 0, enemy.size * 0.8);
          glowGradient.addColorStop(0, `rgba(255, 0, 0, ${pulseIntensity * 0.8})`);
          glowGradient.addColorStop(0.5, `rgba(255, 50, 0, ${pulseIntensity * 0.5})`);
          glowGradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
          
          ctx.fillStyle = glowGradient;
          ctx.shadowBlur = 30;
          ctx.shadowColor = `rgba(255, 0, 0, ${pulseIntensity})`;
          ctx.beginPath();
          ctx.arc(0, 0, enemy.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Draw enemy sprite without rotation (angle = 0 to keep sprite straight)
        // If sprite not found, LAZER enemies will fallback to glowing circle
        spriteManager.drawSprite(
          ctx,
          spriteName,
          enemy.position.x,
          enemy.position.y,
          enemy.size,
          enemy.size,
          0 // No rotation - sprite stays straight
        );

        // Draw health bar with different colors and sizes based on enemy type
        const healthPercentage = enemy.health / enemy.maxHealth;
        
        let healthBarWidth: number;
        let healthBarHeight: number;
        let healthBarColor: string;
        let healthBarBgColor: string;
        
        switch (enemy.type) {
          case 'weak':
            healthBarWidth = enemy.size * 0.8; // Smaller bar for weak enemies
            healthBarHeight = 3;
            healthBarColor = '#f39c12'; // Orange for weak
            healthBarBgColor = '#7f5a00'; // Dark orange background
            break;
          case 'normal':
            healthBarWidth = enemy.size;
            healthBarHeight = 4;
            healthBarColor = '#27ae60'; // Green for normal
            healthBarBgColor = '#2c3e50'; // Dark gray background
            break;
          case 'strong':
            healthBarWidth = enemy.size * 1.2; // Larger bar for strong enemies
            healthBarHeight = 5;
            healthBarColor = '#e74c3c'; // Red for strong
            healthBarBgColor = '#5a0000'; // Dark red background
            break;
          default:
            healthBarWidth = enemy.size;
            healthBarHeight = 4;
            healthBarColor = '#27ae60';
            healthBarBgColor = '#2c3e50';
        }

        // Draw health bar background
        ctx.fillStyle = healthBarBgColor;
        ctx.fillRect(
          enemy.position.x - healthBarWidth / 2,
          enemy.position.y - enemy.size / 2 - 10,
          healthBarWidth,
          healthBarHeight
        );

        // Draw health bar fill
        ctx.fillStyle = healthBarColor;
        ctx.fillRect(
          enemy.position.x - healthBarWidth / 2,
          enemy.position.y - enemy.size / 2 - 10,
          healthBarWidth * healthPercentage,
          healthBarHeight
        );

        // Draw enemy level text above health bar
        if (enemy.level !== undefined) {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.font = 'bold 10px "Pixelify Sans", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          
          const levelText = `Lv.${enemy.level}`;
          const textY = enemy.position.y - enemy.size / 2 - 15;
          
          // Draw text with outline for visibility
          ctx.strokeText(levelText, enemy.position.x, textY);
          ctx.fillText(levelText, enemy.position.x, textY);
          ctx.restore();
        }
      });

      // Draw slash animations using PNG with fade in/out
      slashAnimationsRef.current.forEach((slash) => {
        const alpha = slash.life / slash.maxLife;
        const slashSprite = spriteManager.getSprite('slash_effect');
        
        if (slashSprite) {
          // Draw the PNG with fade effect (appears and disappears)
          ctx.save();
          ctx.globalAlpha = alpha; // Fade out as life decreases
          ctx.translate(slash.position.x, slash.position.y);
          ctx.rotate(slash.angle);
          
          // Calculate size to maintain aspect ratio
          const spriteAspect = slashSprite.width / slashSprite.height;
          let drawWidth = slash.size * 1.5;
          let drawHeight = drawWidth / spriteAspect;
          
          // Draw the PNG sprite
          ctx.drawImage(
            slashSprite,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
          );
          
          ctx.restore();
        } else {
          // Fallback to canvas-drawn arc if PNG not loaded
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(slash.position.x, slash.position.y);
          ctx.rotate(slash.angle);
          
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
          ctx.lineWidth = 8 * alpha;
          ctx.shadowBlur = 15;
          ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
          
          ctx.beginPath();
          const arcStart = -Math.PI / 3;
          const arcEnd = Math.PI / 3;
          const arcRadius = slash.size * 0.6;
          ctx.arc(0, 0, arcRadius, arcStart, arcEnd, false);
          ctx.stroke();
          
          ctx.restore();
        }
      });

      // Draw blood particles
      bloodParticlesRef.current.forEach((particle) => {
        const alpha = particle.life / particle.maxLife;
        const isFire = particle.id.startsWith('fire-');
        
        if (isFire) {
          // Fire explosion particles - yellow/orange gradient
          const fireColors = [
            `rgba(255, 255, 0, ${alpha})`, // Yellow
            `rgba(255, 200, 0, ${alpha})`, // Orange-yellow
            `rgba(255, 140, 0, ${alpha})`, // Orange
            `rgba(255, 69, 0, ${alpha})`,  // Red-orange
          ];
          const colorIndex = Math.floor(Math.random() * fireColors.length);
          ctx.fillStyle = fireColors[colorIndex];
          ctx.shadowBlur = 10;
          ctx.shadowColor = `rgba(255, 140, 0, ${alpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // Reset shadow
        } else {
          // Regular blood particles - dark red
          ctx.fillStyle = `rgba(139, 0, 0, ${alpha})`;
          ctx.beginPath();
          ctx.arc(particle.position.x, particle.position.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          
          // Add some brighter red particles
          if (Math.random() > 0.7) {
            ctx.fillStyle = `rgba(220, 20, 60, ${alpha * 0.8})`; // Crimson
            ctx.beginPath();
            ctx.arc(particle.position.x, particle.position.y, particle.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Draw health pickups with pulsing animation
      healthPickupsRef.current.forEach((pickup) => {
        const pulse = Math.sin(pickup.life) * 0.3 + 1; // Pulse between 0.7 and 1.3
        const size = pickup.size * pulse;
        
        ctx.save();
        ctx.translate(pickup.position.x, pickup.position.y);
        
        // Bright green circular glow effect
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#00ff00';
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw main sprite
        ctx.shadowBlur = 0;
        spriteManager.drawSprite(ctx, 'health_pickup', 0, 0, size, size, 0);
        
        ctx.restore();
      });

      // Draw ammo pickups with pulsing animation (only if not using sword)
      if (weapon.type !== 'sword') {
        ammoPickupsRef.current.forEach((pickup) => {
          const pulse = Math.sin(pickup.life) * 0.3 + 1; // Pulse between 0.7 and 1.3
          const size = pickup.size * pulse;
          
          ctx.save();
          ctx.translate(pickup.position.x, pickup.position.y);
          
          // Bright yellow circular glow effect
          ctx.shadowBlur = 25;
          ctx.shadowColor = '#ffaa00';
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Draw main sprite
          ctx.shadowBlur = 0;
          spriteManager.drawSprite(ctx, 'ammo_pickup', 0, 0, size, size, 0);
          
          ctx.restore();
        });
      }

      // Draw vest pickups with pulsing animation
      vestPickupsRef.current.forEach((pickup) => {
        const pulse = Math.sin(pickup.life) * 0.3 + 1; // Pulse between 0.7 and 1.3
        const size = pickup.size * pulse;
        
        ctx.save();
        ctx.translate(pickup.position.x, pickup.position.y);
        
        // Bright blue circular glow effect
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#0088ff';
        ctx.fillStyle = '#0088ff';
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw main sprite
        ctx.shadowBlur = 0;
        spriteManager.drawSprite(ctx, 'vest_pickup', 0, 0, size, size, 0);
        
        ctx.restore();
      });

      // Calculate mouse position in world coordinates
      const worldMouseX = mousePos.x + cameraOffsetX;
      const worldMouseY = mousePos.y + cameraOffsetY;

      // Draw shield effect if active
      if (isShieldActive) {
        const shieldPulse = Math.sin(Date.now() / 200) * 0.2 + 1; // Pulse animation
        const shieldSize = PLAYER_SIZE * 1.3 * shieldPulse;
        
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 8;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(newPlayerPos.x, newPlayerPos.y, shieldSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner ring
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(newPlayerPos.x, newPlayerPos.y, shieldSize / 2.2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Draw fire ring effect if active
      if (isFireRingActive) {
        const fireRingRadius = 300; // Doubled from 150
        const ringRotation = fireRingAnimationRef.current;
        
        ctx.save();
        ctx.translate(newPlayerPos.x, newPlayerPos.y);
        ctx.rotate(ringRotation);
        
        // Glowing perimeter circle (no solid fill)
        const pulseIntensity = Math.sin(Date.now() / 200) * 0.3 + 0.7; // Pulse between 0.4 and 1.0
        ctx.strokeStyle = `rgba(255, 140, 0, ${pulseIntensity})`; // Glowing orange
        ctx.lineWidth = 4;
        ctx.shadowBlur = 20;
        ctx.shadowColor = `rgba(255, 100, 0, ${pulseIntensity})`;
        ctx.beginPath();
        ctx.arc(0, 0, fireRingRadius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Fire particles around the ring
        for (let i = 0; i < 16; i++) {
          const angle = (i / 16) * Math.PI * 2 + ringRotation;
          const particleDist = fireRingRadius * 0.95;
          const particleX = Math.cos(angle) * particleDist;
          const particleY = Math.sin(angle) * particleDist;
          
          ctx.fillStyle = `rgba(255, ${100 + Math.sin(ringRotation + i) * 50}, 0, 0.9)`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = 'rgba(255, 140, 0, 0.8)';
          ctx.beginPath();
          ctx.arc(particleX, particleY, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }

      // Draw speed boost effect if active
      if (isSpeedBoostActive) {
        ctx.save();
        ctx.translate(newPlayerPos.x, newPlayerPos.y);
        
        // Draw speed lines around player
        const speedLineCount = 8;
        const speedLineLength = PLAYER_SIZE * 0.6;
        const speedLineRotation = Date.now() / 50; // Rotate quickly
        
        for (let i = 0; i < speedLineCount; i++) {
          const angle = (i / speedLineCount) * Math.PI * 2 + speedLineRotation;
          const startX = Math.cos(angle) * (PLAYER_SIZE * 0.6);
          const startY = Math.sin(angle) * (PLAYER_SIZE * 0.6);
          const endX = Math.cos(angle) * (PLAYER_SIZE * 0.6 + speedLineLength);
          const endY = Math.sin(angle) * (PLAYER_SIZE * 0.6 + speedLineLength);
          
          ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
          ctx.lineWidth = 3;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#00ffff';
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        
        ctx.restore();
      }

      // Draw damage boost effect if active
      if (isDamageBoostActive) {
        ctx.save();
        ctx.translate(newPlayerPos.x, newPlayerPos.y);
        
        // Draw red glow around player
        const damageGlowPulse = Math.sin(Date.now() / 150) * 0.15 + 1;
        const damageGlowSize = PLAYER_SIZE * 1.2 * damageGlowPulse;
        
        const damageGradient = ctx.createRadialGradient(0, 0, PLAYER_SIZE * 0.5, 0, 0, damageGlowSize);
        damageGradient.addColorStop(0, 'rgba(255, 0, 0, 0.6)');
        damageGradient.addColorStop(0.5, 'rgba(255, 100, 0, 0.4)');
        damageGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = damageGradient;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff0000';
        ctx.beginPath();
        ctx.arc(0, 0, damageGlowSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }

      // Draw freeze effect if active (ice particles around player)
      if (isFreezeActive) {
        ctx.save();
        ctx.translate(newPlayerPos.x, newPlayerPos.y);
        
        // Draw ice particles floating around player
        const iceParticleCount = 12;
        const iceParticleRadius = PLAYER_SIZE * 0.8;
        const iceRotation = Date.now() / 300; // Slow rotation
        
        for (let i = 0; i < iceParticleCount; i++) {
          const angle = (i / iceParticleCount) * Math.PI * 2 + iceRotation;
          const particleX = Math.cos(angle) * iceParticleRadius;
          const particleY = Math.sin(angle) * iceParticleRadius;
          
          ctx.fillStyle = 'rgba(173, 216, 230, 0.8)';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#add8e6';
          ctx.beginPath();
          ctx.arc(particleX, particleY, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      }

      // Draw player sprite (no rotation - always facing same direction)
      spriteManager.drawSprite(
        ctx,
        'player',
        newPlayerPos.x,
        newPlayerPos.y,
        PLAYER_SIZE,
        PLAYER_SIZE,
        0 // No rotation for player
      );

      // Draw weapon sprite that rotates with mouse aim
      // Offset weapon slightly to the right to look like player is holding it
      const gunAngle = Math.atan2(worldMouseY - newPlayerPos.y, worldMouseX - newPlayerPos.x);
      
      // Different sizes for different weapons
      let gunSize: number;
      if (weapon.type === 'rifle') {
        gunSize = PLAYER_SIZE * 0.9; // Rifle is 90% of player size (bigger)
      } else if (weapon.type === 'pistol') {
        gunSize = PLAYER_SIZE * 0.45; // Pistol is 55% of player size (smaller)
      } else if (weapon.type === 'sword') {
        gunSize = PLAYER_SIZE * 0.85; // Sword is 85% of player size (bigger)
      } else if (weapon.type === 'shotgun') {
        gunSize = PLAYER_SIZE * 0.8; // Shotgun is 80% of player size
      } else {
        gunSize = PLAYER_SIZE * 0.7; // Other weapons are 70% of player size
      }
      
      const gunOffsetX = Math.cos(gunAngle) * (PLAYER_SIZE * 0.1); // Offset along weapon direction
      const gunOffsetY = Math.sin(gunAngle) * (PLAYER_SIZE * 0.1);
      const gunX = newPlayerPos.x + gunOffsetX + (PLAYER_SIZE * 0.03); // Very small right offset
      const gunY = newPlayerPos.y + gunOffsetY;
      
      // Get weapon-specific sprite name based on current weapon type
      const weaponSpriteName = `weapon_${weapon.type}`;
      
      spriteManager.drawSprite(
        ctx,
        weaponSpriteName,
        gunX,
        gunY,
        gunSize,
        gunSize,
        gunAngle // Weapon rotates to face mouse
      );
      ctx.restore(); // Restore camera transform
    },
    [keys, mousePos, isGameOver, canvasWidth, canvasHeight, activeAbilities, fireWeapon, createHealthPickup, createAmmoPickup, createVestPickup, applyDamage, getMaxAmmo, weapon.type]
  );

  useGameLoop(gameLoop, !isGameOver && !showExitConfirm && !isPaused);

  return (
    <>
      <style>{`
        .exit-button {
          background-color: #5a0000;
        }
        .exit-button:hover {
          background-color: #7a0000;
        }
        .exit-confirm-no {
          background-color: #5a0000;
        }
        .exit-confirm-no:hover {
          background-color: #7a0000;
        }
        .exit-confirm-yes {
          background-color: #8b0000;
        }
        .exit-confirm-yes:hover {
          background-color: #aa0000;
        }
        .pause-button {
          background-color: #5a0000;
        }
        .pause-button:hover {
          background-color: #7a0000;
        }
      `}</style>
      <div className="relative w-screen h-screen">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair w-full h-full"
        />


        {/* Pause button - top center */}
        {(() => {
          const waveManager = waveManagerRef.current;
          const shouldShowPause = !isGameOver && !isPaused && !showExitConfirm && 
            !waveManager.isShowingPowerUpSelection() && !waveManager.isWaveCompleted();
          
          return shouldShowPause ? (
            <button
              onClick={() => setIsPaused(true)}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 border-4 border-white py-3 px-6 text-white font-bold pause-button z-30"
              style={{ 
                fontSize: '24px',
                imageRendering: 'pixelated',
                pointerEvents: 'auto',
                backgroundColor: '#5a0000'
              }}
            >
              <span style={{ fontSize: '32px' }}>⏸</span> PAUSE
            </button>
          ) : null;
        })()}

        {/* Pause modal */}
        {isPaused && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 pointer-events-auto" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
            <div className="border-4 border-white p-12 text-center shadow-2xl" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated', minWidth: '500px' }}>
              <h2 className="text-white mb-8 font-bold" style={{ fontSize: '48px', textShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
                GAME PAUSED
              </h2>
              <div className="flex gap-6 justify-center">
                <button
                  onClick={() => setIsPaused(false)}
                  className="border-4 border-white py-4 px-10 text-white font-bold transition-all exit-confirm-no"
                  style={{ 
                    fontSize: '18px',
                    imageRendering: 'pixelated'
                  }}
                >
                  RESUME
                </button>
                <button
                  onClick={() => {
                    setIsPaused(false);
                    setShowExitConfirm(true);
                  }}
                  className="border-4 border-white py-4 px-10 text-white font-bold transition-all exit-confirm-yes"
                  style={{ 
                    fontSize: '18px',
                    imageRendering: 'pixelated'
                  }}
                >
                  EXIT
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Exit confirmation modal */}
        {showExitConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 pointer-events-auto" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
            <div className="border-4 border-white p-12 text-center shadow-2xl" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated', minWidth: '500px' }}>
              <h2 className="text-white mb-8 font-bold" style={{ fontSize: '48px', textShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
                EXIT TO MAIN MENU?
              </h2>
              <p className="text-gray-300 mb-10 font-bold" style={{ fontSize: '20px' }}>
                YOUR PROGRESS WILL BE LOST
              </p>
              <div className="flex gap-6 justify-center">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="border-4 border-white py-4 px-10 text-white font-bold transition-all exit-confirm-no"
                  style={{ 
                    fontSize: '18px',
                    imageRendering: 'pixelated'
                  }}
                >
                  NO
                </button>
                <button
                  onClick={() => {
                    cleanupAllSounds();
                    onReturnToMenu();
                  }}
                  className="border-4 border-white py-4 px-10 text-white font-bold transition-all exit-confirm-yes"
                  style={{ 
                    fontSize: '18px',
                    imageRendering: 'pixelated'
                  }}
                >
                  YES
                </button>
              </div>
            </div>
          </div>
        )}

      <GameUI
        playerStats={playerStats}
        wave={waveManagerRef.current.getCurrentWave()}
        enemiesRemaining={enemyManagerRef.current.getCount()}
        enemiesKilled={enemyManagerRef.current.getKilledCount()}
        targetEnemies={enemyManagerRef.current.getTargetCount()}
        currentAmmo={currentAmmo}
        maxAmmo={getMaxAmmo()}
        weaponType={weapon.type}
      />

      {/* Show "Press E to continue" screen when wave is completed */}
      {waveManagerRef.current.isWaveCompleted() && (
        <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-40 pointer-events-auto" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
          <div className="border-4 border-white p-12 text-center shadow-2xl" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated', minWidth: '500px' }}>
            <h2 className="text-white mb-8 font-bold" style={{ fontSize: '48px', textShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>
              WAVE {waveManagerRef.current.getCurrentWave()} COMPLETE!
            </h2>
            <div className="text-white mb-6 font-bold" style={{ fontSize: '24px' }}>
              PRESS <span className="text-yellow-300 px-4 py-2 border-4 border-yellow-300 inline-block mx-2" style={{ backgroundColor: '#5a0000', fontSize: '32px' }}>E</span> TO CONTINUE
            </div>
            <p className="text-gray-300 mt-6 font-bold" style={{ fontSize: '18px' }}>TO THE NEXT WAVE</p>
          </div>
        </div>
      )}

      {availablePowerUps.length > 0 && (
        <PowerUpSelection
          powerUps={availablePowerUps}
          onSelectPowerUp={handlePowerUpSelect}
          wave={waveManagerRef.current.getCurrentWave() - 1}
        />
      )}

      {isGameOver && (
        <GameOver
          wave={waveManagerRef.current.getCurrentWave()}
          onReturnToMenu={() => {
            cleanupAllSounds();
            onReturnToMenu();
          }}
        />
      )}

      {/* Center screen countdown when ability is about to expire */}
      {(() => {
        const currentTime = Date.now();
        let expiringAbility: { name: string; secondsRemaining: number } | null = null;
        
        for (const ability of activeAbilities) {
          const abilityData = getAbilityByType(ability.type);
          if (!abilityData) continue;
          
          const isActive = currentTime < ability.endTime;
          if (isActive) {
            const durationRemaining = Math.max(0, ability.endTime - currentTime);
            const secondsRemaining = Math.ceil(durationRemaining / 1000);
            
            if (secondsRemaining <= 3 && secondsRemaining > 0) {
              // Show the ability with the least time remaining
              if (!expiringAbility || secondsRemaining < expiringAbility.secondsRemaining) {
                expiringAbility = {
                  name: abilityData.name,
                  secondsRemaining: secondsRemaining
                };
              }
            }
          }
        }
        
        if (expiringAbility) {
          return (
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
              <div className="text-center">
                <div className="text-red-400 font-bold animate-pulse" style={{ fontSize: '120px', textShadow: '6px 6px 0px rgba(0,0,0,0.9)' }}>
                  {expiringAbility.secondsRemaining}
                </div>
                <div className="text-yellow-300 font-bold mt-4" style={{ fontSize: '32px', textShadow: '4px 4px 0px rgba(0,0,0,0.8)' }}>
                  {expiringAbility.name.toUpperCase()} EXPIRING
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Active Abilities UI */}
      <div className="absolute bottom-4 left-4 flex gap-4 z-20 pointer-events-none" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
        {activeAbilities.map((ability, index) => {
          const abilityData = getAbilityByType(ability.type);
          if (!abilityData) return null;
          
          const currentTime = Date.now();
          const isActive = currentTime < ability.endTime;
          const isOnCooldown = currentTime < ability.cooldownEndTime;
          const cooldownRemaining = Math.max(0, ability.cooldownEndTime - currentTime);
          const cooldownPercent = isOnCooldown ? (cooldownRemaining / abilityData.cooldown) * 100 : 0;
          const durationRemaining = isActive ? Math.max(0, ability.endTime - currentTime) : 0;
          const durationPercent = isActive ? (durationRemaining / abilityData.duration) * 100 : 0;
          const secondsRemaining = Math.ceil(durationRemaining / 1000);
          const showCountdown = isActive && secondsRemaining <= 3 && secondsRemaining > 0;
          
          return (
            <div
              key={ability.type}
              className="border-4 border-white p-4 relative"
              style={{
                backgroundColor: isActive ? '#3a0000' : isOnCooldown ? '#1a0000' : '#5a0000',
                imageRendering: 'pixelated',
                opacity: isOnCooldown && !isActive ? 0.5 : 1,
              }}
            >
              <div className="text-center">
                <div className="mb-2 flex justify-center items-center" style={{ minHeight: '32px' }}>
                  <PixelIcon name={abilityData.icon} size={32} />
                </div>
                <div className="text-white font-bold mb-2" style={{ fontSize: '16px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
                  [{index + 1}]
                </div>
                <div className="text-yellow-300 font-bold mb-1" style={{ fontSize: '14px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
                  {abilityData.name.toUpperCase()}
                </div>
                {isActive && !showCountdown && (
                  <div className="text-cyan-300 font-bold" style={{ fontSize: '12px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
                    ACTIVE
                  </div>
                )}
                {showCountdown && (
                  <div className="text-red-400 font-bold animate-pulse" style={{ fontSize: '24px', textShadow: '3px 3px 0px rgba(0,0,0,0.9)' }}>
                    {secondsRemaining}
                  </div>
                )}
              </div>
              
              {/* Cooldown overlay */}
              {isOnCooldown && !isActive && (
                <div
                  className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 flex items-center justify-center"
                  style={{ height: `${cooldownPercent}%` }}
                >
                  <span className="text-white font-bold" style={{ fontSize: '16px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
                    {Math.ceil(cooldownRemaining / 1000)}s
                  </span>
                </div>
              )}
              
              {/* Active duration indicator */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-cyan-400" style={{ height: '4px' }}>
                  <div
                    className="h-full bg-yellow-400 transition-all"
                    style={{ width: `${durationPercent}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </>
  );
};

export default GameCanvas;
