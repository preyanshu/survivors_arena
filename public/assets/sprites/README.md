# Sprites Directory

This directory contains all sprite images used in the game. The game will automatically generate fallback sprites using canvas if images are not found.

## Required Sprites

### Player & Weapon
- **`player.png`** - Player character sprite
  - Recommended size: 120x120 or larger
  - The sprite will maintain its aspect ratio when rendered
  - Player sprite does not rotate (always faces the same direction)

- **`gun.png`** - Weapon sprite that appears in player's hands
  - Recommended size: 64x64 or larger
  - Rotates based on mouse aim direction
  - Positioned slightly offset from player to appear as if being held

### Enemies
- **`enemy_weak.png`** - Weak enemy type (orange fallback)
  - Lower health, slower speed
  - Appears in early waves

- **`enemy_normal.png`** - Normal enemy type (red fallback)
  - Medium health and speed
  - Most common enemy type

- **`enemy_strong.png`** - Strong enemy type (dark red fallback)
  - Higher health, faster speed
  - Appears in later waves

- **`enemy.png`** - Fallback enemy sprite (used if type-specific sprites are missing)

### Projectiles
- **`projectile.png`** - Bullet/projectile sprite
  - Rotates based on travel direction
  - Size varies by weapon type:
    - Pistol: 20px
    - Shotgun: 18px
    - Assault Rifle: 20px
    - Rifle: 24px

### Background
- **`background.png`** - Background texture
  - Tiled infinitely across the game world
  - Recommended: Seamless tileable texture
  - If missing, a grid pattern will be used as fallback

## Fallback Sprites

If sprite images are not found, the game automatically generates canvas-based fallback sprites:

- **Player**: Blue circle
- **Gun**: Brown gun shape
- **Enemy Weak**: Orange circle
- **Enemy Normal**: Red circle with spikes
- **Enemy Strong**: Dark red circle with more spikes
- **Projectile**: Yellow circle
- **Background**: Grid pattern

## Supported Formats

- PNG (recommended for transparency)
- JPG
- WebP

## Sprite Rendering

All sprites maintain their aspect ratio when rendered. The game uses a sprite manager that:
- Loads sprites asynchronously
- Handles rotation for weapons and projectiles
- Provides fallback canvas sprites if images fail to load
- Supports tiled background rendering
