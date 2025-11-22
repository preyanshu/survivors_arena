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
}

export interface Projectile {
  id: string;
  position: Position;
  velocity: Position;
  damage: number;
  size: number;
  piercing?: boolean;
  isInstant?: boolean; // For instant melee attacks that disappear after one frame
}

export enum WeaponType {
  PISTOL = 'pistol',
  SHOTGUN = 'shotgun',
  SWORD = 'sword',
  KNIFE = 'knife',
  ASSAULT_RIFLE = 'assault_rifle',
  RIFLE = 'rifle',
}

export interface Weapon {
  type: WeaponType;
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
  gifCanvas?: HTMLCanvasElement; // Canvas for animated GIF
}
