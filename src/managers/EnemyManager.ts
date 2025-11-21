import { Enemy, Position } from '../types/game';
import { generateId, normalize, distance, randomInRange } from '../utils/gameUtils';

export class EnemyManager {
  private enemies: Enemy[] = [];
  private canvasWidth: number;
  private canvasHeight: number;
  private spawnedEnemiesThisWave: number = 0;
  private targetEnemyCount: number = 0;
  private currentWave: number = 0;
  private lastSpawnTime: number = 0;
  private waveBaseHealth: number = 0;
  private waveBaseSpeed: number = 0;
  private waveBaseDamage: number = 0;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  spawnWave(wave: number, playerPos?: Position): void {
    // Reset counter for new wave
    this.spawnedEnemiesThisWave = 0;
    this.currentWave = wave;
    this.lastSpawnTime = Date.now();
    
    // Much harder difficulty: more enemies, stronger stats
    this.targetEnemyCount = Math.min(12 + wave * 6, 80);
    this.waveBaseHealth = 40 + wave * 10;
    this.waveBaseSpeed = 2.0 + wave * 0.25; // Much faster enemies
    this.waveBaseDamage = 15 + wave * 5; // Much more damage
  }

  updateSpawning(playerPos?: Position, isWaveInProgress?: boolean): void {
    // Only spawn if wave is in progress
    if (!isWaveInProgress) return;

    // Spawn enemies gradually during the wave until we reach target count
    const currentTime = Date.now();
    const spawnInterval = 600; // Spawn one enemy every 600ms

    if (
      this.spawnedEnemiesThisWave < this.targetEnemyCount &&
      currentTime - this.lastSpawnTime >= spawnInterval
    ) {
      this.spawnEnemy(this.waveBaseHealth, this.waveBaseSpeed, this.waveBaseDamage, playerPos);
      this.lastSpawnTime = currentTime;
    }
  }

  private spawnEnemy(health: number, speed: number, damage: number, playerPos?: Position): void {
    // Spawn enemies outside visible frame from different directions
    const spawnDistance = 700; // Distance outside visible area
    let x: number, y: number;

    if (playerPos) {
      // Calculate visible area bounds (camera view)
      const viewLeft = playerPos.x - this.canvasWidth / 2;
      const viewRight = playerPos.x + this.canvasWidth / 2;
      const viewTop = playerPos.y - this.canvasHeight / 2;
      const viewBottom = playerPos.y + this.canvasHeight / 2;

      // Spawn from one of four directions (north, south, east, west)
      const direction = Math.floor(Math.random() * 4);
      
      switch (direction) {
        case 0: // North (top)
          x = viewLeft + Math.random() * this.canvasWidth;
          y = viewTop - spawnDistance - Math.random() * 100;
          break;
        case 1: // South (bottom)
          x = viewLeft + Math.random() * this.canvasWidth;
          y = viewBottom + spawnDistance + Math.random() * 100;
          break;
        case 2: // East (right)
          x = viewRight + spawnDistance + Math.random() * 100;
          y = viewTop + Math.random() * this.canvasHeight;
          break;
        default: // West (left)
          x = viewLeft - spawnDistance - Math.random() * 100;
          y = viewTop + Math.random() * this.canvasHeight;
          break;
      }
    } else {
      // Fallback to old method if no player position (shouldn't happen)
      const side = Math.floor(Math.random() * 4);
      switch (side) {
        case 0:
          x = Math.random() * this.canvasWidth;
          y = -50;
          break;
        case 1:
          x = this.canvasWidth + 50;
          y = Math.random() * this.canvasHeight;
          break;
        case 2:
          x = Math.random() * this.canvasWidth;
          y = this.canvasHeight + 50;
          break;
        default:
          x = -50;
          y = Math.random() * this.canvasHeight;
      }
    }

    this.spawnedEnemiesThisWave++;

    const size = randomInRange(20, 30);

    this.enemies.push({
      id: generateId(),
      position: { x, y },
      health,
      maxHealth: health,
      speed,
      damage,
      size,
    });
  }

  updateEnemies(playerPos: Position, deltaTime: number, isWaveInProgress?: boolean): void {
    // Spawn new enemies during the wave
    this.updateSpawning(playerPos, isWaveInProgress);

    this.enemies.forEach((enemy) => {
      const direction = normalize({
        x: playerPos.x - enemy.position.x,
        y: playerPos.y - enemy.position.y,
      });

      const moveSpeed = enemy.speed * (deltaTime / 16);
      enemy.position.x += direction.x * moveSpeed;
      enemy.position.y += direction.y * moveSpeed;
    });
  }

  damageEnemy(enemyId: string, damage: number, knockback: number, playerPos: Position): boolean {
    const enemy = this.enemies.find((e) => e.id === enemyId);
    if (!enemy) return false;

    enemy.health -= damage;

    const direction = normalize({
      x: enemy.position.x - playerPos.x,
      y: enemy.position.y - playerPos.y,
    });

    enemy.position.x += direction.x * knockback;
    enemy.position.y += direction.y * knockback;

    if (enemy.health <= 0) {
      this.enemies = this.enemies.filter((e) => e.id !== enemyId);
      return true;
    }

    return false;
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  checkPlayerCollision(playerPos: Position, playerSize: number): number {
    let totalDamage = 0;
    const currentTime = Date.now();

    this.enemies.forEach((enemy) => {
      const dist = distance(playerPos, enemy.position);
      if (dist < (playerSize + enemy.size) / 2) {
        totalDamage += enemy.damage;
      }
    });

    return totalDamage;
  }

  clear(): void {
    this.enemies = [];
    this.spawnedEnemiesThisWave = 0;
    this.targetEnemyCount = 0;
    this.currentWave = 0;
    this.lastSpawnTime = 0;
  }

  isEmpty(): boolean {
    return this.enemies.length === 0;
  }

  getCount(): number {
    return this.enemies.length;
  }
}
