import { Weapon, WeaponType } from '../types/game';

export const WEAPONS: Weapon[] = [
  {
    type: WeaponType.PISTOL,
    name: 'Pistol',
    description: 'Shoots single bullets with good accuracy',
    baseDamage: 15,
    cooldown: 500,
    range: 400,
  },
  {
    type: WeaponType.SHOTGUN,
    name: 'Shotgun',
    description: 'Spreads 3 projectiles in a cone',
    baseDamage: 20,
    cooldown: 800,
    range: 300,
  },
  {
    type: WeaponType.SWORD,
    name: 'Sword',
    description: 'Melee slash attack with high damage',
    baseDamage: 25,
    cooldown: 400,
    range: 60,
  },
  {
    type: WeaponType.ASSAULT_RIFLE,
    name: 'Assault Rifle',
    description: 'Fast-firing automatic weapon with good damage',
    baseDamage: 12,
    cooldown: 150,
    range: 500,
  },
  {
    type: WeaponType.RIFLE,
    name: 'Rifle',
    description: 'High-damage precision weapon with long range',
    baseDamage: 35,
    cooldown: 600,
    range: 600,
  },
];
