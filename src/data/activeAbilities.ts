import { ActiveAbility, ActiveAbilityType } from '../types/game';

export const ACTIVE_ABILITIES: ActiveAbility[] = [
  {
    type: ActiveAbilityType.SHIELD,
    name: 'Shield',
    description: 'Absorb all damage for 30 seconds',
    duration: 30000, // 30 seconds
    cooldown: 60000, // 60 seconds cooldown
    icon: '🛡️',
  },
  {
    type: ActiveAbilityType.FIRE_RING,
    name: 'Fire Ring',
    description: 'Burning ring damages nearby enemies for 20 seconds',
    duration: 20000, // 20 seconds
    cooldown: 45000, // 45 seconds cooldown
    icon: '🔥',
  },
  {
    type: ActiveAbilityType.SPEED_BOOST,
    name: 'Speed Boost',
    description: 'Double movement speed for 15 seconds',
    duration: 15000, // 15 seconds
    cooldown: 30000, // 30 seconds cooldown
    icon: '⚡',
  },
  {
    type: ActiveAbilityType.DAMAGE_BOOST,
    name: 'Damage Boost',
    description: 'Triple damage for 10 seconds',
    duration: 10000, // 10 seconds
    cooldown: 40000, // 40 seconds cooldown
    icon: '💥',
  },
  {
    type: ActiveAbilityType.FREEZE,
    name: 'Freeze',
    description: 'Slow all enemies by 50% for 12 seconds',
    duration: 12000, // 12 seconds
    cooldown: 50000, // 50 seconds cooldown
    icon: '❄️',
  },
];

export const getAbilityByType = (type: ActiveAbilityType): ActiveAbility | undefined => {
  return ACTIVE_ABILITIES.find(ability => ability.type === type);
};

