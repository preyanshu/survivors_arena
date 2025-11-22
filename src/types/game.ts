export interface Position {
  x: number;
  y: number;
}

export interface PlayerStats {
  maxHealth: number;
  health: number;
  movementSpeed: number;
  damage: number;
  attackSpeed: number;
  projectileSize: number;
  knockback: number;
  cooldownReduction: number;
}

export enum EnemyType {
  WEAK = 'weak',
  NORMAL = 'normal',
  STRONG = 'strong',
}

export interface Enemy {
  id: string;
  position: Position;
  health: number;
  maxHealth: number;
  speed: number;
  damage: number;
  size: number;
  type: EnemyType;
  lastAttackTime?: number; // For ranged attacks
  shielded?: boolean; // If true, this enemy is protected by a nearby STRONG enemy
  isSplitEnemy?: boolean; // If true, this enemy was spawned from a split and should use STRONG sprite
  level?: number; // Enemy level (based on wave)
  chargeStartTime?: number; // When charging started (for STRONG enemy charged shots)
  chargeTargetPos?: Position; // Target position when charge started (locked, doesn't update)
  isBerserker?: boolean; // If true, enemy is in berserker mode (STRONG enemies < 35% health)
  baseSize?: number; // Original size before berserker mode
}

export interface Projectile {
  id: string;
  position: Position;
  velocity: Position;
  damage: number;
  size: number;
  piercing?: boolean;
  isInstant?: boolean; // For instant melee attacks that disappear after one frame
  isHoming?: boolean; // If true, this projectile follows the player
  indestructible?: boolean; // If true, cannot be destroyed by player weapons (STRONG enemy charged shots)
}

export enum WeaponType {
  PISTOL = 'pistol',
  SHOTGUN = 'shotgun',
  SWORD = 'sword',
  KNIFE = 'knife',
  ASSAULT_RIFLE = 'assault_rifle',
  RIFLE = 'rifle',
}

export enum WeaponRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export interface Weapon {
  type: WeaponType;
  rarity: WeaponRarity;
  name: string;
  description: string;
  baseDamage: number;
  cooldown: number;
  range?: number;
}

export interface PowerUp {
  id: string;
  name: string;
  description: string;
  effect: (stats: PlayerStats) => PlayerStats;
  abilityType?: ActiveAbilityType; // If set, this power-up grants an ability instead of modifying stats
}

export interface BloodParticle {
  id: string;
  position: Position;
  velocity: Position;
  size: number;
  life: number;
  maxLife: number;
}

export interface SlashAnimation {
  id: string;
  position: Position;
  angle: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface HealthPickup {
  id: string;
  position: Position;
  healAmount: number;
  size: number;
  life: number; // For animation/pulsing effect
}

export enum ActiveAbilityType {
  SHIELD = 'shield',
  FIRE_RING = 'fire_ring',
  SPEED_BOOST = 'speed_boost',
  DAMAGE_BOOST = 'damage_boost',
  FREEZE = 'freeze',
}

export interface ActiveAbility {
  type: ActiveAbilityType;
  name: string;
  description: string;
  duration: number; // Duration in milliseconds
  cooldown: number; // Cooldown in milliseconds
  icon: string;
}

export interface ActiveAbilityState {
  type: ActiveAbilityType;
  endTime: number; // When the ability ends
  cooldownEndTime: number; // When cooldown ends
}
