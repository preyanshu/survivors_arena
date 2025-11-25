import { Weapon, WeaponType, WeaponRarity } from '../types/game';

// Base stats for each weapon type (6 types)
const BASE_STATS: Partial<Record<WeaponType, { damage: number; cooldown: number; range?: number }>> = {
  [WeaponType.PISTOL]: { damage: 25, cooldown: 500, range: 400 },
  [WeaponType.SHOTGUN]: { damage: 30, cooldown: 800, range: 300 },
  [WeaponType.SWORD]: { damage: 40, cooldown: 400, range: 60 },
  [WeaponType.ASSAULT_RIFLE]: { damage: 22, cooldown: 150, range: 500 },
  [WeaponType.RIFLE]: { damage: 45, cooldown: 600, range: 600 },
  [WeaponType.MACHINE_GUN]: { damage: 22, cooldown: 100, range: 500 }, // Very fast full auto
};

// Rarity multipliers
const RARITY_MULTIPLIERS = {
  [WeaponRarity.COMMON]: { damage: 1.0, cooldown: 1.0 }, // 100% base stats
  [WeaponRarity.UNCOMMON]: { damage: 1.2, cooldown: 0.95 }, // +20% damage, -5% cooldown
  [WeaponRarity.RARE]: { damage: 1.5, cooldown: 0.9 }, // +50% damage, -10% cooldown
  [WeaponRarity.EPIC]: { damage: 1.8, cooldown: 0.85 }, // +80% damage, -15% cooldown
  [WeaponRarity.LEGENDARY]: { damage: 2.2, cooldown: 0.75 }, // +120% damage, -25% cooldown
};

// Rarity drop weights (higher = more common)
// Common is easiest, Legendary is hardest
export const RARITY_WEIGHTS = {
  [WeaponRarity.COMMON]: 50,      // 50% chance
  [WeaponRarity.UNCOMMON]: 30,    // 30% chance
  [WeaponRarity.RARE]: 12,        // 12% chance
  [WeaponRarity.EPIC]: 6,         // 6% chance
  [WeaponRarity.LEGENDARY]: 2,    // 2% chance
};

// Weapon type drop weights (higher = more common)
// Sword is easiest, Rifle is hardest
export const WEAPON_TYPE_WEIGHTS = {
  [WeaponType.SWORD]: 40,           // 40% chance
  [WeaponType.PISTOL]: 30,          // 30% chance
  [WeaponType.SHOTGUN]: 15,         // 15% chance
  [WeaponType.ASSAULT_RIFLE]: 10,   // 10% chance
  [WeaponType.RIFLE]: 5,            // 5% chance
  [WeaponType.MACHINE_GUN]: 0,      // 0% chance (testing only, hardcoded)
};

// Rarity names
const RARITY_NAMES = {
  [WeaponRarity.COMMON]: 'Common',
  [WeaponRarity.UNCOMMON]: 'Uncommon',
  [WeaponRarity.RARE]: 'Rare',
  [WeaponRarity.EPIC]: 'Epic',
  [WeaponRarity.LEGENDARY]: 'Legendary',
};

// Weapon type names
const WEAPON_TYPE_NAMES: Partial<Record<WeaponType, string>> = {
  [WeaponType.PISTOL]: 'Pistol',
  [WeaponType.SHOTGUN]: 'Shotgun',
  [WeaponType.SWORD]: 'Sword',
  [WeaponType.ASSAULT_RIFLE]: 'Assault Rifle',
  [WeaponType.RIFLE]: 'Rifle',
  [WeaponType.MACHINE_GUN]: 'Machine Gun',
};

// Descriptions for each weapon type
const WEAPON_DESCRIPTIONS: Partial<Record<WeaponType, string>> = {
  [WeaponType.PISTOL]: 'Shoots single bullets with good accuracy',
  [WeaponType.SHOTGUN]: 'Spreads 3 projectiles in a cone',
  [WeaponType.SWORD]: 'Melee slash attack with high damage',
  [WeaponType.ASSAULT_RIFLE]: 'Fast-firing automatic weapon with good damage',
  [WeaponType.RIFLE]: 'High-damage precision weapon with long range',
  [WeaponType.MACHINE_GUN]: 'Full auto machine gun with extremely high fire rate',
};

// Generate all weapons (5 types × 5 rarities = 25 weapons)
export const WEAPONS: Weapon[] = [];

// Only generate for the 6 weapon types that have base stats
const WEAPON_TYPES_TO_GENERATE = [
  WeaponType.PISTOL,
  WeaponType.SHOTGUN,
  WeaponType.SWORD,
  WeaponType.ASSAULT_RIFLE,
  WeaponType.RIFLE,
  WeaponType.MACHINE_GUN,
];

WEAPON_TYPES_TO_GENERATE.forEach((weaponType) => {
  // Machine gun only generates as Legendary
  const raritiesToGenerate = weaponType === WeaponType.MACHINE_GUN 
    ? [WeaponRarity.LEGENDARY]
    : Object.values(WeaponRarity);
  
  raritiesToGenerate.forEach((rarity) => {
    const baseStats = BASE_STATS[weaponType];
    const weaponName = WEAPON_TYPE_NAMES[weaponType];
    const weaponDescription = WEAPON_DESCRIPTIONS[weaponType];
    
    if (!baseStats || !weaponName || !weaponDescription) return;
    
    const multipliers = RARITY_MULTIPLIERS[rarity];
    
    WEAPONS.push({
      type: weaponType,
      rarity: rarity,
      name: `${RARITY_NAMES[rarity]} ${weaponName}`,
      description: weaponDescription,
      baseDamage: Math.round(baseStats.damage * multipliers.damage),
      cooldown: Math.round(baseStats.cooldown * multipliers.cooldown),
      range: baseStats.range,
    });
  });
});

// Helper function to get rarity color (dark theme, muted colors)
export const getRarityColor = (rarity: WeaponRarity): string => {
  switch (rarity) {
    case WeaponRarity.COMMON:
      return '#4a2c1a'; // Dark muted brown
    case WeaponRarity.UNCOMMON:
      return '#1a4a1a'; // Dark muted green
    case WeaponRarity.RARE:
      return '#1a2a4a'; // Dark muted blue
    case WeaponRarity.EPIC:
      return '#3a1a4a'; // Dark muted purple
    case WeaponRarity.LEGENDARY:
      return '#4a3a1a'; // Dark muted gold/amber
    default:
      return '#3a0000';
  }
};

// Helper function to get rarity border color (dark theme, muted colors)
export const getRarityBorderColor = (rarity: WeaponRarity): string => {
  switch (rarity) {
    case WeaponRarity.COMMON:
      return '#5a3a2a'; // Slightly lighter dark brown
    case WeaponRarity.UNCOMMON:
      return '#2a5a2a'; // Slightly lighter dark green
    case WeaponRarity.RARE:
      return '#2a3a5a'; // Slightly lighter dark blue
    case WeaponRarity.EPIC:
      return '#4a2a5a'; // Slightly lighter dark purple
    case WeaponRarity.LEGENDARY:
      return '#5a4a2a'; // Slightly lighter dark gold/amber
    default:
      return '#5a0000';
  }
};

// Get default player inventory (Common Sword and Common Pistol only)
export const getDefaultPlayerInventory = (): Weapon[] => {
  return WEAPONS.filter(
    (weapon) =>
      (weapon.type === WeaponType.SWORD && weapon.rarity === WeaponRarity.COMMON) ||
      (weapon.type === WeaponType.PISTOL && weapon.rarity === WeaponRarity.COMMON)
  );
};

// Calculate firerate (shots per second) from cooldown (milliseconds)
// Lower cooldown = higher firerate (better)
export const calculateFirerate = (cooldown: number): number => {
  if (cooldown <= 0) return 0;
  return 1000 / cooldown; // Convert milliseconds to shots per second
};

// Generate a weapon with randomized stats within the range for its type and rarity
// Stats vary by ±10% to ±15% from base stats
export const generateRandomWeaponStats = (weaponType: WeaponType, rarity: WeaponRarity): Weapon => {
  const baseStats = BASE_STATS[weaponType];
  const weaponName = WEAPON_TYPE_NAMES[weaponType];
  const weaponDescription = WEAPON_DESCRIPTIONS[weaponType];
  
  if (!baseStats || !weaponName || !weaponDescription) {
    // Fallback to a default weapon if something goes wrong
    return WEAPONS.find(w => w.type === weaponType && w.rarity === rarity) || WEAPONS[0];
  }
  
  const multipliers = RARITY_MULTIPLIERS[rarity];
  
  // Calculate base stats for this rarity
  const baseDamage = baseStats.damage * multipliers.damage;
  const baseCooldown = baseStats.cooldown * multipliers.cooldown;
  
  // Random variation: ±10% to ±15% (randomized per stat)
  const damageVariation = 0.10 + (Math.random() * 0.05); // 10% to 15%
  const cooldownVariation = 0.10 + (Math.random() * 0.05); // 10% to 15%
  
  // Randomize up or down
  const damageMultiplier = 1 + (Math.random() < 0.5 ? -1 : 1) * damageVariation;
  const cooldownMultiplier = 1 + (Math.random() < 0.5 ? -1 : 1) * cooldownVariation;
  
  // Calculate randomized stats with up to 5 decimal places
  const randomizedDamage = Math.round((baseDamage * damageMultiplier) * 100000) / 100000;
  const randomizedCooldown = Math.round((baseCooldown * cooldownMultiplier) * 100000) / 100000;
  
  return {
    type: weaponType,
    rarity: rarity,
    name: `${RARITY_NAMES[rarity]} ${weaponName}`,
    description: weaponDescription,
    baseDamage: randomizedDamage,
    cooldown: randomizedCooldown,
    range: baseStats.range,
  };
};
