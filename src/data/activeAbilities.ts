import { ActiveAbility, ActiveAbilityType } from '../types/game';

export const ACTIVE_ABILITIES: ActiveAbility[] = [
  {
    type: ActiveAbilityType.SHIELD,
    name: 'NANOMACHINE BARRIER',
    description: 'Deploy energy shield - nullify all incoming damage for 45 seconds',
    duration: 45000, // 45 seconds (increased from 30)
    cooldown: 60000, // 60 seconds cooldown
    icon: 'lock-alt',
  },
  {
    type: ActiveAbilityType.FIRE_RING,
    name: 'PLASMA FIELD',
    description: 'Activate thermal discharge - incinerate nearby hostiles for 30 seconds',
    duration: 30000, // 30 seconds (increased from 20)
    cooldown: 45000, // 45 seconds cooldown
    icon: 'fire',
  },
  {
    type: ActiveAbilityType.SPEED_BOOST,
    name: 'OVERDRIVE PROTOCOL',
    description: 'Engage cybernetic enhancement - +100% mobility for 25 seconds',
    duration: 25000, // 25 seconds (increased from 15)
    cooldown: 30000, // 30 seconds cooldown
    icon: 'bolt',
  },
  {
    type: ActiveAbilityType.DAMAGE_BOOST,
    name: 'NANOMACHINE ENHANCEMENT',
    description: 'Activate combat mode - 5x damage output for 18 seconds',
    duration: 18000, // 18 seconds (increased from 10)
    cooldown: 40000, // 40 seconds cooldown
    icon: 'star',
  },
  {
    type: ActiveAbilityType.FREEZE,
    name: 'STASIS FIELD',
    description: 'Deploy temporal lock - reduce enemy mobility by 75% for 20 seconds',
    duration: 20000, // 20 seconds (increased from 12)
    cooldown: 50000, // 50 seconds cooldown
    icon: 'circle-notch',
  },
];

export const getAbilityByType = (type: ActiveAbilityType): ActiveAbility | undefined => {
  return ACTIVE_ABILITIES.find(ability => ability.type === type);
};

