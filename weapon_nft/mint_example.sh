#!/bin/bash

# Weapon NFT Minting Example Script
# Package ID: 0xc6c261cb39c87d87c62f0d1fb90b201cff1c9154f1d1c165e87637db44420dfc
# MintRegistry ID: 0x538fdb679284c9ac0bd482f28a1254480b05a78485a83ef22870fec343c667cd

PACKAGE_ID="0xc6c261cb39c87d87c62f0d1fb90b201cff1c9154f1d1c165e87637db44420dfc"
REGISTRY_ID="0x538fdb679284c9ac0bd482f28a1254480b05a78485a83ef22870fec343c667cd"
CLOCK_ID="0x6"

# Get your address
YOUR_ADDRESS=$(one client active-address)
echo "Your address: $YOUR_ADDRESS"

# Get a coin for gas/payment
GAS_COIN_ID=$(one client objects --json 2>/dev/null | jq -r '.[] | select(.type | contains("Coin<OCT>")) | .objectId' | head -1)

if [ -z "$GAS_COIN_ID" ]; then
    echo "Error: No OCT coin found. Please get some testnet OCT first."
    exit 1
fi

echo "Using gas coin: $GAS_COIN_ID"
echo "Splitting coin to create a dedicated payment object..."

# Create a new coin for payment (1 OCT)
# We use transfer-oct to send it to ourselves, which handles the split + transfer
PAYMENT_COIN_Result=$(one client transfer-oct --amount 1000000000 --to $YOUR_ADDRESS --coin-object-id $GAS_COIN_ID --gas-budget 10000000 --json)

# Extract the new coin ID from the effects
PAYMENT_COIN_ID=$(echo $PAYMENT_COIN_Result | jq -r '.effects.created[0].reference.objectId')

if [ -z "$PAYMENT_COIN_ID" ] || [ "$PAYMENT_COIN_ID" == "null" ]; then
    echo "Error: Failed to create payment coin."
    echo "Result: $PAYMENT_COIN_Result"
    exit 1
fi

echo "Created payment coin: $PAYMENT_COIN_ID"
echo ""
echo "Minting a Common Sword weapon..."

# Prepare vector arguments for strings
NAME_BYTES="[67,111,109,109,111,110,32,83,119,111,114,100]" # "Common Sword"
DESC_BYTES="[77,101,108,101,101,32,115,108,97,115,104,32,97,116,116,97,99,107]" # "Melee slash attack"
URL_BYTES="[104,116,116,112,115,58,47,47,101,120,97,109,112,108,101,46,99,111,109,47,115,119,111,114,100,46,112,110,103]" # "https://example.com/sword.png"

# Mint the weapon
one client ptb \
  --assign registry @$REGISTRY_ID \
  --assign clock @$CLOCK_ID \
  --assign payment @$PAYMENT_COIN_ID \
  --make-move-vec '<u8>' "$NAME_BYTES" --assign name_vec \
  --make-move-vec '<u8>' "$DESC_BYTES" --assign desc_vec \
  --make-move-vec '<u8>' "$URL_BYTES" --assign url_vec \
  --move-call $PACKAGE_ID::weapon_nft::mint_weapon \
    registry clock payment \
    name_vec desc_vec \
    2u8 1u8 40u64 400u64 60u64 \
    url_vec \
  --gas-budget 20000000

echo ""
echo "Check your objects to see the new weapon:"
echo "  one client objects"
