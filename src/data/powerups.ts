import { PowerUp, PlayerStats, ActiveAbilityType } from '../types/game';

export const POWER_UPS: PowerUp[] = [
  {
    id: 'speed',
    name: '+30% Movement Speed',
    description: 'Move faster across the battlefield',
    effect: (stats: PlayerStats) => ({
      ...stats,
      movementSpeed: stats.movementSpeed * 1.3,
    }),
  },
  {
    id: 'attack_speed',
    name: '+25% Attack Speed',
    description: 'Attack more frequently',
    effect: (stats: PlayerStats) => ({
      ...stats,
      attackSpeed: stats.attackSpeed * 1.25,
    }),
  },
  {
    id: 'damage',
    name: '+30% Damage',
    description: 'Deal more damage with each hit',
    effect: (stats: PlayerStats) => ({
      ...stats,
      damage: stats.damage * 1.3,
    }),
  },
  {
    id: 'max_health',
    name: '+30 Max HP',
    description: 'Increase maximum health',
    effect: (stats: PlayerStats) => ({
      ...stats,
      maxHealth: stats.maxHealth + 30,
      health: stats.health + 30,
    }),
  },
  {
    id: 'projectile_size',
    name: '+25% Projectile Size',
    description: 'Bigger projectiles hit more easily',
    effect: (stats: PlayerStats) => ({
      ...stats,
      projectileSize: stats.projectileSize * 1.25,
    }),
  },
  {
    id: 'knockback',
    name: '+30% Knockback',
    description: 'Push enemies back further',
    effect: (stats: PlayerStats) => ({
      ...stats,
      knockback: stats.knockback * 1.3,
    }),
  },
  {
    id: 'cooldown',
    name: '-30% Cooldown',
    description: 'Reduce ability cooldowns',
    effect: (stats: PlayerStats) => ({
      ...stats,
      cooldownReduction: stats.cooldownReduction + 0.3,
    }),
  },
  {
    id: 'health_regen',
    name: '+30 HP',
    description: 'Restore health immediately',
    effect: (stats: PlayerStats) => ({
      ...stats,
      health: Math.min(stats.health + 30, stats.maxHealth),
    }),
  },
  // Ability power-ups
  {
    id: 'ability_shield',
    name: 'Shield Ability',
    description: 'Unlock Shield - Block all damage for 30s',
    effect: (stats: PlayerStats) => stats, // No stat change, handled separately
    abilityType: ActiveAbilityType.SHIELD,
  },
  {
    id: 'ability_fire_ring',
    name: 'Fire Ring Ability',
    description: 'Unlock Fire Ring - Burn nearby enemies for 20s',
    effect: (stats: PlayerStats) => stats,
    abilityType: ActiveAbilityType.FIRE_RING,
  },
  {
    id: 'ability_speed_boost',
    name: 'Speed Boost Ability',
    description: 'Unlock Speed Boost - Double movement for 15s',
    effect: (stats: PlayerStats) => stats,
    abilityType: ActiveAbilityType.SPEED_BOOST,
  },
  {
    id: 'ability_damage_boost',
    name: 'Damage Boost Ability',
    description: 'Unlock Damage Boost - Triple damage for 10s',
    effect: (stats: PlayerStats) => stats,
    abilityType: ActiveAbilityType.DAMAGE_BOOST,
  },
  {
    id: 'ability_freeze',
    name: 'Freeze Ability',
    description: 'Unlock Freeze - Slow all enemies by 50% for 12s',
    effect: (stats: PlayerStats) => stats,
    abilityType: ActiveAbilityType.FREEZE,
  },
];
