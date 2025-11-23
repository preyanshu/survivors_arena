# Weapon NFT Contract - Interaction Guide

## Published Package
**Package ID:** `0xc6c261cb39c87d87c62f0d1fb90b201cff1c9154f1d1c165e87637db44420dfc`

## MintRegistry Object
**MintRegistry ID:** `0x538fdb679284c9ac0bd482f28a1254480b05a78485a83ef22870fec343c667cd`

This is a shared object that tracks mint times for all users.

## Treasury
**Treasury Address:** `0x4c786f77e9289245c5266961e3d9aa7a815fb8673da5fd5ea992a28bcd6ac3fa`

## Finding the MintRegistry Object

The `init` function creates a shared `MintRegistry` object. To find it:

```bash
# List all objects and look for MintRegistry
one client objects

# Or search for it specifically
one client objects --json | grep -i "MintRegistry"
```

The MintRegistry will have type: `0xc6c261cb39c87d87c62f0d1fb90b201cff1c9154f1d1c165e87637db44420dfc::weapon_nft::MintRegistry`

## Finding the Clock Object

The Clock is a shared object from the framework:
- Type: `0x2::clock::Clock`
- It's a shared object, so you can reference it directly

## Minting a Weapon NFT

### Free Mint (First Time or After 24 Hours)

```bash
# Replace <MINT_REGISTRY_ID> with the actual MintRegistry object ID
# Replace <CLOCK_ID> with the Clock object ID (usually 0x6)
# Replace <PAYMENT_COIN_ID> with a coin object ID (can be 0 for free mint)
# Replace <YOUR_ADDRESS> with your address

one client ptb \
  --assign registry @<MINT_REGISTRY_ID> \
  --assign clock @<CLOCK_ID> \
  --assign payment @<PAYMENT_COIN_ID> \
  --move-call 0xc6c261cb39c87d87c62f0d1fb90b201cff1c9154f1d1c165e87637db44420dfc::weapon_nft::mint_weapon \
    registry clock payment \
    "Common Sword" \
    "Melee slash attack with high damage" \
    2u8 1u8 40u64 400u64 60u64 \
    "https://example.com/sword.png" \
  --gas-budget 20000000
```

### Early Mint with Fee (Before 24 Hours)

If you want to mint before the cooldown expires, you need to pay a fee:

```bash
# Calculate the required fee first (see query functions below)
# Then use a payment coin with sufficient OCT

one client ptb \
  --assign registry @<MINT_REGISTRY_ID> \
  --assign clock @<CLOCK_ID> \
  --assign payment @<PAYMENT_COIN_ID> \
  --move-call 0xc6c261cb39c87d87c62f0d1fb90b201cff1c9154f1d1c165e87637db44420dfc::weapon_nft::mint_weapon \
    registry clock payment \
    "Rare Rifle" \
    "High-damage precision weapon" \
    4u8 3u8 67u64 540u64 600u64 \
    "https://example.com/rifle.png" \
  --gas-budget 20000000
```

## Query Functions

### Check if you can mint for free

```bash
one client ptb \
  --assign registry @<MINT_REGISTRY_ID> \
  --assign clock @<CLOCK_ID> \
  --move-call 0xc6c261cb39c87d87c62f0d1fb90b201cff1c9154f1d1c165e87637db44420dfc::weapon_nft::can_mint_free \
    registry @<YOUR_ADDRESS> clock \
  --gas-budget 10000000
```

### Get required fee for early mint

```bash
one client ptb \
  --assign registry @<MINT_REGISTRY_ID> \
  --assign clock @<CLOCK_ID> \
  --move-call 0xc6c261cb39c87d87c62f0d1fb90b201cff1c9154f1d1c165e87637db44420dfc::weapon_nft::get_required_fee \
    registry @<YOUR_ADDRESS> clock \
  --gas-budget 10000000
```

## Weapon Attributes

When minting, provide these attributes:

1. **weapon_name**: String (e.g., "Common Sword")
2. **weapon_description**: String (e.g., "Melee slash attack")
3. **weapon_type**: u8 (0-4: Pistol, Shotgun, Sword, Assault Rifle, Rifle)
4. **rarity**: u8 (1-5: Common, Uncommon, Rare, Epic, Legendary)
5. **base_damage**: u64 (damage value)
6. **cooldown**: u64 (in milliseconds)
7. **range**: u64 (range value)
8. **weapon_url**: String (image/asset URL)

## Fee Calculation

- **Base Fee**: 1 OCT (1,000,000,000 MIST)
- **Fee per Hour**: ~0.0416 OCT per hour remaining
- **Formula**: `BASE_FEE + (time_remaining_ms / 3600000) * FEE_PER_HOUR`

## Example: Mint a Common Sword

```bash
# First, get your address
ADDRESS=$(one client active-address)

# Get a coin for payment (even if 0 for free mint)
COIN_ID=$(one client objects --json | jq -r '.[] | select(.type | contains("Coin<OCT>")) | .objectId' | head -1)

# Find MintRegistry (replace with actual ID after finding it)
REGISTRY_ID="<MINT_REGISTRY_ID>"
CLOCK_ID="0x6"  # Clock is usually at 0x6

# Mint the weapon
one client ptb \
  --assign registry @$REGISTRY_ID \
  --assign clock @$CLOCK_ID \
  --assign payment @$COIN_ID \
  --move-call 0xc6c261cb39c87d87c62f0d1fb90b201cff1c9154f1d1c165e87637db44420dfc::weapon_nft::mint_weapon \
    registry clock payment \
    "Common Sword" \
    "Melee slash attack with high damage" \
    2u8 1u8 40u64 400u64 60u64 \
    "https://example.com/sword.png" \
  --gas-budget 20000000
```

## Viewing Your Weapons

After minting, check your objects:

```bash
one client objects
```

Your weapon NFT will appear as:
`0xc6c261cb39c87d87c62f0d1fb90b201cff1c9154f1d1c165e87637db44420dfc::weapon_nft::WeaponNFT`

## Quick Start Example

```bash
# Set variables
PACKAGE_ID="0xc6c261cb39c87d87c62f0d1fb90b201cff1c9154f1d1c165e87637db44420dfc"
REGISTRY_ID="0x538fdb679284c9ac0bd482f28a1254480b05a78485a83ef22870fec343c667cd"
CLOCK_ID="0x6"
YOUR_ADDRESS=$(one client active-address)

# Get a payment coin (even a small one for free mint)
COIN_ID=$(one client objects --json | jq -r '.[] | select(.type | contains("Coin<OCT>")) | .objectId' | head -1)

# Mint your first weapon (free!)
one client ptb \
  --assign registry @$REGISTRY_ID \
  --assign clock @$CLOCK_ID \
  --assign payment @$COIN_ID \
  --move-call $PACKAGE_ID::weapon_nft::mint_weapon \
    registry clock payment \
    "Common Sword" \
    "Melee slash attack with high damage" \
    2u8 1u8 40u64 400u64 60u64 \
    "https://example.com/sword.png" \
  --gas-budget 20000000

# Check your objects to see the new weapon
one client objects
```

