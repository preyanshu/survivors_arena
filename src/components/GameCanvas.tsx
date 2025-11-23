import { useEffect, useRef, useState, useCallback } from 'react';
import { Weapon, PlayerStats, Projectile, PowerUp, Position, BloodParticle, SlashAnimation, HealthPickup, ActiveAbilityType, ActiveAbilityState } from '../types/game';
import { getAbilityByType } from '../data/activeAbilities';
import { PixelIcon } from '../utils/pixelIcons';
import { WeaponManager } from '../managers/WeaponManager';
import { EnemyManager } from '../managers/EnemyManager';
import { WaveManager } from '../managers/WaveManager';
import { useGameLoop } from '../hooks/useGameLoop';
import { useKeyboard } from '../hooks/useKeyboard';
import { checkCollision, generateId, distance } from '../utils/gameUtils';
import { spriteManager } from '../utils/spriteManager';
import { GAME_BALANCE } from '../data/gameBalance';
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
      if (enemyProjectileDestroyedSoundRef.current) {
        const sound = enemyProjectileDestroyedSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    }, () => {
      // Temporary callback, will be replaced in useEffect
      if (enemySplitSoundRef.current) {
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
  const swordAttackAngleRef = useRef<number | null>(null);
  const swordAttackTimeRef = useRef<number>(0);
  const lastDamageTimeRef = useRef<number>(0);
  const lastHealthPickupSpawnRef = useRef<number>(0);
  const lastFireRingDamageRef = useRef<number>(0);
  const fireRingAnimationRef = useRef<number>(0);
  const lastShieldBlockSoundRef = useRef<number>(0);
  const playerPosRef = useRef<Position>(playerPos);
  const playerStatsRef = useRef<PlayerStats>(playerStats);
  const spritesLoadedRef = useRef<boolean>(false);
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
      if (enemyProjectileSoundRef.current) {
        const sound = enemyProjectileSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    const playBerserkerSound = () => {
      if (berserkerSoundRef.current) {
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
      
      if (chargingSoundRef.current) {
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
      
      if (chargedShotSoundRef.current) {
        const sound = chargedShotSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    const playWeakEnemyBlastSound = () => {
      if (weakEnemyBlastSoundRef.current) {
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
      if (normalEnemyDeathSoundRef.current) {
        const sound = normalEnemyDeathSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    const playShieldBlockSound = () => {
      if (enemyProjectileDestroyedSoundRef.current) {
        const sound = enemyProjectileDestroyedSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    const playEnemySplitSound = () => {
      if (enemySplitSoundRef.current) {
        const sound = enemySplitSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    enemyManagerRef.current = new EnemyManager(canvasWidth, canvasHeight, playEnemyProjectileSound, playBerserkerSound, playChargingSound, stopChargingSound, playChargedShotSound, playWeakEnemyBlastSound, playNormalEnemyDeathSound, playShieldBlockSound, playEnemySplitSound);
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    // Load sprites on mount
    spriteManager.loadSprites().then(() => {
      spritesLoadedRef.current = true;
    });

    // Initialize pistol sound
    const pistolSound = new Audio('/assets/pistol-shot-233473.mp3');
    pistolSound.volume = 0.3; // Set volume to 30%
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

    // Initialize ability activation/deactivation sound
    const abilityActivationSound = new Audio('/assets/flame-spell-impact-393919.mp3');
    abilityActivationSound.volume = 0.3; // Set volume to 30%
    abilityActivationSoundRef.current = abilityActivationSound;

    // Create callback for enemy projectile sound
    const playEnemyProjectileSound = () => {
      if (enemyProjectileSoundRef.current) {
        const sound = enemyProjectileSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    
    // Create callback for berserker sound
    const playBerserkerSound = () => {
      if (berserkerSoundRef.current) {
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
      
      if (chargingSoundRef.current) {
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
      
      if (chargedShotSoundRef.current) {
        const sound = chargedShotSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    
    // Create callback for weak enemy blast sound (only first 1 second)
    const playWeakEnemyBlastSound = () => {
      if (weakEnemyBlastSoundRef.current) {
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
      if (normalEnemyDeathSoundRef.current) {
        const sound = normalEnemyDeathSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    
    // Create callback for shield block sound
    const playShieldBlockSound = () => {
      if (enemyProjectileDestroyedSoundRef.current) {
        const sound = enemyProjectileDestroyedSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
    };
    
    // Create callback for enemy split sound
    const playEnemySplitSound = () => {
      if (enemySplitSoundRef.current) {
        const sound = enemySplitSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
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
    enemyManagerRef.current = new EnemyManager(canvasWidth, canvasHeight, playEnemyProjectileSound, playBerserkerSound, playChargingSound, stopChargingSound, playChargedShotSound, playWeakEnemyBlastSound, playNormalEnemyDeathSound, playShieldBlockSound, playEnemySplitSound);

    const waveManager = waveManagerRef.current;
    const enemyManager = enemyManagerRef.current;

    // Calculate initial world mouse position (center of screen)
    const initialWorldMouse = {
      x: playerPos.x,
      y: playerPos.y + 100, // Default to below player
    };

    waveManager.startWave();
    enemyManager.spawnWave(1, playerPos, initialWorldMouse);
  }, []);

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

  const handleMouseDown = useCallback(() => {
    if (isGameOver || waveManagerRef.current.isShowingPowerUpSelection() || waveManagerRef.current.isWaveCompleted()) return;

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
      
      // Play pistol sound effect when pistol or assault rifle is fired
      if ((weapon.type === 'pistol' || weapon.type === 'assault_rifle') && pistolSoundRef.current) {
        const sound = pistolSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
      
      // Play rifle sound effect when rifle is fired
      if (weapon.type === 'rifle' && rifleSoundRef.current) {
        const sound = rifleSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
      
      // Play shotgun sound effect when shotgun is fired
      if (weapon.type === 'shotgun' && shotgunSoundRef.current) {
        const sound = shotgunSoundRef.current.cloneNode() as HTMLAudioElement;
        sound.volume = 0.3;
        sound.play().catch(() => {
          // Ignore autoplay errors
        });
      }
      
      // If sword attack, create slash animation at sword tip (extended for range)
      if (weapon.type === 'sword' && newProjectiles.length > 0) {
        // Play sword sound effect
        if (swordSoundRef.current) {
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
  }, [isGameOver, mousePos, canvasWidth, canvasHeight, weapon.type]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, [handleMouseMove, handleMouseDown]);

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
  };

  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    playerStatsRef.current = playerStats;
  }, [playerStats]);

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
            if (abilityActivationSoundRef.current) {
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
          if (abilityActivationSoundRef.current) {
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
      const effectiveSpeed = isSpeedBoostActive ? baseSpeed * 2 : baseSpeed;
      const speed = effectiveSpeed * (deltaTime / 16);

      if (keys['w'] || keys['arrowup']) newPlayerPos.y -= speed;
      if (keys['s'] || keys['arrowdown']) newPlayerPos.y += speed;
      if (keys['a'] || keys['arrowleft']) newPlayerPos.x -= speed;
      if (keys['d'] || keys['arrowright']) newPlayerPos.x += speed;

      // No boundary clamping - infinite world

      setPlayerPos(newPlayerPos);
      playerPosRef.current = newPlayerPos;

      // Calculate world mouse position for enemy spawning direction
      const cameraOffsetX = newPlayerPos.x - canvasWidth / 2;
      const cameraOffsetY = newPlayerPos.y - canvasHeight / 2;
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
              if (enemyProjectileDestroyedSoundRef.current) {
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
              const effectiveDamage = isDamageBoostActive ? proj.damage * 3 : proj.damage;
              
              const result = enemyManager.damageEnemy(
                enemy.id,
                effectiveDamage,
                playerStatsRef.current.knockback,
                newPlayerPos
              );
              
              // Create blood effect if enemy was killed
              if (result.killed && result.position) {
                // WEAK enemies always create fire explosion effect on death
                if (result.exploded) {
                  createFireExplosion(result.position, enemy.size * 1.2, 1.5); // Smaller, less intense fire explosion
                  // Apply explosion damage to player if explosionDamage > 0 (player was in range)
                  if (result.explosionDamage && result.explosionDamage > 0) {
                    if (isShieldActive) {
                      // Play shield block sound (throttled to prevent spam)
                      if (currentTime - lastShieldBlockSoundRef.current > 200) {
                        if (enemyProjectileDestroyedSoundRef.current) {
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
                        const newHealth = prev.health - result.explosionDamage!;
                        if (newHealth <= 0) {
                          createBloodEffect(newPlayerPos, PLAYER_SIZE, 5);
                          setIsGameOver(true);
                          return { ...prev, health: 0 };
                        }
                        createBloodEffect(newPlayerPos, PLAYER_SIZE * 0.7, 1.5);
                        return { ...prev, health: newHealth };
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

      // Spawn health pickups periodically
      const healthPickupSpawnTime = Date.now();
      const healthPickupSpawnInterval = GAME_BALANCE.healthPickups.spawnInterval;
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
          if (healthPickupSoundRef.current) {
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

      // Fire ring damages nearby enemies (with damage tick rate)
      if (isFireRingActive) {
        const fireRingRadius = 300; // Doubled from 150
        const fireRingDamage = 30; // Doubled from 15
        const fireRingTickRate = 500; // Damage every 500ms
        
        // First, mark all enemies as not burning, then mark those in range
        enemyManager.getEnemies().forEach((enemy) => {
          enemy.isBurning = false;
        });
        
        if (currentTime - lastFireRingDamageRef.current >= fireRingTickRate) {
          enemyManager.getEnemies().forEach((enemy) => {
            const dist = distance(newPlayerPos, enemy.position);
            if (dist < fireRingRadius) {
              // Mark enemy as burning
              enemy.isBurning = true;
              
              const result = enemyManager.damageEnemy(
                enemy.id,
                fireRingDamage,
                0,
                newPlayerPos
              );
              if (result.killed && result.position) {
                // WEAK enemies always create fire explosion effect on death
                if (result.exploded) {
                  createFireExplosion(result.position, enemy.size * 1.2, 1.5); // Smaller, less intense fire explosion
                  // Apply explosion damage to player if explosionDamage > 0 (player was in range)
                  if (result.explosionDamage && result.explosionDamage > 0) {
                    if (isShieldActive) {
                      // Play shield block sound (throttled to prevent spam)
                      if (currentTime - lastShieldBlockSoundRef.current > 200) {
                        if (enemyProjectileDestroyedSoundRef.current) {
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
                        const newHealth = prev.health - result.explosionDamage!;
                        if (newHealth <= 0) {
                          createBloodEffect(newPlayerPos, PLAYER_SIZE, 5);
                          setIsGameOver(true);
                          return { ...prev, health: 0 };
                        }
                        createBloodEffect(newPlayerPos, PLAYER_SIZE * 0.7, 1.5);
                        return { ...prev, health: newHealth };
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
        } else {
          // Still mark enemies as burning even between damage ticks
          enemyManager.getEnemies().forEach((enemy) => {
            const dist = distance(newPlayerPos, enemy.position);
            if (dist < fireRingRadius) {
              enemy.isBurning = true;
            }
          });
        }
        // Update fire ring animation
        fireRingAnimationRef.current += deltaTime / 1000 * 2;
      } else {
        fireRingAnimationRef.current = 0;
        // Clear burning state when fire ring is not active
        enemyManager.getEnemies().forEach((enemy) => {
          enemy.isBurning = false;
        });
      }

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
              if (enemyProjectileDestroyedSoundRef.current) {
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
              const newHealth = prev.health - proj.damage * 0.3; // Projectiles do 30% of their damage
              if (newHealth <= 0) {
                // Large blood effect on death
                createBloodEffect(newPlayerPos, PLAYER_SIZE, 5);
                setIsGameOver(true);
                return { ...prev, health: 0 };
              }
              // Small blood effect when taking damage
              createBloodEffect(newPlayerPos, PLAYER_SIZE * 0.5, 0.6);
              return { ...prev, health: newHealth };
            });
            lastDamageTimeRef.current = currentTime;
          }
          // Remove projectile after hitting player
          enemyManager.removeEnemyProjectile(proj.id);
          
          // Play explosion sound effect
          if (enemyProjectileDestroyedSoundRef.current) {
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
              if (enemyProjectileDestroyedSoundRef.current) {
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
              const newHealth = prev.health - damage * damageMultiplier;
              if (newHealth <= 0) {
                // Large blood effect on death
                createBloodEffect(newPlayerPos, PLAYER_SIZE, 5);
                setIsGameOver(true);
                return { ...prev, health: 0 };
              }
              // Small blood effect when taking damage (larger for explosions)
              const effectSize = collisionResult.explodedEnemies.length > 0 ? 0.8 : 0.5;
              const effectIntensity = collisionResult.explodedEnemies.length > 0 ? 1.5 : 0.6;
              createBloodEffect(newPlayerPos, PLAYER_SIZE * effectSize, effectIntensity);
              return { ...prev, health: newHealth };
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
        
        // Outer glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ff00';
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner cross/plus symbol
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 0;
        const crossSize = size * 0.3;
        const crossWidth = size * 0.15;
        
        // Horizontal line
        ctx.fillRect(-crossSize / 2, -crossWidth / 2, crossSize, crossWidth);
        // Vertical line
        ctx.fillRect(-crossWidth / 2, -crossSize / 2, crossWidth, crossSize);
        
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
    [keys, mousePos, isGameOver, canvasWidth, canvasHeight, activeAbilities]
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
