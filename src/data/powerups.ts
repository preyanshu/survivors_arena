import { PowerUp, PlayerStats, ActiveAbilityType } from '../types/game';

export const POWER_UPS: PowerUp[] = [
  {
    id: 'attack_speed',
    name: 'CYBER ACCELERATOR',
    description: 'Weapon systems fire 25% faster',
    effect: (stats: PlayerStats) => ({
      ...stats,
      cooldownReduction: stats.cooldownReduction + 0.25, // Reduces weapon cooldown by 25%
    }),
  },
  {
    id: 'damage',
    name: 'POWER MODULE',
    description: 'Increase damage output by 30%',
    effect: (stats: PlayerStats) => ({
      ...stats,
      damage: stats.damage * 1.3,
    }),
  },
  {
    id: 'max_health',
    name: 'ARMOR PLATING',
    description: 'Install additional armor - +30 structural integrity',
    effect: (stats: PlayerStats) => ({
      ...stats,
      maxHealth: stats.maxHealth + 30,
      health: stats.health + 30,
    }),
  },
  {
    id: 'knockback',
    name: 'FORCE AMPLIFIER',
    description: 'Increase repulsor field strength by 30%',
    effect: (stats: PlayerStats) => ({
      ...stats,
      knockback: stats.knockback * 1.3,
    }),
  },
  {
    id: 'cooldown',
    name: 'COOLING SYSTEM',
    description: 'Reduce system cooldowns by 30%',
    effect: (stats: PlayerStats) => ({
      ...stats,
      abilityCooldownReduction: stats.abilityCooldownReduction + 0.3, // Reduces ability cooldown by 30%
    }),
  },
  // Ability power-ups
  {
    id: 'ability_shield',
    name: 'NANOMACHINE BARRIER PROTOCOL',
    description: 'Unlock NANOMACHINE BARRIER - Nullify all damage for 45s',
    effect: (stats: PlayerStats) => stats, // No stat change, handled separately
    abilityType: ActiveAbilityType.SHIELD,
  },
  {
    id: 'ability_fire_ring',
    name: 'PLASMA FIELD PROTOCOL',
    description: 'Unlock PLASMA FIELD - Incinerate nearby hostiles for 30s',
    effect: (stats: PlayerStats) => stats,
    abilityType: ActiveAbilityType.FIRE_RING,
  },
  {
    id: 'ability_speed_boost',
    name: 'OVERDRIVE PROTOCOL',
    description: 'Unlock OVERDRIVE - +100% mobility for 25s',
    effect: (stats: PlayerStats) => stats,
    abilityType: ActiveAbilityType.SPEED_BOOST,
  },
  {
    id: 'ability_damage_boost',
    name: 'NANOMACHINE ENHANCEMENT PROTOCOL',
    description: 'Unlock ENHANCEMENT - 5x damage output for 18s',
    effect: (stats: PlayerStats) => stats,
    abilityType: ActiveAbilityType.DAMAGE_BOOST,
  },
  {
    id: 'ability_freeze',
    name: 'STASIS FIELD PROTOCOL',
    description: 'Unlock STASIS FIELD - Reduce enemy mobility by 75% for 20s',
    effect: (stats: PlayerStats) => stats,
    abilityType: ActiveAbilityType.FREEZE,
  },
];
