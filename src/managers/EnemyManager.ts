import { Enemy, Position } from '../types/game';
import { generateId, normalize, distance, randomInRange } from '../utils/gameUtils';

export class EnemyManager {
  private enemies: Enemy[] = [];
  private canvasWidth: number;
  private canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  spawnWave(wave: number, playerPos?: Position): void {
    // Much harder difficulty: more enemies, stronger stats
    const enemyCount = Math.min(12 + wave * 6, 80);
    const baseHealth = 40 + wave * 10;
    const baseSpeed = 2.0 + wave * 0.25; // Much faster enemies
    const baseDamage = 15 + wave * 5; // Much more damage

    for (let i = 0; i < enemyCount; i++) {
      this.spawnEnemy(baseHealth, baseSpeed, baseDamage, playerPos);
    }
  }

  private spawnEnemy(health: number, speed: number, damage: number, playerPos?: Position): void {
    // Spawn enemies closer to player for more pressure
    const spawnDistance = 500; // Closer spawn distance
    let x: number, y: number;

    if (playerPos) {
      // Spawn in a circle around the player
      const angle = Math.random() * Math.PI * 2;
      const distance = spawnDistance + Math.random() * 200;
      x = playerPos.x + Math.cos(angle) * distance;
      y = playerPos.y + Math.sin(angle) * distance;
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

  updateEnemies(playerPos: Position, deltaTime: number): void {
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
  }

  isEmpty(): boolean {
    return this.enemies.length === 0;
  }

  getCount(): number {
    return this.enemies.length;
  }
}
