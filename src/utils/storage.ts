import { Weapon, WeaponType, WeaponRarity } from '../types/game';
import { WEAPONS, getDefaultPlayerInventory, generateRandomWeaponStats, RARITY_WEIGHTS, WEAPON_TYPE_WEIGHTS } from '../data/weapons';

const INVENTORY_KEY = 'player_inventory';
const LAST_CRATE_OPEN_KEY = 'last_crate_open';

// Save player inventory to localStorage (excluding default weapons)
export const saveInventoryToStorage = (inventory: Weapon[]): void => {
  const defaultInventory = getDefaultPlayerInventory();
  const defaultWeaponIds = defaultInventory.map(w => `${w.type}-${w.rarity}`);
  
  // Only save weapons that are not in the default inventory
  const additionalWeapons = inventory.filter(
    weapon => !defaultWeaponIds.includes(`${weapon.type}-${weapon.rarity}`)
  );
  
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(additionalWeapons));
  } catch (error) {
    console.error('Failed to save inventory to localStorage:', error);
  }
};

// Load player inventory from localStorage
export const loadInventoryFromStorage = (): Weapon[] => {
  const defaultInventory = getDefaultPlayerInventory();
  
  try {
    const stored = localStorage.getItem(INVENTORY_KEY);
    if (!stored) {
      return defaultInventory;
    }
    
    const additionalWeapons: Weapon[] = JSON.parse(stored);
    
    // Combine default inventory with stored additional weapons
    const allWeapons = [...defaultInventory, ...additionalWeapons];
    
    // Remove duplicates (in case of data corruption)
    const uniqueWeapons = allWeapons.filter((weapon, index, self) =>
      index === self.findIndex(w => w.type === weapon.type && w.rarity === weapon.rarity)
    );
    
    return uniqueWeapons;
  } catch (error) {
    console.error('Failed to load inventory from localStorage:', error);
    return defaultInventory;
  }
};

// Add a weapon to inventory and save to localStorage
export const addWeaponToInventory = (weapon: Weapon, currentInventory: Weapon[]): Weapon[] => {
  // Check if weapon already exists in inventory
  const exists = currentInventory.some(
    w => w.type === weapon.type && w.rarity === weapon.rarity
  );
  
  if (exists) {
    return currentInventory; // Don't add duplicates
  }
  
  const newInventory = [...currentInventory, weapon];
  saveInventoryToStorage(newInventory);
  return newInventory;
};

// Weighted random selection helper
const weightedRandom = <T>(items: T[], weights: number[]): T => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }
  
  // Fallback to last item
  return items[items.length - 1];
};

// Get a random weapon from all available weapons (excluding default ones)
// Returns a weapon with randomized stats within the range for its type and rarity
// Uses weighted random selection based on rarity and weapon type
export const getRandomWeapon = (): Weapon => {
  const defaultInventory = getDefaultPlayerInventory();
  const defaultWeaponIds = defaultInventory.map(w => `${w.type}-${w.rarity}`);
  
  // Get all available weapon types (excluding default combinations)
  const availableTypes: WeaponType[] = [];
  const availableRarities: WeaponRarity[] = [];
  
  // Collect available types and rarities
  WEAPONS.forEach(weapon => {
    const weaponId = `${weapon.type}-${weapon.rarity}`;
    if (!defaultWeaponIds.includes(weaponId)) {
      if (!availableTypes.includes(weapon.type)) {
        availableTypes.push(weapon.type);
      }
      if (!availableRarities.includes(weapon.rarity)) {
        availableRarities.push(weapon.rarity);
      }
    }
  });
  
  // Special handling for machine gun (Legendary only, very rare)
  // 1% chance to get machine gun, otherwise use normal selection
  if (Math.random() < 0.01) {
    // Machine gun is only Legendary
    return generateRandomWeaponStats(WeaponType.MACHINE_GUN, WeaponRarity.LEGENDARY);
  }
  
  // If no available combinations, use all types and rarities (excluding machine gun)
  if (availableTypes.length === 0 || availableRarities.length === 0) {
    const allTypes = [WeaponType.SWORD, WeaponType.PISTOL, WeaponType.SHOTGUN, WeaponType.ASSAULT_RIFLE, WeaponType.RIFLE];
    const allRarities = Object.values(WeaponRarity);
    
    // Use weighted selection
    const typeWeights = allTypes.map(type => WEAPON_TYPE_WEIGHTS[type] || 1);
    const rarityWeights = allRarities.map(rarity => RARITY_WEIGHTS[rarity] || 1);
    
    const selectedType = weightedRandom(allTypes, typeWeights);
    const selectedRarity = weightedRandom(allRarities, rarityWeights);
    
    return generateRandomWeaponStats(selectedType, selectedRarity);
  }
  
  // Filter weights for available types and rarities
  const typeWeights = availableTypes.map(type => WEAPON_TYPE_WEIGHTS[type] || 1);
  const rarityWeights = availableRarities.map(rarity => RARITY_WEIGHTS[rarity] || 1);
  
  // Use weighted random selection
  const selectedType = weightedRandom(availableTypes, typeWeights);
  const selectedRarity = weightedRandom(availableRarities, rarityWeights);
  
  // Verify the combination is not a default weapon
  const selectedWeaponId = `${selectedType}-${selectedRarity}`;
  if (defaultWeaponIds.includes(selectedWeaponId)) {
    // If it's a default weapon, try again with a different rarity
    const nonDefaultRarities = availableRarities.filter(r => `${selectedType}-${r}` !== selectedWeaponId);
    if (nonDefaultRarities.length > 0) {
      const rarityWeightsFiltered = nonDefaultRarities.map(r => RARITY_WEIGHTS[r] || 1);
      const finalRarity = weightedRandom(nonDefaultRarities, rarityWeightsFiltered);
      return generateRandomWeaponStats(selectedType, finalRarity);
    }
  }
  
  return generateRandomWeaponStats(selectedType, selectedRarity);
};

// Check if crate can be opened (24-hour cooldown)
export const canOpenCrate = (): boolean => {
  try {
    const lastOpen = localStorage.getItem(LAST_CRATE_OPEN_KEY);
    if (!lastOpen) {
      return true; // Never opened before
    }
    
    const lastOpenTime = parseInt(lastOpen, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    return (now - lastOpenTime) >= twentyFourHours;
  } catch (error) {
    console.error('Failed to check crate cooldown:', error);
    return true; // Allow opening if there's an error
  }
};

// Get time until next crate can be opened (in milliseconds)
export const getTimeUntilNextCrate = (): number => {
  try {
    const lastOpen = localStorage.getItem(LAST_CRATE_OPEN_KEY);
    if (!lastOpen) {
      return 0; // Can open now
    }
    
    const lastOpenTime = parseInt(lastOpen, 10);
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    const timeSinceLastOpen = now - lastOpenTime;
    const timeUntilNext = twentyFourHours - timeSinceLastOpen;
    
    return Math.max(0, timeUntilNext);
  } catch (error) {
    console.error('Failed to get time until next crate:', error);
    return 0;
  }
};

// Save the current time as last crate open time
export const saveLastCrateOpenTime = (): void => {
  try {
    localStorage.setItem(LAST_CRATE_OPEN_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to save last crate open time:', error);
  }
};

// Format time remaining as hours and minutes
export const formatTimeRemaining = (milliseconds: number): string => {
  const hours = Math.floor(milliseconds / (60 * 60 * 1000));
  const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

