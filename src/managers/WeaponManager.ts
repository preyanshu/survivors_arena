import { Weapon, WeaponType, Projectile, Position, PlayerStats } from '../types/game';
import { generateId, normalize } from '../utils/gameUtils';
import { GAME_BALANCE } from '../data/gameBalance';

export class WeaponManager {
  private weapon: Weapon;
  private lastAttackTime: number = 0;

  constructor(weapon: Weapon) {
    this.weapon = weapon;
  }

  canAttack(currentTime: number, cooldownReduction: number): boolean {
    const baseCooldown = this.weapon.cooldown * GAME_BALANCE.weapons.cooldownMultiplier;
    const adjustedCooldown = baseCooldown * (1 - cooldownReduction);
    return currentTime - this.lastAttackTime >= adjustedCooldown;
  }

  attack(
    playerPos: Position,
    targetPos: Position,
    playerStats: PlayerStats,
    currentTime: number
  ): Projectile[] {
    if (!this.canAttack(currentTime, playerStats.cooldownReduction)) {
      return [];
    }

    this.lastAttackTime = currentTime;

    const direction = normalize({
      x: targetPos.x - playerPos.x,
      y: targetPos.y - playerPos.y,
    });

    const damage = this.weapon.baseDamage * playerStats.damage;

    switch (this.weapon.type) {
      case WeaponType.PISTOL:
        return this.createPistolProjectile(playerPos, direction, damage, playerStats);

      case WeaponType.SHOTGUN:
        return this.createShotgunProjectiles(playerPos, direction, damage, playerStats);

      case WeaponType.SWORD:
        return this.createSwordSlash(playerPos, direction, damage, playerStats);

      case WeaponType.ASSAULT_RIFLE:
        return this.createAssaultRifleProjectile(playerPos, direction, damage, playerStats);

      case WeaponType.RIFLE:
        return this.createRifleProjectile(playerPos, direction, damage, playerStats);

      case WeaponType.MACHINE_GUN:
        return this.createMachineGunProjectile(playerPos, direction, damage, playerStats);

      default:
        return [];
    }
  }

  private createPistolProjectile(
    position: Position,
    direction: Position,
    damage: number,
    playerStats: PlayerStats
  ): Projectile[] {
    const speed = GAME_BALANCE.weapons.pistol.projectileSpeed;
    return [
      {
        id: generateId(),
        position: { ...position },
        velocity: { x: direction.x * speed, y: direction.y * speed },
        damage,
        size: 20 * playerStats.projectileSize, // Increased for better visibility
      },
    ];
  }

  private createShotgunProjectiles(
    position: Position,
    direction: Position,
    damage: number,
    playerStats: PlayerStats
  ): Projectile[] {
    const speed = GAME_BALANCE.weapons.shotgun.projectileSpeed;
    const spreadAngle = Math.PI / 24; // Reduced spread (was Math.PI / 8)
    const projectiles: Projectile[] = [];

    for (let i = -1; i <= 1; i++) {
      const angle = Math.atan2(direction.y, direction.x) + spreadAngle * i;
      const dir = { x: Math.cos(angle), y: Math.sin(angle) };

      projectiles.push({
        id: generateId(),
        position: { ...position },
        velocity: { x: dir.x * speed, y: dir.y * speed },
        damage: damage * 0.7,
        size: 18 * playerStats.projectileSize, // Increased for better visibility
      });
    }

    return projectiles;
  }

  private createSwordSlash(
    position: Position,
    direction: Position,
    damage: number,
    playerStats: PlayerStats
  ): Projectile[] {
    // Melee slash attack - positioned in front of player, instant hit, disappears after one frame
    const slashDistance = GAME_BALANCE.weapons.sword.slashDistance;
    return [
      {
        id: generateId(),
        position: { 
          x: position.x + direction.x * slashDistance, 
          y: position.y + direction.y * slashDistance 
        },
        velocity: { x: 0, y: 0 }, // Zero velocity - doesn't move (instant slash)
        damage,
        size: 80 * playerStats.projectileSize, // Large hitbox for slash arc
        piercing: true, // Can hit multiple enemies
        isInstant: true, // Disappears immediately after collision check
      },
    ];
  }

  private createAssaultRifleProjectile(
    position: Position,
    direction: Position,
    damage: number,
    playerStats: PlayerStats
  ): Projectile[] {
    // Fast-firing automatic weapon with slight spread
    const speed = GAME_BALANCE.weapons.assaultRifle.projectileSpeed;
    const spreadAngle = (Math.random() - 0.5) * 0.1; // Small random spread
    const angle = Math.atan2(direction.y, direction.x) + spreadAngle;
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    
    return [
      {
        id: generateId(),
        position: { ...position },
        velocity: { x: dir.x * speed, y: dir.y * speed },
        damage,
        size: 20 * playerStats.projectileSize, // Increased for better visibility
      },
    ];
  }

  private createRifleProjectile(
    position: Position,
    direction: Position,
    damage: number,
    playerStats: PlayerStats
  ): Projectile[] {
    // High-damage precision weapon with long range and piercing
    const speed = GAME_BALANCE.weapons.rifle.projectileSpeed;
    return [
      {
        id: generateId(),
        position: { ...position },
        velocity: { x: direction.x * speed, y: direction.y * speed },
        damage,
        size: 24 * playerStats.projectileSize, // Increased for better visibility
        piercing: true, // Rifle bullets pierce through enemies
      },
    ];
  }

  private createMachineGunProjectile(
    position: Position,
    direction: Position,
    damage: number,
    playerStats: PlayerStats
  ): Projectile[] {
    // Full auto machine gun with very high fire rate
    const speed = GAME_BALANCE.weapons.machine_gun.projectileSpeed;
    const spreadAngle = (Math.random() - 0.5) * 0.15; // Slightly more spread than assault rifle
    const angle = Math.atan2(direction.y, direction.x) + spreadAngle;
    const dir = { x: Math.cos(angle), y: Math.sin(angle) };
    
    return [
      {
        id: generateId(),
        position: { ...position },
        velocity: { x: dir.x * speed, y: dir.y * speed },
        damage,
        size: 20 * playerStats.projectileSize,
      },
    ];
  }
}
