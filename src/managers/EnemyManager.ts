import { Enemy, Position, EnemyType, Projectile } from '../types/game';
import { generateId, normalize, distance, randomInRange } from '../utils/gameUtils';

export class EnemyManager {
  private enemies: Enemy[] = [];
  private enemyProjectiles: Projectile[] = [];
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
    this.waveBaseSpeed = 3.2 + wave * 0.3; // Reduced enemy speed for easier gameplay
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
          speed: baseSpeed * 1.0, // Same as base speed (reduced from 1.1)
          damage: Math.floor(baseDamage * 0.7), // 70% of base damage
          size: 80, // Increased for bigger enemies
        };
      case EnemyType.NORMAL:
        return {
          health: baseHealth, // Base stats
          speed: baseSpeed,
          damage: baseDamage,
          size: 100, // Increased for bigger enemies
        };
      case EnemyType.STRONG:
        return {
          health: Math.floor(baseHealth * 1.8), // 180% of base health
          speed: baseSpeed * 0.85, // Slightly slower
          damage: Math.floor(baseDamage * 1.5), // 150% of base damage
          size: 140, // Increased for bigger enemies
        };
      default:
        return {
          health: baseHealth,
          speed: baseSpeed,
          damage: baseDamage,
          size: 100,
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
      lastAttackTime: 0, // Initialize attack timer
    });
  }

  updateEnemies(playerPos: Position, deltaTime: number, isWaveInProgress?: boolean, mousePos?: Position, freezeActive: boolean = false): void {
    // Spawn new enemies during the wave
    this.updateSpawning(playerPos, isWaveInProgress, mousePos);

    const currentTime = Date.now();
    const attackRange = 600; // Normal enemies attack when within this range
    const attackCooldown = 1500; // Attack every 1.5 seconds

    // Apply freeze effect - slow enemies by 50%
    const speedMultiplier = freezeActive ? 0.5 : 1.0;

    this.enemies.forEach((enemy) => {
      const direction = normalize({
        x: playerPos.x - enemy.position.x,
        y: playerPos.y - enemy.position.y,
      });

      const moveSpeed = enemy.speed * speedMultiplier * (deltaTime / 16);
      enemy.position.x += direction.x * moveSpeed;
      enemy.position.y += direction.y * moveSpeed;

      // Normal enemies shoot projectiles at the player
      if (enemy.type === EnemyType.NORMAL) {
        const distToPlayer = distance(enemy.position, playerPos);
        
        // Attack if within range and cooldown is ready
        if (distToPlayer <= attackRange && 
            (!enemy.lastAttackTime || currentTime - enemy.lastAttackTime >= attackCooldown)) {
          this.shootAtPlayer(enemy, playerPos, this.currentWave);
          enemy.lastAttackTime = currentTime;
        }
      }
    });

    // Update enemy projectiles
    this.updateEnemyProjectiles(deltaTime, playerPos);
  }

  private shootAtPlayer(enemy: Enemy, playerPos: Position, wave: number): void {
    // Reduce projectile count for early waves
    // Wave 1: 1 projectile, Wave 2-3: 1-2 projectiles, Wave 4+: 2-3 projectiles
    let projectileCount: number;
    if (wave <= 1) {
      projectileCount = 1; // Only 1 projectile in wave 1
    } else if (wave <= 3) {
      projectileCount = 1 + Math.floor(Math.random() * 2); // 1 or 2 projectiles
    } else {
      projectileCount = 2 + Math.floor(Math.random() * 2); // 2 or 3 projectiles
    }
    
    const spreadAngle = Math.PI / 6; // 30 degree spread
    
    const baseAngle = Math.atan2(
      playerPos.y - enemy.position.y,
      playerPos.x - enemy.position.x
    );

    for (let i = 0; i < projectileCount; i++) {
      // For single projectile, no spread
      const angleOffset = projectileCount > 1 
        ? (i - (projectileCount - 1) / 2) * spreadAngle / (projectileCount - 1)
        : 0;
      const angle = baseAngle + angleOffset;
      const speed = 6; // Projectile speed
      
      this.enemyProjectiles.push({
        id: generateId(),
        position: { ...enemy.position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        damage: enemy.damage * 0.6, // Projectiles do 60% of melee damage
        size: 20,
      });
    }
  }

  private updateEnemyProjectiles(deltaTime: number, playerPos: Position): void {
    // Move projectiles
    this.enemyProjectiles.forEach((proj) => {
      proj.position.x += proj.velocity.x * (deltaTime / 16);
      proj.position.y += proj.velocity.y * (deltaTime / 16);
    });

    // Remove projectiles that are too far from player
    const maxDistance = 800;
    this.enemyProjectiles = this.enemyProjectiles.filter((proj) => {
      const dist = distance(proj.position, playerPos);
      return dist < maxDistance;
    });
  }

  getEnemyProjectiles(): Projectile[] {
    return this.enemyProjectiles;
  }

  removeEnemyProjectile(projectileId: string): void {
    this.enemyProjectiles = this.enemyProjectiles.filter((p) => p.id !== projectileId);
  }

  damageEnemy(enemyId: string, damage: number, knockback: number, playerPos: Position): { killed: boolean; position?: Position } {
    const enemy = this.enemies.find((e) => e.id === enemyId);
    if (!enemy) return { killed: false };

    enemy.health -= damage;

    const direction = normalize({
      x: enemy.position.x - playerPos.x,
      y: enemy.position.y - playerPos.y,
    });

    enemy.position.x += direction.x * knockback;
    enemy.position.y += direction.y * knockback;

    if (enemy.health <= 0) {
      const deathPosition = { ...enemy.position };
      this.enemies = this.enemies.filter((e) => e.id !== enemyId);
      return { killed: true, position: deathPosition };
    }

    return { killed: false };
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
    this.enemyProjectiles = [];
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
