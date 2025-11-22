import { useEffect, useRef, useState, useCallback } from 'react';
import { Weapon, PlayerStats, Projectile, PowerUp, Position, BloodParticle, SlashAnimation } from '../types/game';
import { WeaponManager } from '../managers/WeaponManager';
import { EnemyManager } from '../managers/EnemyManager';
import { WaveManager } from '../managers/WaveManager';
import { useGameLoop } from '../hooks/useGameLoop';
import { useKeyboard } from '../hooks/useKeyboard';
import { checkCollision } from '../utils/gameUtils';
import { spriteManager } from '../utils/spriteManager';
import GameUI from './GameUI';
import PowerUpSelection from './PowerUpSelection';
import GameOver from './GameOver';

interface GameCanvasProps {
  weapon: Weapon;
  onReturnToMenu: () => void;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const PLAYER_SIZE = 120; // Increased from 90 to 120

const GameCanvas = ({ weapon, onReturnToMenu }: GameCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keys = useKeyboard();

  const [playerPos, setPlayerPos] = useState<Position>({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
  });

  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    maxHealth: 80, // Reduced starting health
    health: 80,
    movementSpeed: 3,
    damage: 1,
    attackSpeed: 1,
    projectileSize: 1,
    knockback: 10,
    cooldownReduction: 0,
  });

  const [mousePos, setMousePos] = useState<Position>({ x: 0, y: 0 });
  const [isGameOver, setIsGameOver] = useState(false);
  const [availablePowerUps, setAvailablePowerUps] = useState<PowerUp[]>([]);

  const weaponManagerRef = useRef<WeaponManager>(new WeaponManager(weapon));
  const enemyManagerRef = useRef<EnemyManager>(
    new EnemyManager(CANVAS_WIDTH, CANVAS_HEIGHT)
  );
  const waveManagerRef = useRef<WaveManager>(new WaveManager());

  const projectilesRef = useRef<Projectile[]>([]);
  const bloodParticlesRef = useRef<BloodParticle[]>([]);
  const slashAnimationsRef = useRef<SlashAnimation[]>([]);
  const swordAttackAngleRef = useRef<number | null>(null);
  const swordAttackTimeRef = useRef<number>(0);
  const lastDamageTimeRef = useRef<number>(0);
  const playerPosRef = useRef<Position>(playerPos);
  const playerStatsRef = useRef<PlayerStats>(playerStats);
  const spritesLoadedRef = useRef<boolean>(false);

  useEffect(() => {
    // Load sprites on mount
    spriteManager.loadSprites().then(() => {
      spritesLoadedRef.current = true;
    });

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
    const cameraOffsetX = playerPosRef.current.x - CANVAS_WIDTH / 2;
    const cameraOffsetY = playerPosRef.current.y - CANVAS_HEIGHT / 2;
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
      
      // If sword attack, create slash animation at sword tip (extended for range)
      if (weapon.type === 'sword' && newProjectiles.length > 0) {
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
  }, [isGameOver, mousePos]);

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
    setPlayerStats((prev) => powerUp.effect(prev));
    setAvailablePowerUps([]);

    const waveManager = waveManagerRef.current;
    const enemyManager = enemyManagerRef.current;

    // Calculate world mouse position for enemy spawning direction
    const cameraOffsetX = playerPosRef.current.x - CANVAS_WIDTH / 2;
    const cameraOffsetY = playerPosRef.current.y - CANVAS_HEIGHT / 2;
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

  // Handle E key press to continue to power-up selection
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        const waveManager = waveManagerRef.current;
        if (waveManager.isWaveCompleted() && !waveManager.isShowingPowerUpSelection()) {
          waveManager.showPowerUpSelection();
          setAvailablePowerUps(waveManager.getRandomPowerUps(3));
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const gameLoop = useCallback(
    (deltaTime: number) => {
      if (isGameOver || waveManagerRef.current.isShowingPowerUpSelection() || waveManagerRef.current.isWaveCompleted()) return;

      const enemyManager = enemyManagerRef.current;
      const waveManager = waveManagerRef.current;

      let newPlayerPos = { ...playerPosRef.current };
      const speed = playerStatsRef.current.movementSpeed * (deltaTime / 16);

      if (keys['w'] || keys['arrowup']) newPlayerPos.y -= speed;
      if (keys['s'] || keys['arrowdown']) newPlayerPos.y += speed;
      if (keys['a'] || keys['arrowleft']) newPlayerPos.x -= speed;
      if (keys['d'] || keys['arrowright']) newPlayerPos.x += speed;

      // No boundary clamping - infinite world

      setPlayerPos(newPlayerPos);
      playerPosRef.current = newPlayerPos;

      // Calculate world mouse position for enemy spawning direction
      const cameraOffsetX = newPlayerPos.x - CANVAS_WIDTH / 2;
      const cameraOffsetY = newPlayerPos.y - CANVAS_HEIGHT / 2;
      const worldMousePos = {
        x: mousePos.x + cameraOffsetX,
        y: mousePos.y + cameraOffsetY,
      };

      enemyManager.updateEnemies(newPlayerPos, deltaTime, waveManager.isWaveInProgress(), worldMousePos);

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
      projectilesRef.current.forEach((proj) => {
        let hit = false;

        enemyManager.getEnemies().forEach((enemy) => {
          if (checkCollision(proj.position, proj.size, enemy.position, enemy.size)) {
            const result = enemyManager.damageEnemy(
              enemy.id,
              proj.damage,
              playerStatsRef.current.knockback,
              newPlayerPos
            );
            
            // Create blood effect if enemy was killed
            if (result.killed && result.position) {
              createBloodEffect(result.position, enemy.size, 1);
            }
            
            if (!proj.piercing) {
              hit = true;
            }
          }
        });

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

      const currentTime = Date.now();
      if (currentTime - lastDamageTimeRef.current > 300) {
        const damage = enemyManager.checkPlayerCollision(newPlayerPos, PLAYER_SIZE);
        if (damage > 0) {
          setPlayerStats((prev) => {
            const newHealth = prev.health - damage * 0.25; // Much more damage - 25% of enemy damage
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
        const startX = Math.floor((newPlayerPos.x - CANVAS_WIDTH) / bgWidth) * bgWidth;
        const startY = Math.floor((newPlayerPos.y - CANVAS_HEIGHT) / bgHeight) * bgHeight;
        const endX = newPlayerPos.x + CANVAS_WIDTH;
        const endY = newPlayerPos.y + CANVAS_HEIGHT;

        for (let x = startX; x < endX; x += bgWidth) {
          for (let y = startY; y < endY; y += bgHeight) {
            ctx.drawImage(backgroundSprite, x, y, bgWidth, bgHeight);
          }
        }
      } else {
        // Fallback to grid if background image not loaded
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(
          newPlayerPos.x - CANVAS_WIDTH,
          newPlayerPos.y - CANVAS_HEIGHT,
          CANVAS_WIDTH * 3,
          CANVAS_HEIGHT * 3
        );

        ctx.fillStyle = '#16213e';
        const gridSize = 50;
        const gridStartX = Math.floor((newPlayerPos.x - CANVAS_WIDTH) / gridSize) * gridSize;
        const gridStartY = Math.floor((newPlayerPos.y - CANVAS_HEIGHT) / gridSize) * gridSize;
        const gridEndX = newPlayerPos.x + CANVAS_WIDTH;
        const gridEndY = newPlayerPos.y + CANVAS_HEIGHT;

        for (let x = gridStartX; x < gridEndX; x += gridSize) {
          for (let y = gridStartY; y < gridEndY; y += gridSize) {
            if ((Math.floor(x / gridSize) + Math.floor(y / gridSize)) % 2 === 0) {
              ctx.fillRect(x, y, gridSize, gridSize);
            }
          }
        }
      }

      // Draw projectiles with sprites
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

      // Draw enemies with sprites
      enemyManager.getEnemies().forEach((enemy) => {
        // Get sprite name based on enemy type
        let spriteName = 'enemy';
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
        ctx.fillStyle = `rgba(139, 0, 0, ${alpha})`; // Dark red with fade
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
      });

      // Calculate mouse position in world coordinates
      const worldMouseX = mousePos.x + cameraOffsetX;
      const worldMouseY = mousePos.y + cameraOffsetY;

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
    [keys, mousePos, isGameOver]
  );

  useGameLoop(gameLoop, !isGameOver);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="cursor-crosshair"
      />

      <GameUI
        playerStats={playerStats}
        wave={waveManagerRef.current.getCurrentWave()}
        enemiesRemaining={enemyManagerRef.current.getCount()}
        enemiesKilled={enemyManagerRef.current.getKilledCount()}
        targetEnemies={enemyManagerRef.current.getTargetCount()}
      />

      {/* Show "Press E to continue" screen when wave is completed */}
      {waveManagerRef.current.isWaveCompleted() && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-40 pointer-events-auto">
          <div className="text-white text-center">
            <h2 className="text-6xl font-bold mb-6 text-green-400 drop-shadow-2xl">
              Wave {waveManagerRef.current.getCurrentWave()} Complete!
            </h2>
            <div className="text-4xl mb-4 text-gray-200">
              Press <span className="text-green-400 font-bold text-5xl px-3 py-1 bg-gray-800 rounded-lg border-2 border-green-400">E</span> to continue
            </div>
            <p className="text-xl text-gray-400 mt-4">to the next wave</p>
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
          onReturnToMenu={onReturnToMenu}
        />
      )}
    </div>
  );
};

export default GameCanvas;
