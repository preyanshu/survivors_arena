# Survival Arena - Game Mechanics Documentation

## Table of Contents
1. [Player Mechanics](#player-mechanics)
2. [Weapons System](#weapons-system)
3. [Active Abilities](#active-abilities)
4. [Power-Ups](#power-ups)
5. [Enemy Types](#enemy-types)
6. [Wave System](#wave-system)
7. [Inventory & Progression](#inventory--progression)
8. [Visual Effects](#visual-effects)

---

## Player Mechanics

### Base Stats
- **Starting Health**: 200 HP
- **Starting Movement Speed**: 7 units/frame
- **Starting Damage Multiplier**: 1.0x
- **Starting Attack Speed**: 1.0x
- **Starting Projectile Size**: 1.0x
- **Starting Knockback**: 10 units
- **Starting Cooldown Reduction**: 0%

### Player Size
- **Player Sprite Size**: 120 pixels

### Movement
- Player moves with WASD keys
- Movement is relative to camera position
- Infinite world (no boundaries)
- Camera follows player (centered view)

### Combat
- **Attack**: Left mouse click or hold
- Attacks fire toward mouse cursor position
- Weapon cooldown determines attack rate
- Damage is calculated as: `weapon.baseDamage * playerStats.damage`

### Health & Armor Systems
- **Health pickups**:
  - Heal 20 HP instantly
  - Spawn every ~8 seconds near the player (but outside the visible bubble)
  - Additional pickups can drop from defeated enemies (20% chance)
  - Despawn if they drift more than ~1000 units away
- **Armor (Vests)**:
  - Vests grant up to **60 blue HP** that absorbs damage before regular health
  - Random vest pickups spawn every ~45 seconds and can also drop from enemies (10% chance)
  - Blue HP is capped at 60 and does not persist between runs

### Ammo System
- All non-sword weapons now use ammo
- Ammo resets to the weapon’s max value at the start of each wave
- Ammo pickups:
  - Spawn every ~10 seconds outside the visible area
  - Restore 15 ammo (capped by the weapon’s max)
  - 15% chance to drop from enemies (only if using guns)
- UI shows current ammo and flashes a **LOW ON AMMO** warning (center-screen) below 25%

---

## Weapons System

### Weapon Types

There are **6 weapon types**, each with unique characteristics:

#### 1. **Pistol**
- **Base Damage**: 25
- **Base Cooldown**: 500ms (2 shots/second)
- **Range**: 400 units
- **Projectile Count**: 1
- **Description**: Shoots single bullets with good accuracy

#### 2. **Shotgun**
- **Base Damage**: 30 per pellet
- **Base Cooldown**: 800ms (1.25 shots/second)
- **Range**: 300 units
- **Projectile Count**: 3 (spread in cone)
- **Description**: Spreads 3 projectiles in a cone

#### 3. **Sword**
- **Base Damage**: 40
- **Base Cooldown**: 400ms (2.5 attacks/second)
- **Range**: 60 units (melee)
- **Projectile Count**: 1 (instant slash)
- **Description**: Melee slash attack with high damage
- **Special**: Piercing (can hit multiple enemies), instant hit

#### 4. **Assault Rifle**
- **Base Damage**: 22
- **Base Cooldown**: 150ms (6.67 shots/second)
- **Range**: 500 units
- **Projectile Count**: 1
- **Description**: Fast-firing automatic weapon with good damage
- **Special**: Has slight random spread

#### 5. **Rifle**
- **Base Damage**: 45
- **Base Cooldown**: 600ms (1.67 shots/second)
- **Range**: 600 units
- **Projectile Count**: 1
- **Description**: High-damage precision weapon with long range
- **Special**: Piercing bullets

#### 6. **Machine Gun** *(Legendary Exclusive)*
- **Base Damage**: 18
- **Base Cooldown**: 50ms (20 shots/second)
- **Range**: 500 units
- **Projectile Count**: 1
- **Description**: Full-auto bullet hose with extremely high DPS
- **Special**: Only drops as **Legendary** from Daily Chests (≈1% chance)

### Weapon Rarity System

Each weapon type normally has **5 rarity tiers** (Common → Legendary).  
The **Machine Gun** is a special case: it only exists as a **Legendary** weapon and cannot roll lower rarities.

#### Rarity Tiers

1. **Common** (Brown)
   - Damage: 100% of base
   - Cooldown: 100% of base
   - Drop Weight: 50% chance

2. **Uncommon** (Green)
   - Damage: +20% (1.2x)
   - Cooldown: -5% (0.95x)
   - Drop Weight: 30% chance

3. **Rare** (Blue)
   - Damage: +50% (1.5x)
   - Cooldown: -10% (0.9x)
   - Drop Weight: 12% chance

4. **Epic** (Purple)
   - Damage: +80% (1.8x)
   - Cooldown: -15% (0.85x)
   - Drop Weight: 6% chance

5. **Legendary** (Gold/Amber)
   - Damage: +120% (2.2x)
   - Cooldown: -25% (0.75x)
   - Drop Weight: 2% chance

### Weapon Stats Calculation

**Final Damage** = `baseDamage × rarityDamageMultiplier × playerDamageStat`

**Final Cooldown** = `baseCooldown × rarityCooldownMultiplier × (1 - playerCooldownReduction)`

**Firerate** = `1000 / finalCooldown` (shots per second, displayed with 5 decimal places)

### Default Inventory
- Players start with **Common Sword** and **Common Pistol** only
- Additional weapons obtained from Daily Chest

### Weapon Generation
- Weapons from crates have **randomized stats** within ±10-15% of base stats
- Stats have up to **5 decimal places** precision
- Randomization applies to both damage and cooldown independently

### Weapon Drop Weights (Daily Chest)
- **Sword**: 40% chance (easiest)
- **Pistol**: 30% chance
- **Shotgun**: 15% chance
- **Assault Rifle**: 10% chance
- **Rifle**: 5% chance
- **Machine Gun**: Appears only through a special Legendary roll (~1% overall)

---

## Active Abilities

Active abilities are unlocked through power-up selection and activated with number keys (1-5).

### Ability Activation
- Press **1-5** keys to activate abilities
- Abilities have individual cooldowns
- Multiple abilities can be active simultaneously
- Visual indicators show active status and countdown

### Available Abilities

#### 1. **Shield** (Key: 1)
- **Icon**: Lock
- **Duration**: 30 seconds
- **Cooldown**: 60 seconds
- **Effect**: Blocks ALL incoming damage
- **Visual**: Cyan shield effect around player
- **Unlock**: Via "Shield Ability" power-up

#### 2. **Fire Ring** (Key: 2)
- **Icon**: Fire
- **Duration**: 20 seconds
- **Cooldown**: 45 seconds
- **Effect**: Damages nearby enemies within 300 units and ignites them
- **Damage**: 30 per tick (every 500ms) + **burns for 3 seconds** after contact
- **Visual**: Orange-red fire ring animation around player
- **Unlock**: Via "Fire Ring Ability" power-up

#### 3. **Speed Boost** (Key: 3)
- **Icon**: Bolt
- **Duration**: 15 seconds
- **Cooldown**: 30 seconds
- **Effect**: +50% movement speed (additive to base speed)
- **Visual**: Cyan speed lines trailing behind player
- **Unlock**: Via "Speed Boost Ability" power-up

#### 4. **Damage Boost** (Key: 4)
- **Icon**: Star
- **Duration**: 10 seconds
- **Cooldown**: 40 seconds
- **Effect**: Triples all damage (3x)
- **Visual**: Red pulsing glow around player
- **Unlock**: Via "Damage Boost Ability" power-up

#### 5. **Freeze** (Key: 5)
- **Icon**: Circle-notch
- **Duration**: 12 seconds
- **Cooldown**: 50 seconds
- **Effect**: Slows all enemies by 50%
- **Visual**: Ice particles around player
- **Unlock**: Via "Freeze Ability" power-up

### Ability UI
- Abilities displayed in bottom-left corner
- Shows icon, keybind, name, and cooldown status
- Active abilities show "ACTIVE" marker
- Countdown (3, 2, 1) shown in last 3 seconds of active ability

---

## Power-Ups

Power-ups are selected after completing each wave. Choose 1 of 3 random power-ups.

### Passive Power-Ups (Stat Boosts)

Currently available passives:

1. **+25% Attack Speed** – Multiplies attack speed by 1.25× (affects weapon cooldowns)
2. **+30% Damage** – Multiplies all weapon damage by 1.3×
3. **+30 Max HP** – Raises max health by 30 and heals 30 HP instantly
4. **+30% Knockback** – Multiplies knockback force by 1.3×
5. **-30% Cooldown** – Adds 0.3 to cooldown reduction (stacking additively)

*(Legacy passives such as Movement Speed, Projectile Size, and +30 HP have been retired.)*

### Active Ability Power-Ups

These unlock new abilities (see Active Abilities section):
- **Shield Ability**
- **Fire Ring Ability**
- **Speed Boost Ability**
- **Damage Boost Ability**
- **Freeze Ability**

---

## Enemy Types

### Enemy Spawning
- Enemies spawn outside visible screen area
- Spawns prioritize behind player (40% chance)
- Enemies spawn gradually during wave
- Maximum 40% of target count alive at once (minimum 8)

### Enemy Distribution by Wave

**Waves 1-3:**
- 50% Weak
- 40% Normal
- 10% Strong

**Waves 4-6:**
- 30% Weak
- 50% Normal
- 20% Strong

**Waves 7+:**
- 20% Weak
- 40% Normal
- 40% Strong

### Enemy Scaling

Base stats scale with wave:
- **Base Health**: `40 + wave × 10`
- **Base Speed**: `3.2 + wave × 0.3`
- **Base Damage**: `15 + wave × 5`

### 1. WEAK Enemies

**Stats (relative to base):**
- Health: 60% of base
- Speed: 140% of base (very fast)
- Damage: 70% of base
- Size: 80 pixels

**Behavior:**
- **Kamikaze Units**: Fast-moving enemies that rush the player
- **Explosion on Death**: When killed, explode with yellow/orange fire effect
- **Explosion on Contact**: When touching player, explode immediately
- **Explosion Damage**: 
  - On death: 40 damage (if player within 150 units)
  - On contact: 50 damage
- **Visual**: Orange enemy sprite
- **Special**: Split enemies (from STRONG) do NOT explode

**Strategy**: Prioritize these fast enemies before they reach you!

### 2. NORMAL Enemies

**Stats (relative to base):**
- Health: 100% of base
- Speed: 100% of base
- Damage: 100% of base
- Size: 100 pixels

**Behavior:**
- **Ranged Attacks**: Shoot projectiles at player when within 600 units
- **Projectile Count**: 
  - Wave 1: 1 projectile
  - Waves 2-3: 1-2 projectiles
  - Wave 4+: 2-3 projectiles
- **Projectile Speed**: 6 units/frame
- **Projectile Damage**: 60% of melee damage
- **Attack Cooldown**: 1.5 seconds
- **Homing Projectiles**: 
  - Can shoot 1-2 blue homing projectiles
  - Homing chance: 15% (waves 1-2), 25% (waves 3-4), 35% (waves 5-7), 45% (wave 8+)
  - Homing speed: 5.5 units/frame
  - Homing projectiles follow player and can only be destroyed by weapons
- **Visual**: Green enemy sprite, orange projectiles, blue homing projectiles

**Strategy**: Destroy projectiles with your weapons, especially homing ones!

### 3. STRONG Enemies

**Stats (relative to base):**
- Health: 180% of base
- Speed: 85% of base (slower)
- Damage: 150% of base
- Size: 140 pixels (larger)

**Behavior:**
- **Shielding**: Protects nearby enemies within 200 units
  - Shielded enemies take 0 damage (complete immunity)
  - Visual: Cyan circle and dashed lines show shield connections
- **Charged Shot Attack**:
  - Charges for 2 seconds (decreases with wave: 2s → 1s over 10 waves)
  - Shows dotted line preview of shot path
  - Aim locks to player position when charging starts (doesn't track)
  - Fires extremely fast projectile (speed 25, size 50)
  - Projectile is **indestructible** (cannot be destroyed by weapons)
  - Charge cooldown: 3 seconds
  - Attack range: 600 units
- **Splitting**: On death, splits into 2-3 smaller enemies
  - Split enemies use STRONG sprite (smaller, size 60)
  - Split enemies are WEAK type with reduced stats
  - Split enemies do NOT explode
- **Berserker Mode** (activates at <70% health):
  - Speed: +80% (1.8x multiplier)
  - Size: +30% (1.3x multiplier)
  - Visual: Pulsing red glow
  - Charge time: 50% of normal
  - Charge cooldown: 40% reduction (60% of normal)
- **Visual**: Dark red enemy sprite, red charged projectiles, red glow when berserker

**Strategy**: 
- Kill STRONG enemies first to remove shields
- Move during charge phase to dodge locked shots
- Beware berserker mode - they become much more dangerous!

### Enemy Level Display
- All enemies show their level above health bar
- Level = wave number they spawned in
- Format: "Lv.X"

---

## Wave System

### Wave Progression
- Waves are infinite (no maximum)
- Each wave must be completed before next begins
- Press **E** to continue after wave completion

### Wave Scaling

**Enemy Count:**
- Formula: `12 + wave × 6` (max 80 enemies)
- Example: Wave 1 = 18 enemies, Wave 5 = 42 enemies

**Enemy Stats:**
- Health: `40 + wave × 10`
- Speed: `3.2 + wave × 0.3`
- Damage: `15 + wave × 5`

**Enemy Distribution:**
- Later waves have more STRONG enemies
- See "Enemy Types" section for distribution

### Wave Completion
- All enemies must be spawned AND defeated
- Power-up selection appears after completion
- Press E to continue to next wave

---

## Inventory & Progression

### Default Inventory
- **Common Sword**
- **Common Pistol**

### Weapon Acquisition

#### Daily Chest System
- Open one chest every 24 hours
- Chests contain random weapons (excluding default weapons)
- Weapons saved in localStorage
- Cooldown tracked in localStorage
- **Legendary Machine Gun**:
  - Exclusive to Daily Chests
  - Only rolls as a Legendary item (~1% overall chance)
  - Cannot be crafted or obtained elsewhere

#### Weapon Selection
- Choose weapon before starting game
- Only weapons in inventory are available
- Grid displays 4 weapons per row
- Scrollable list with custom dark-themed scrollbar

### Inventory Management
- Weapons persist across game sessions (localStorage)
- Default weapons (**Common Sword** and **Common Pistol**) always available
- Additional weapons from crates saved permanently

### Weapon Rarity Colors (Dark Theme)
- **Common**: Dark brown (#4a2c1a)
- **Uncommon**: Dark green (#1a4a1a)
- **Rare**: Dark blue (#1a2a4a)
- **Epic**: Dark purple (#3a1a4a)
- **Legendary**: Dark gold/amber (#4a3a1a)

---

## Visual Effects

### Particle Systems

#### Blood Particles
- Red particles on enemy death/impact
- Fade out over time
- Used for regular damage effects

#### Fire Explosion Particles
- Yellow/orange particles for weak enemy explosions
- Colors: Yellow, Orange-yellow, Orange, Red-orange
- Larger and more intense than blood particles
- Used for weak enemy death/contact explosions

### Ability Visuals

#### Shield Active
- Cyan shield effect around player
- Blocks all damage visually

#### Fire Ring Active
- Orange-red fire ring animation
- Rotates around player
- Damages nearby enemies
- Applies burning shader to enemies touched (flames persist during burn)

#### Speed Boost Active
- Cyan speed lines trailing behind player
- Visual speed effect

#### Damage Boost Active
- Red pulsing glow around player
- Pulsing intensity animation

#### Freeze Active
- Ice particles floating around player
- Visual freeze effect

### Enemy Visuals

#### Shielded Enemies
- Cyan circle around enemy
- Dashed cyan lines connecting to STRONG enemy

#### Charging STRONG Enemy
- Orange-red pulsing circle
- Dotted line showing locked shot path
- Circle grows as charge progresses

#### Berserker STRONG Enemy
- Pulsing red glow around enemy
- Larger size
- Faster movement

### Projectile Visuals
- **Ammo Pickups**: Bright yellow glow with ammo sprite
- **Vest Pickups**: Neon blue glow with vest sprite

#### Normal Enemy Projectiles
- Orange-red color (#ff4500)
- Size: 20 pixels
- Red glow effect

#### Homing Projectiles
- Bright blue color (#00aaff)
- Size: 24 pixels
- Blue glow effect
- Tracks player movement

#### Charged Shot (STRONG Enemy)
- Dark red color (#8b0000)
- Size: 50 pixels (very large)
- Red glow with outer ring
- Indestructible

---

## Game Systems

### Collision Detection
- Circular collision detection
- Player projectiles can destroy enemy projectiles (except indestructible)
- Player projectiles damage enemies on contact
- Enemy projectiles damage player on contact
- Enemy melee attacks damage player on contact

### Projectile Interactions
- **Player bullets destroy enemy projectiles** (except charged shots)
- **Sword slashes destroy enemy projectiles** (except charged shots)
- **Charged shots are indestructible** - must be dodged
- **Homing projectiles** can only be destroyed by weapons (not by dodging)

### Health Pickups
- Spawn randomly on battlefield
- Spawn interval: ~15 seconds
- Heal amount: 30 HP
- Visual: Pulsing health pickup sprite
- Despawn if too far from player

### Damage Calculation

**Player Damage to Enemy:**
```
Final Damage = Weapon Base Damage × Player Damage Stat × (Ability Multipliers)
```

**Enemy Damage to Player:**
- Melee: Full enemy damage
- Projectiles: 30% of enemy damage
- Weak enemy explosion: 40-50 damage
- Charged shot: 120% of STRONG enemy damage

### Knockback System
- Enemies are knocked back when hit
- Knockback distance = `playerStats.knockback`
- Affected by player's knockback stat

---

## UI Elements

### Game HUD
- **HP Widget** (Top-left):
  - Heart icon
  - Current/Max HP display
  - Health bar with red fill

- **Wave Widget** (Top-right):
  - Star icon
  - Current wave number
  - Enemies remaining count (circle-notch icon)
  - Enemies killed count (bolt icon)

### Ability Cards (Bottom-left)
- Shows unlocked abilities
- Displays icon, keybind, name, cooldown
- Active abilities show "ACTIVE" marker
- Countdown (3, 2, 1) in last 3 seconds

### Menus
- **Main Menu**: Game title, play options
- **Weapon Selection**: Grid of available weapons
- **Inventory**: Two-panel view (weapons list + details)
- **Daily Chest**: Crate opening with cooldown timer
- **Power-Up Selection**: 3 choices after each wave
- **Game Over**: Death screen with return to menu

---

## Technical Details

### Rendering
- Canvas-based rendering
- Pixelated sprite style
- Custom camera system (follows player)
- Infinite world rendering

### Performance
- Enemy limit: Max 80 per wave
- Projectile cleanup: Removed when too far from player
- Particle cleanup: Fade out and remove

### Storage
- **localStorage Keys**:
  - `survivalArena_inventory`: Player weapon inventory
  - `survivalArena_lastCrateOpen`: Last crate open timestamp

### Controls
- **Movement**: WASD keys
- **Attack**: Left mouse click/hold
- **Abilities**: 1-5 number keys
- **Continue Wave**: E key
- **Exit Game**: Exit button (with confirmation)

---

## Game Balance Notes

### Difficulty Scaling
- Enemy count increases linearly with waves
- Enemy stats scale with waves
- More STRONG enemies in later waves
- Charge time decreases with waves (faster attacks)

### Strategic Elements
- **Priority Targets**: STRONG enemies (remove shields)
- **Dodge Windows**: Charged shots have 2-second warning
- **Resource Management**:
  - Health pickups are limited and heal 20 HP
  - Vests add temporary blue HP but cap at 60
  - Ammo must be managed; swapping weapons or collecting drops keeps you firing
- **Ability Timing**: Cooldowns require strategic use

### Risk/Reward
- Weak enemies: Fast but explode (high risk)
- STRONG enemies: Tanky with dangerous attacks
- Berserker mode: Makes STRONG enemies much more dangerous
- Charged shots: Must dodge during charge phase

---

## Version Information

This documentation covers the current state of Survival Arena as of the latest implementation, including:
- Enemy splitting and shielding mechanics
- Weak enemy kamikaze explosions
- STRONG enemy charged shots and berserker mode
- Homing projectile system
- Weapon rarity system
- Active abilities system
- Daily chest progression (with Legendary-only Machine Gun)
- Ammo & vest pickup systems with blue HP cap
- Fire Ring burn-over-time behavior

