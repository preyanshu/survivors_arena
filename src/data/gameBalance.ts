/**
 * Game Balance Configuration
 * 
 * This file controls the overall game pace and balance.
 * Adjust these values to make the game easier, harder, faster, or slower.
 * 
 * All speed values are in units per frame (multiplied by deltaTime/16 in game loop)
 * All time values are in milliseconds
 * 
 * GAME SPEED: Master control for overall game pace
 * - 0.5 = 50% slower (half speed)
 * - 1.0 = Normal speed (default)
 * - 1.5 = 50% faster
 * - 2.0 = Double speed
 * 
 * This affects:
 * - Enemy speeds (multiplied)
 * - Enemy charging times (divided - faster = lower time)
 * - Enemy attack cooldowns (divided - faster = lower cooldown)
 * - Player speeds (multiplied)
 * - Enemy projectile speeds (multiplied)
 * - Player weapon cooldowns (divided - faster = lower cooldown)
 * - Player projectile speeds (multiplied)
 */

// Base game speed multiplier
const GAME_SPEED = 1.3;

// Helper function to apply gameSpeed to speeds (multiply)
const speed = (value: number) => value * GAME_SPEED;

// Helper function to apply gameSpeed to cooldowns/charges (divide - faster = lower time)
const cooldown = (value: number) => value / GAME_SPEED;

export const GAME_BALANCE = {
  // ============================================
  // GLOBAL GAME SPEED
  // ============================================
  gameSpeed: GAME_SPEED,
  
  // ============================================
  // PLAYER CONFIGURATION
  // ============================================
  player: {
    // Base player movement speed (units per frame) - affected by gameSpeed
    baseMovementSpeed: speed(7),
    
    // Starting health
    startingHealth: 200,
    startingMaxHealth: 200,
    
    // Starting stats
    startingDamage: 1,
    startingAttackSpeed: 1,
    startingProjectileSize: 1,
    startingKnockback: 10,
    startingCooldownReduction: 0,
    
    // Player sprite size (pixels)
    size: 120,
  },

  // ============================================
  // WEAPON CONFIGURATION
  // ============================================
  weapons: {
    // Global weapon cooldown multiplier - affected by gameSpeed (faster = lower cooldown)
    // Lower values = faster attacks (e.g., 0.8 = 20% faster)
    // Higher values = slower attacks (e.g., 1.2 = 20% slower)
    cooldownMultiplier: cooldown(1.0),
    
    // Projectile speeds (units per frame) - affected by gameSpeed
    pistol: {
      projectileSpeed: speed(8),
    },
    shotgun: {
      projectileSpeed: speed(7),
    },
    assaultRifle: {
      projectileSpeed: speed(10),
    },
    rifle: {
      projectileSpeed: speed(12),
    },
    machine_gun: {
      projectileSpeed: speed(10), // Same as assault rifle
    },
    sword: {
      // Sword is instant, no projectile speed needed
      slashDistance: 60,
    },
  },

  // ============================================
  // ENEMY CONFIGURATION
  // ============================================
  enemies: {
    // Base enemy stats scaling per wave
    baseHealthPerWave: 10,      // Added per wave
    baseHealthStart: 40,         // Starting base health
    baseSpeedPerWave: speed(0.2),       // Added per wave - affected by gameSpeed
    baseSpeedStart: speed(3.5),         // Starting base speed - affected by gameSpeed
    baseDamagePerWave: 3,        // Added per wave
    baseDamageStart: 15,         // Starting base damage
    
    // Enemy type multipliers
    weak: {
      healthMultiplier: 0.6,     // 60% of base health
      speedMultiplier: 1.4,       // 140% of base speed (very fast)
      damageMultiplier: 0.7,      // 70% of base damage
      size: 80,
      // Explosion damage when weak enemy dies
      explosionDamageOnDeath: 20,  // Damage when killed by projectiles (was 40, now halved)
      explosionDamageOnContact: 25, // Damage when killed by contact (was 50, now halved)
      explosionRadius: 150,        // Explosion radius in units
    },
    normal: {
      healthMultiplier: 1.0,     // 100% of base stats
      speedMultiplier: 1.0,       // 100% of base speed
      damageMultiplier: 1.0,      // 100% of base damage
      size: 100,
    },
    strong: {
      healthMultiplier: 2.5,     // 180% of base health
      speedMultiplier: 0.95,      // 85% of base speed (slightly slower)
      damageMultiplier: 1.5,      // 150% of base damage
      size: 140,
    },
    lazer: {
      healthMultiplier: 0.2,     // 8 health (20% of base 40 = 8, increased for more strength)
      speedMultiplier: 1.0,      // 100% of base speed (increased from 0.8)
      damageMultiplier: 1.3,     // 130% of base damage (increased from 1.2)
      size: 210,                  // Larger villain for better presence
    },
    
    // Enemy attack configuration
    attack: {
      // Normal enemy ranged attack
      range: 600,                // Attack range in units
      cooldown: cooldown(1500),            // Attack cooldown in milliseconds - affected by gameSpeed
      projectileSpeed: speed(11),        // Projectile speed (units per frame) - affected by gameSpeed
      projectileSize: 20,        // Projectile size (pixels)
      
      // STRONG enemy charged shot
      chargeTimeStart: cooldown(1500),     // Starting charge time (ms) - affected by gameSpeed
      chargeTimeMin: cooldown(800),       // Minimum charge time (ms) - affected by gameSpeed
      chargeTimeReductionPerWave: cooldown(100), // Reduction per wave (ms) - affected by gameSpeed
      chargeCooldown: cooldown(3000),      // Cooldown after firing (ms) - affected by gameSpeed
      chargedProjectileSpeed: speed(30), // Charged shot speed (very fast) - affected by gameSpeed
      chargedProjectileSize: 50,  // Charged shot size (pixels)
      chargedDamageMultiplier: 1.6, // 120% of base damage
      
      // Berserker mode (STRONG enemies < 70% health)
      berserkerSpeedMultiplier: 1.8,    // 180% speed increase
      berserkerSizeMultiplier: 1.3,     // 130% size increase
      berserkerChargeTimeMultiplier: 0.3, // 50% charge time
      berserkerCooldownMultiplier: 0.6,   // 60% cooldown (40% reduction)
      
      // Projectile count scaling by wave
      projectileCount: {
        wave1: 1,                // Wave 1: 1 projectile
        wave2to3: { min: 1, max: 2 }, // Waves 2-3: 1-2 projectiles
        wave4Plus: { min: 2, max: 3 }, // Waves 4+: 2-3 projectiles
      },
      
      // Homing projectile chance by wave
      homingChance: {
        wave1to2: 0.15,          // 15% chance
        wave3to4: 0.25,           // 25% chance
        wave5to7: 0.35,           // 35% chance
        wave8Plus: 0.45,          // 45% chance
      },
      
      // Homing projectile properties
      homingProjectileSpeed: speed(8),   // Slower than normal projectiles - affected by gameSpeed
      homingProjectileSize: 20,
      
      // LAZER enemy lightning attack
      lightningCooldown: cooldown(3000), // Cooldown between lightning attacks (3 seconds) - affected by gameSpeed
      lightningDuration: 500,            // Duration in milliseconds (0.5 seconds) - instant hit
      lightningDamage: 12,               // Damage dealt by lightning (reduced from 25)
      lightningBounceRange: 300,          // Range to find nearby enemies for bouncing
      
      // LAZER enemy major attack (charge -> teleport -> energy beam)
      majorAttackCooldown: cooldown(14000), // Cooldown between major attacks (8 seconds) - affected by gameSpeed
      majorAttackChargeTime: cooldown(2000), // Charging time before teleport (2 seconds) - affected by gameSpeed
      majorAttackBeamDuration: 2000,      // Duration of energy beam in milliseconds (2 seconds)
      majorAttackBeamDamage: 8,           // Massive damage per hit (heavy attack)
      majorAttackBeamWidth: 37,           // Width of energy beam in pixels
      majorAttackBeamKnockback: 150,      // Massive knockback force when hit by energy beam
      majorAttackScreenShake: 15,         // Screen shake intensity during major attack
      maxActiveLazerEnemies: 3,          // Maximum number of LAZER enemies that can be active at once
      
      // Legacy laser beam config (kept for compatibility)
      laserBeamChargeTime: cooldown(1200), // Charging time before firing (1.2 seconds) - affected by gameSpeed
      laserBeamDuration: 1800,            // Duration in milliseconds (1.8 seconds)
      laserBeamCooldown: cooldown(4000), // Cooldown between laser attacks (4 seconds) - affected by gameSpeed
      laserBeamDamage: 1.2,              // Damage per frame while in beam (increased)
      laserBeamWidth: 24,                // Width of laser beam in pixels (increased for more intensity)
      laserBeamKnockback: 100,            // Knockback force when hit by laser beam (pushes player left/right)
    },
    
    // Shield range for STRONG enemies
    shieldRange: 200,             // Range in units
    
    // Freeze effect (from player ability)
    freezeSpeedMultiplier: 0.25,   // 75% speed reduction (increased from 50%)
  },

  // ============================================
  // WAVE CONFIGURATION
  // ============================================
  waves: {
    // Enemy count scaling
    enemyCountStart: 8,           // Starting enemy count (reduced from 12)
    enemyCountPerWave: 4,         // Added per wave (reduced from 6)
    enemyCountMax: 50,            // Maximum enemies per wave (reduced from 80)
    
    // Enemy type distribution by wave ranges
    distribution: {
      waves1to3: {
        weak: 0.5,    // 50%
        normal: 0.4,  // 40%
        strong: 0.1,  // 10%
      },
      waves4to6: {
        weak: 0.3,    // 30%
        normal: 0.5,  // 50%
        strong: 0.2,  // 20%
      },
      waves7Plus: {
        weak: 0.2,    // 20%
        normal: 0.4,  // 40%
        strong: 0.4,  // 40%
      },
    },
  },

  // ============================================
  // HEALTH PICKUP CONFIGURATION
  // ============================================
  healthPickups: {
    spawnInterval: 8000,         // Spawn every 8 seconds (ms)
    healAmount: 40,               // HP restored (doubled from 20)
    size: 30,                     // Pickup size (pixels)
    spawnDistance: {              // Spawn distance from player
      min: 200,
      max: 500,
    },
    despawnDistance: 1000,        // Despawn if too far (units)
  },

  // ============================================
  // AMMO CONFIGURATION
  // ============================================
  ammo: {
    maxAmmo: {                    // Max ammo per weapon type per wave
      pistol: 180,
      assault_rifle: 400,
      rifle: 90,
      shotgun: 80,
      machine_gun: 600,           // High ammo for full auto
    },
    pickupAmount: 10000000,             // Ammo restored per pickup
    size: 25,                     // Pickup size (pixels)
    spawnInterval: 10000,         // Spawn every 10 seconds (ms)
    spawnDistance: {              // Spawn distance from player
      min: 200,
      max: 500,
    },
    despawnDistance: 1000,        // Despawn if too far (units)
    dropChance: 0.15,             // 15% chance to drop from enemies
  },

  // ============================================
  // VEST CONFIGURATION
  // ============================================
  vests: {
    blueHealthAmount: 60,         // Blue health (armor) given per vest
    size: 30,                     // Pickup size (pixels)
    spawnInterval: 45000,         // Spawn every 45 seconds (ms)
    spawnDistance: {              // Spawn distance from player
      min: 200,
      max: 500,
    },
    despawnDistance: 1000,        // Despawn if too far (units)
    dropChance: 0.10,             // 10% chance to drop from enemies
  },
} as const;

// Type export for TypeScript
export type GameBalance = typeof GAME_BALANCE;
