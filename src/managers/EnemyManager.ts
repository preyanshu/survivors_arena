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

  spawnWave(wave: number, playerPos?: Position, mousePos?: Position): void {
    // Reset counter for new wave
    this.spawnedEnemiesThisWave = 0;
    this.currentWave = wave;
    this.lastSpawnTime = Date.now();
    
    // Much harder difficulty: more enemies, stronger stats
    this.targetEnemyCount = Math.min(12 + wave * 6, 80);
    this.waveBaseHealth = 40 + wave * 10;
    this.waveBaseSpeed = 2.0 + wave * 0.25; // Much faster enemies
    this.waveBaseDamage = 15 + wave * 5; // Much more damage

    // Spawn first few enemies immediately to start the wave
    const initialSpawn = Math.min(3, this.targetEnemyCount);
    for (let i = 0; i < initialSpawn; i++) {
      this.spawnEnemy(this.waveBaseHealth, this.waveBaseSpeed, this.waveBaseDamage, playerPos, mousePos);
    }
  }

  updateSpawning(playerPos?: Position, isWaveInProgress?: boolean, mousePos?: Position): void {
    // Only spawn if wave is in progress
    if (!isWaveInProgress) return;

    // Don't spawn if we've already spawned all enemies
    if (this.spawnedEnemiesThisWave >= this.targetEnemyCount) return;

    // Spawn enemies gradually - only spawn more when there are fewer alive enemies
    // This creates a dynamic wave where enemies spawn as you kill them
    const maxAliveEnemies = Math.max(8, Math.floor(this.targetEnemyCount * 0.4)); // Max 40% of target alive at once, minimum 8
    const currentAlive = this.enemies.length;
    
    // Only spawn if we have room for more enemies (player has killed some)
    if (currentAlive >= maxAliveEnemies) return;

    const currentTime = Date.now();
    const spawnInterval = 800; // Spawn one enemy every 800ms when conditions are met

    if (currentTime - this.lastSpawnTime >= spawnInterval) {
      this.spawnEnemy(this.waveBaseHealth, this.waveBaseSpeed, this.waveBaseDamage, playerPos, mousePos);
      this.lastSpawnTime = currentTime;
    }
  }

  private spawnEnemy(health: number, speed: number, damage: number, playerPos?: Position, mouseDirection?: Position): void {
    // Spawn enemies outside visible frame from all directions around the player
    // Prioritize spawning behind the player (opposite of mouse direction)
    const spawnDistance = 700; // Distance outside visible area
    let x: number, y: number;

    if (playerPos) {
      // Calculate visible area bounds (camera view)
      const viewLeft = playerPos.x - this.canvasWidth / 2;
      const viewRight = playerPos.x + this.canvasWidth / 2;
      const viewTop = playerPos.y - this.canvasHeight / 2;
      const viewBottom = playerPos.y + this.canvasHeight / 2;

      // Determine spawn direction - 40% chance to spawn behind player if mouse direction is known
      let direction: number;
      if (mouseDirection && Math.random() < 0.4) {
        // Spawn behind player (opposite of where player is facing)
        // Mouse direction indicates where player is facing
        const angle = Math.atan2(mouseDirection.y - playerPos.y, mouseDirection.x - playerPos.x);
        const behindAngle = angle + Math.PI; // 180 degrees opposite
        
        // Convert angle to one of 8 directions, prioritizing the one closest to behind
        const normalizedAngle = ((behindAngle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        const directionAngle = normalizedAngle / (Math.PI * 2) * 8;
        direction = Math.floor(directionAngle) % 8;
      } else {
        // Spawn from random direction (60% chance, or if no mouse direction)
        direction = Math.floor(Math.random() * 8);
      }

      const randomOffset = Math.random() * 200;
      
      switch (direction) {
        case 0: // North (top)
          x = viewLeft + Math.random() * this.canvasWidth;
          y = viewTop - spawnDistance - randomOffset;
          break;
        case 1: // South (bottom)
          x = viewLeft + Math.random() * this.canvasWidth;
          y = viewBottom + spawnDistance + randomOffset;
          break;
        case 2: // East (right)
          x = viewRight + spawnDistance + randomOffset;
          y = viewTop + Math.random() * this.canvasHeight;
          break;
        case 3: // West (left)
          x = viewLeft - spawnDistance - randomOffset;
          y = viewTop + Math.random() * this.canvasHeight;
          break;
        case 4: // Northeast (top-right corner)
          x = viewRight + spawnDistance + randomOffset;
          y = viewTop - spawnDistance - randomOffset;
          break;
        case 5: // Northwest (top-left corner)
          x = viewLeft - spawnDistance - randomOffset;
          y = viewTop - spawnDistance - randomOffset;
          break;
        case 6: // Southeast (bottom-right corner)
          x = viewRight + spawnDistance + randomOffset;
          y = viewBottom + spawnDistance + randomOffset;
          break;
        default: // Southwest (bottom-left corner)
          x = viewLeft - spawnDistance - randomOffset;
          y = viewBottom + spawnDistance + randomOffset;
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

  updateEnemies(playerPos: Position, deltaTime: number, isWaveInProgress?: boolean, mousePos?: Position): void {
    // Spawn new enemies during the wave
    this.updateSpawning(playerPos, isWaveInProgress, mousePos);

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
    // Wave is complete only if all enemies are spawned AND all are defeated
    return this.enemies.length === 0 && this.spawnedEnemiesThisWave >= this.targetEnemyCount;
  }

  hasFinishedSpawning(): boolean {
    return this.spawnedEnemiesThisWave >= this.targetEnemyCount;
  }

  getCount(): number {
    return this.enemies.length;
  }

  getTargetCount(): number {
    return this.targetEnemyCount;
  }

  getKilledCount(): number {
    // Ensure we never return negative (safety check)
    const killed = this.spawnedEnemiesThisWave - this.enemies.length;
    return Math.max(0, killed);
  }
}
