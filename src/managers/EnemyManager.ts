import { Enemy, Position, EnemyType } from '../types/game';
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

  private getEnemyType(wave: number): EnemyType {
    // Distribute enemy types based on wave
    // Early waves: more weak enemies
    // Later waves: more strong enemies
    const rand = Math.random();
    
    if (wave <= 3) {
      // Waves 1-3: 50% weak, 40% normal, 10% strong
      if (rand < 0.5) return EnemyType.WEAK;
      if (rand < 0.9) return EnemyType.NORMAL;
      return EnemyType.STRONG;
    } else if (wave <= 6) {
      // Waves 4-6: 30% weak, 50% normal, 20% strong
      if (rand < 0.3) return EnemyType.WEAK;
      if (rand < 0.8) return EnemyType.NORMAL;
      return EnemyType.STRONG;
    } else {
      // Waves 7+: 20% weak, 40% normal, 40% strong
      if (rand < 0.2) return EnemyType.WEAK;
      if (rand < 0.6) return EnemyType.NORMAL;
      return EnemyType.STRONG;
    }
  }

  private getEnemyStats(type: EnemyType, baseHealth: number, baseSpeed: number, baseDamage: number) {
    switch (type) {
      case EnemyType.WEAK:
        return {
          health: Math.floor(baseHealth * 0.6), // 60% of base health
          speed: baseSpeed * 1.1, // Slightly faster
          damage: Math.floor(baseDamage * 0.7), // 70% of base damage
          size: 40, // Increased from 20 to 40
        };
      case EnemyType.NORMAL:
        return {
          health: baseHealth, // Base stats
          speed: baseSpeed,
          damage: baseDamage,
          size: 50, // Increased from 25 to 50
        };
      case EnemyType.STRONG:
        return {
          health: Math.floor(baseHealth * 1.8), // 180% of base health
          speed: baseSpeed * 0.85, // Slightly slower
          damage: Math.floor(baseDamage * 1.5), // 150% of base damage
          size: 70, // Increased from 35 to 70
        };
      default:
        return {
          health: baseHealth,
          speed: baseSpeed,
          damage: baseDamage,
          size: 25,
        };
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

  private spawnEnemy(baseHealth: number, baseSpeed: number, baseDamage: number, playerPos?: Position, mouseDirection?: Position): void {
    // Determine enemy type and stats first
    const enemyType = this.getEnemyType(this.currentWave);
    const stats = this.getEnemyStats(enemyType, baseHealth, baseSpeed, baseDamage);

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

    this.enemies.push({
      id: generateId(),
      position: { x, y },
      health: stats.health,
      maxHealth: stats.health,
      speed: stats.speed,
      damage: stats.damage,
      size: stats.size,
      type: enemyType,
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
