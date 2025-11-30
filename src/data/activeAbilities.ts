import { ActiveAbility, ActiveAbilityType } from '../types/game';

export const ACTIVE_ABILITIES: ActiveAbility[] = [
  {
    type: ActiveAbilityType.SHIELD,
    name: 'Shield',
    description: 'Absorb all damage for 45 seconds',
    duration: 45000, // 45 seconds (increased from 30)
    cooldown: 60000, // 60 seconds cooldown
    icon: 'lock-alt',
  },
  {
    type: ActiveAbilityType.FIRE_RING,
    name: 'Fire Ring',
    description: 'Burning ring damages nearby enemies for 30 seconds',
    duration: 30000, // 30 seconds (increased from 20)
    cooldown: 45000, // 45 seconds cooldown
    icon: 'fire',
  },
  {
    type: ActiveAbilityType.SPEED_BOOST,
    name: 'Speed Boost',
    description: '+100% movement speed for 25 seconds',
    duration: 25000, // 25 seconds (increased from 15)
    cooldown: 30000, // 30 seconds cooldown
    icon: 'bolt',
  },
  {
    type: ActiveAbilityType.DAMAGE_BOOST,
    name: 'Damage Boost',
    description: '5x damage for 18 seconds',
    duration: 18000, // 18 seconds (increased from 10)
    cooldown: 40000, // 40 seconds cooldown
    icon: 'star',
  },
  {
    type: ActiveAbilityType.FREEZE,
    name: 'Freeze',
    description: 'Slow all enemies by 75% for 20 seconds',
    duration: 20000, // 20 seconds (increased from 12)
    cooldown: 50000, // 50 seconds cooldown
    icon: 'circle-notch',
  },
];

export const getAbilityByType = (type: ActiveAbilityType): ActiveAbility | undefined => {
  return ACTIVE_ABILITIES.find(ability => ability.type === type);
};

