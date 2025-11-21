import { useEffect, useRef, useState, useCallback } from 'react';
import { Weapon, PlayerStats, Projectile, PowerUp, Position } from '../types/game';
import { WeaponManager } from '../managers/WeaponManager';
import { EnemyManager } from '../managers/EnemyManager';
import { WaveManager } from '../managers/WaveManager';
import { useGameLoop } from '../hooks/useGameLoop';
import { useKeyboard } from '../hooks/useKeyboard';
import { checkCollision } from '../utils/gameUtils';
import GameUI from './GameUI';
import PowerUpSelection from './PowerUpSelection';
import GameOver from './GameOver';

interface GameCanvasProps {
  weapon: Weapon;
  onReturnToMenu: () => void;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const PLAYER_SIZE = 30;

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
  const lastDamageTimeRef = useRef<number>(0);
  const playerPosRef = useRef<Position>(playerPos);
  const playerStatsRef = useRef<PlayerStats>(playerStats);

  useEffect(() => {
    const waveManager = waveManagerRef.current;
    const enemyManager = enemyManagerRef.current;

    waveManager.startWave();
    enemyManager.spawnWave(1, playerPos);
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
    if (isGameOver || waveManagerRef.current.isShowingPowerUpSelection()) return;

    // Convert screen mouse position to world coordinates
    const cameraOffsetX = playerPosRef.current.x - CANVAS_WIDTH / 2;
    const cameraOffsetY = playerPosRef.current.y - CANVAS_HEIGHT / 2;
    const worldMousePos = {
      x: mousePos.x + cameraOffsetX,
      y: mousePos.y + cameraOffsetY,
    };

    const newProjectiles = weaponManagerRef.current.attack(
      playerPosRef.current,
      worldMousePos,
      playerStatsRef.current,
      Date.now()
    );

    if (newProjectiles.length > 0) {
      projectilesRef.current.push(...newProjectiles);
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

    waveManager.nextWave();
    enemyManager.spawnWave(waveManager.getCurrentWave(), playerPosRef.current);
  };

  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);

  useEffect(() => {
    playerStatsRef.current = playerStats;
  }, [playerStats]);

  const gameLoop = useCallback(
    (deltaTime: number) => {
      if (isGameOver || waveManagerRef.current.isShowingPowerUpSelection()) return;

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

      enemyManager.updateEnemies(newPlayerPos, deltaTime);

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
            enemyManager.damageEnemy(
              enemy.id,
              proj.damage,
              playerStatsRef.current.knockback,
              newPlayerPos
            );
            if (!proj.piercing) {
              hit = true;
            }
          }
        });

        // Instant melee attacks (like knife) disappear immediately after collision check
        if (proj.isInstant) {
          return; // Don't add to remaining projectiles - disappears after one frame
        }

        if (!hit) {
          remainingProjectiles.push(proj);
        }
      });

      projectilesRef.current = remainingProjectiles;

      const currentTime = Date.now();
      if (currentTime - lastDamageTimeRef.current > 300) {
        const damage = enemyManager.checkPlayerCollision(newPlayerPos, PLAYER_SIZE);
        if (damage > 0) {
          setPlayerStats((prev) => {
            const newHealth = prev.health - damage * 0.25; // Much more damage - 25% of enemy damage
            if (newHealth <= 0) {
              setIsGameOver(true);
              return { ...prev, health: 0 };
            }
            return { ...prev, health: newHealth };
          });
          lastDamageTimeRef.current = currentTime;
        }
      }

      if (enemyManager.isEmpty() && waveManager.isWaveInProgress()) {
        waveManager.completeWave();
        setAvailablePowerUps(waveManager.getRandomPowerUps(3));
      }

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !canvas) return;

      // Camera offset to center player on screen
      const cameraOffsetX = newPlayerPos.x - CANVAS_WIDTH / 2;
      const cameraOffsetY = newPlayerPos.y - CANVAS_HEIGHT / 2;

      ctx.save();
      ctx.translate(-cameraOffsetX, -cameraOffsetY);

      // Infinite background grid
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

      projectilesRef.current.forEach((proj) => {
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(proj.position.x, proj.position.y, proj.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      enemyManager.getEnemies().forEach((enemy) => {
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(enemy.position.x, enemy.position.y, enemy.size / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 3;
        ctx.stroke();

        const healthBarWidth = enemy.size;
        const healthBarHeight = 4;
        const healthPercentage = enemy.health / enemy.maxHealth;

        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(
          enemy.position.x - healthBarWidth / 2,
          enemy.position.y - enemy.size / 2 - 10,
          healthBarWidth,
          healthBarHeight
        );

        ctx.fillStyle = '#27ae60';
        ctx.fillRect(
          enemy.position.x - healthBarWidth / 2,
          enemy.position.y - enemy.size / 2 - 10,
          healthBarWidth * healthPercentage,
          healthBarHeight
        );
      });

      // Calculate mouse position in world coordinates
      const worldMouseX = mousePos.x + cameraOffsetX;
      const worldMouseY = mousePos.y + cameraOffsetY;

      ctx.save();
      ctx.translate(newPlayerPos.x, newPlayerPos.y);

      const angle = Math.atan2(worldMouseY - newPlayerPos.y, worldMouseX - newPlayerPos.x);
      ctx.rotate(angle + Math.PI / 2);

      ctx.fillStyle = '#3498db';
      ctx.beginPath();
      ctx.moveTo(0, -PLAYER_SIZE / 2);
      ctx.lineTo(PLAYER_SIZE / 2, PLAYER_SIZE / 2);
      ctx.lineTo(0, PLAYER_SIZE / 4);
      ctx.lineTo(-PLAYER_SIZE / 2, PLAYER_SIZE / 2);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#2980b9';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();
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
      />

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
