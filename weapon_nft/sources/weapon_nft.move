module weapon_nft::weapon_nft;

use one::object::{Self, UID, ID};
use one::transfer;
use one::tx_context::{Self, TxContext};
use one::clock::{Self, Clock};
use one::coin::{Self, Coin};
use one::oct::OCT;
use one::table::{Self, Table};
use one::event;
use std::string::{Self, String};

// Constants
const COOLDOWN_PERIOD_MS: u64 = 86400000; // 24 hours in milliseconds
const BASE_FEE_MIST: u64 = 1000000000; // 1 OCT = 1,000,000,000 MIST
const FEE_PER_HOUR_MIST: u64 = 41666667; // ~0.0416 OCT per hour (1 OCT / 24 hours)

// Error codes
const E_NOT_ENOUGH_COINS: u64 = 0;
const E_COOLDOWN_NOT_EXPIRED: u64 = 1;
const E_INVALID_PAYMENT: u64 = 2;
const E_INSUFFICIENT_FEE: u64 = 3;
const E_INVALID_WEAPON_TYPE: u64 = 4;
const E_INVALID_RARITY: u64 = 5;
const E_INVALID_DAMAGE: u64 = 6;
const E_INVALID_COOLDOWN: u64 = 7;
const E_INVALID_RANGE: u64 = 8;

// Weapon NFT struct - all attributes from frontend
public struct WeaponNFT has key, store {
    id: UID,
    name: String,
    description: String,
    weapon_type: u8, // 0-4 (Pistol, Shotgun, Sword, Assault Rifle, Rifle)
    rarity: u8, // 1-5 (common to legendary)
    base_damage: u64,
    cooldown: u64, // in milliseconds
    range: u64, // in units
    url: String, // weapon image/asset URL
    minted_at: u64,
    minter: address,
}

// Registry to track last mint time for each address
public struct MintRegistry has key {
    id: UID,
    last_mint_times: Table<address, u64>, // address -> last mint timestamp
}

// Events
public struct WeaponMinted has copy, drop {
    weapon_id: ID,
    minter: address,
    name: String,
    weapon_type: u8,
    rarity: u8,
    base_damage: u64,
    cooldown: u64,
    range: u64,
    timestamp: u64,
}

public struct EarlyMintFeePaid has copy, drop {
    payer: address,
    fee_amount: u64,
    time_remaining_ms: u64,
}

// Module initializer - runs automatically on publish
fun init(ctx: &mut TxContext) {
    let registry = MintRegistry {
        id: object::new(ctx),
        last_mint_times: table::new(ctx),
    };
    
    // Make it a shared object so anyone can read/write
    transfer::share_object(registry);
}

// Test-only version for unit tests
#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(ctx);
}

// Accessor functions
public fun name(weapon: &WeaponNFT): String {
    weapon.name
}

public fun description(weapon: &WeaponNFT): String {
    weapon.description
}

public fun weapon_type(weapon: &WeaponNFT): u8 {
    weapon.weapon_type
}

public fun rarity(weapon: &WeaponNFT): u8 {
    weapon.rarity
}

public fun base_damage(weapon: &WeaponNFT): u64 {
    weapon.base_damage
}

public fun cooldown(weapon: &WeaponNFT): u64 {
    weapon.cooldown
}

public fun range(weapon: &WeaponNFT): u64 {
    weapon.range
}

public fun url(weapon: &WeaponNFT): String {
    weapon.url
}

public fun minted_at(weapon: &WeaponNFT): u64 {
    weapon.minted_at
}

public fun minter(weapon: &WeaponNFT): address {
    weapon.minter
}

// Get last mint time for an address
public fun get_last_mint_time(registry: &MintRegistry, user: address): u64 {
    if (table::contains(&registry.last_mint_times, user)) {
        *table::borrow(&registry.last_mint_times, user)
    } else {
        0
    }
}

// Calculate time remaining until next free mint (in milliseconds)
public fun get_time_remaining(registry: &MintRegistry, user: address, clock: &Clock): u64 {
    let last_mint = get_last_mint_time(registry, user);
    if (last_mint == 0) {
        return 0; // Never minted, can mint for free
    };
    
    let current_time = clock::timestamp_ms(clock);
    let elapsed = current_time - last_mint;
    
    if (elapsed >= COOLDOWN_PERIOD_MS) {
        return 0; // Cooldown expired
    };
    
    COOLDOWN_PERIOD_MS - elapsed
}

// Calculate fee based on time remaining
public fun calculate_fee(time_remaining_ms: u64): u64 {
    if (time_remaining_ms == 0) {
        return 0; // No fee if cooldown expired
    };
    
    // Calculate hours remaining (rounded up)
    let hours_remaining = (time_remaining_ms + 3599999) / 3600000; // Round up
    
    // Fee = base fee + (hours remaining * fee per hour)
    BASE_FEE_MIST + (hours_remaining * FEE_PER_HOUR_MIST)
}

// Main mint function with cooldown and fee logic
// All weapon attributes are provided from the frontend
public entry fun mint_weapon(
    registry: &mut MintRegistry,
    clock: &Clock,
    mut payment: Coin<OCT>,
    weapon_name: vector<u8>,
    weapon_description: vector<u8>,
    weapon_type: u8,
    rarity: u8,
    base_damage: u64,
    cooldown: u64,
    range: u64,
    weapon_url: vector<u8>,
    ctx: &mut TxContext,
) {
    let sender = tx_context::sender(ctx);
    let current_time = clock::timestamp_ms(clock);
    
    // Validate input parameters
    assert!(weapon_type <= 4, 4); // 0-4 for weapon types
    assert!(rarity >= 1 && rarity <= 5, 5); // 1-5 for rarities
    assert!(base_damage > 0, 6);
    assert!(cooldown > 0, 7);
    assert!(range > 0, 8);
    
    // Check last mint time
    let last_mint = get_last_mint_time(registry, sender);
    let time_remaining = if (last_mint == 0) {
        0 // First mint, no cooldown
    } else {
        let elapsed = current_time - last_mint;
        if (elapsed >= COOLDOWN_PERIOD_MS) {
            0 // Cooldown expired
        } else {
            COOLDOWN_PERIOD_MS - elapsed
        }
    };
    
    let fee_required = calculate_fee(time_remaining);
    let payment_amount = coin::value(&payment);
    
    // If cooldown not expired, require fee payment
    if (time_remaining > 0) {
        assert!(payment_amount >= fee_required, E_INSUFFICIENT_FEE);
        
        // Emit event for early mint fee
        event::emit(EarlyMintFeePaid {
            payer: sender,
            fee_amount: fee_required,
            time_remaining_ms: time_remaining,
        });
        
        // Take the fee from payment
        let fee_coin = coin::split(&mut payment, fee_required, ctx);
        // Fee goes to protocol treasury
        let treasury_address = @0x4c786f77e9289245c5266961e3d9aa7a815fb8673da5fd5ea992a28bcd6ac3fa;
        transfer::public_transfer(fee_coin, treasury_address);
    } else {
        // Free mint, but still need to handle payment
        // Return full payment if no fee required
        assert!(payment_amount >= 0, E_INVALID_PAYMENT);
    };
    
    // Create weapon NFT with all attributes from frontend
    let weapon = WeaponNFT {
        id: object::new(ctx),
        name: string::utf8(weapon_name),
        description: string::utf8(weapon_description),
        weapon_type,
        rarity,
        base_damage,
        cooldown,
        range,
        url: string::utf8(weapon_url),
        minted_at: current_time,
        minter: sender,
    };
    
    // Update last mint time
    if (table::contains(&registry.last_mint_times, sender)) {
        *table::borrow_mut(&mut registry.last_mint_times, sender) = current_time;
    } else {
        table::add(&mut registry.last_mint_times, sender, current_time);
    };
    
    // Emit mint event
    event::emit(WeaponMinted {
        weapon_id: object::id(&weapon),
        minter: sender,
        name: string::utf8(weapon_name),
        weapon_type,
        rarity,
        base_damage,
        cooldown,
        range,
        timestamp: current_time,
    });
    
    // Transfer weapon to sender
    transfer::transfer(weapon, sender);
    
    // Return remaining payment (if any)
    let payment_value = coin::value(&payment);
    if (payment_value > 0) {
        transfer::public_transfer(payment, sender);
    } else {
        // Payment was exactly the fee, transfer empty coin to sender
        transfer::public_transfer(payment, sender);
    };
}

// Query function to check if user can mint for free
public fun can_mint_free(registry: &MintRegistry, user: address, clock: &Clock): bool {
    get_time_remaining(registry, user, clock) == 0
}

// Query function to get fee required for early mint
public fun get_required_fee(registry: &MintRegistry, user: address, clock: &Clock): u64 {
    let time_remaining = get_time_remaining(registry, user, clock);
    calculate_fee(time_remaining)
}
