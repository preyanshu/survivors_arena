#[test_only]
module weapon_nft::weapon_nft_tests;

use weapon_nft::weapon_nft::{Self, WeaponNFT, MintRegistry};
use one::test_scenario::{Self as ts};
use one::coin;
use one::oct::OCT;
use one::clock::{Self, Clock};
use one::transfer;
use std::string;

const ADMIN: address = @0xAD;
const USER1: address = @0xCAFE;

#[test]
fun test_mint_weapon_free() {
    let mut scenario = ts::begin(ADMIN);
    
    // Initialize module
    {
        weapon_nft::init_for_testing(ts::ctx(&mut scenario));
    };
    
    // Setup clock
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::increment_for_testing(&mut clock, 1); // Start at 1ms to distinguish from 0 (never minted)
    clock::share_for_testing(clock);
    
    // First transaction: User1 mints a weapon (should be free)
    scenario.next_tx(USER1);
    {
        let mut registry: MintRegistry = ts::take_shared(&mut scenario);
        let clock_ref = ts::take_shared<Clock>(&mut scenario);
        
        let weapon_name = b"Common Sword";
        let weapon_description = b"Melee slash attack with high damage";
        let weapon_type = 2u8; // Sword
        let rarity = 1u8; // Common
        let base_damage = 40u64;
        let cooldown = 400u64;
        let range = 60u64;
        let weapon_url = b"https://example.com/sword.png";
        
        // Create a small payment coin
        let mut coin = coin::mint_for_testing<OCT>(1000000000, ts::ctx(&mut scenario));
        let payment = coin::split(&mut coin, 1000000, ts::ctx(&mut scenario));
        transfer::public_transfer(coin, USER1);
        
        weapon_nft::mint_weapon(
            &mut registry,
            &clock_ref,
            payment,
            weapon_name,
            weapon_description,
            weapon_type,
            rarity,
            base_damage,
            cooldown,
            range,
            weapon_url,
            ts::ctx(&mut scenario),
        );
        
        ts::return_shared(registry);
        ts::return_shared(clock_ref);
    };
    
    // Verify effects in next transaction
    scenario.next_tx(USER1);
    {
        // Take the weapon
        let weapon: WeaponNFT = ts::take_from_sender(&mut scenario);
        
        // Verify weapon properties
        assert!(weapon_nft::name(&weapon) == string::utf8(b"Common Sword"), 1);
        assert!(weapon_nft::weapon_type(&weapon) == 2, 2);
        assert!(weapon_nft::rarity(&weapon) == 1, 3);
        assert!(weapon_nft::base_damage(&weapon) == 40, 4);
        assert!(weapon_nft::cooldown(&weapon) == 400, 5);
        assert!(weapon_nft::range(&weapon) == 60, 6);
        assert!(weapon_nft::minter(&weapon) == USER1, 7);
        
        ts::return_to_sender(&mut scenario, weapon);
        
        // Clean up the refunded payment coin
        let payment_refund: coin::Coin<OCT> = ts::take_from_sender(&mut scenario);
        coin::burn_for_testing(payment_refund);
    };
    
    ts::end(scenario);
}

#[test]
fun test_cooldown_and_fee() {
    let mut scenario = ts::begin(ADMIN);
    
    // Initialize module
    {
        weapon_nft::init_for_testing(ts::ctx(&mut scenario));
    };
    
    // Setup clock
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::increment_for_testing(&mut clock, 1); // Start at 1ms to distinguish from 0 (never minted)
    clock::share_for_testing(clock);
    
    // First mint (free)
    scenario.next_tx(USER1);
    {
        let mut registry: MintRegistry = ts::take_shared(&mut scenario);
        let clock_ref = ts::take_shared<Clock>(&mut scenario);
        let mut coin = coin::mint_for_testing<OCT>(1000000000, ts::ctx(&mut scenario));
        let payment = coin::split(&mut coin, 1000000, ts::ctx(&mut scenario));
        transfer::public_transfer(coin, USER1);
        
        weapon_nft::mint_weapon(
            &mut registry,
            &clock_ref,
            payment,
            b"Common Pistol",
            b"Shoots single bullets",
            0u8,
            1u8,
            25u64,
            500u64,
            400u64,
            b"https://example.com/pistol.png",
            ts::ctx(&mut scenario),
        );
        
        ts::return_shared(registry);
        ts::return_shared(clock_ref);
    };
    
    // Cleanup first mint objects
    scenario.next_tx(USER1);
    {
        let weapon: WeaponNFT = ts::take_from_sender(&mut scenario);
        ts::return_to_sender(&mut scenario, weapon);
        let payment_refund: coin::Coin<OCT> = ts::take_from_sender(&mut scenario);
        coin::burn_for_testing(payment_refund);
    };
    
    // Advance time by 12 hours
    scenario.next_tx(ADMIN);
    {
        let mut clock_ref: Clock = ts::take_shared(&mut scenario);
        clock::increment_for_testing(&mut clock_ref, 43200000); // 12 hours
        ts::return_shared(clock_ref);
    };
    
    // Check fee is required
    scenario.next_tx(USER1);
    {
        let registry: MintRegistry = ts::take_shared(&mut scenario);
        let clock_ref = ts::take_shared<Clock>(&mut scenario);
        
        // Should not be able to mint free
        assert!(!weapon_nft::can_mint_free(&registry, USER1, &clock_ref), 10);
        
        // Should require fee
        let fee = weapon_nft::get_required_fee(&registry, USER1, &clock_ref);
        assert!(fee > 0, 11);
        
        ts::return_shared(registry);
        ts::return_shared(clock_ref);
    };
    
    ts::end(scenario);
}

#[test]
fun test_cooldown_expired() {
    let mut scenario = ts::begin(ADMIN);
    
    // Initialize module
    {
        weapon_nft::init_for_testing(ts::ctx(&mut scenario));
    };
    
    // Setup clock
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::increment_for_testing(&mut clock, 1); // Start at 1ms to distinguish from 0 (never minted)
    clock::share_for_testing(clock);
    
    // First mint
    scenario.next_tx(USER1);
    {
        let mut registry: MintRegistry = ts::take_shared(&mut scenario);
        let clock_ref = ts::take_shared<Clock>(&mut scenario);
        let mut coin = coin::mint_for_testing<OCT>(1000000000, ts::ctx(&mut scenario));
        let payment = coin::split(&mut coin, 1000000, ts::ctx(&mut scenario));
        transfer::public_transfer(coin, USER1);
        
        weapon_nft::mint_weapon(
            &mut registry,
            &clock_ref,
            payment,
            b"Rare Rifle",
            b"High-damage precision weapon",
            4u8,
            3u8,
            67u64,
            540u64,
            600u64,
            b"https://example.com/rifle.png",
            ts::ctx(&mut scenario),
        );
        
        ts::return_shared(registry);
        ts::return_shared(clock_ref);
    };
    
    // Cleanup first mint
    scenario.next_tx(USER1);
    {
        let weapon: WeaponNFT = ts::take_from_sender(&mut scenario);
        ts::return_to_sender(&mut scenario, weapon);
        let payment_refund: coin::Coin<OCT> = ts::take_from_sender(&mut scenario);
        coin::burn_for_testing(payment_refund);
    };
    
    // Advance time by 25 hours (more than 24 hour cooldown)
    scenario.next_tx(ADMIN);
    {
        let mut clock_ref: Clock = ts::take_shared(&mut scenario);
        clock::increment_for_testing(&mut clock_ref, 90000000); // 25 hours
        ts::return_shared(clock_ref);
    };
    
    // Second mint should be free (cooldown expired)
    scenario.next_tx(USER1);
    {
        let mut registry: MintRegistry = ts::take_shared(&mut scenario);
        let clock_ref = ts::take_shared<Clock>(&mut scenario);
        
        // Verify can mint free
        assert!(weapon_nft::can_mint_free(&registry, USER1, &clock_ref), 20);
        assert!(weapon_nft::get_required_fee(&registry, USER1, &clock_ref) == 0, 21);
        
        ts::return_shared(registry);
        ts::return_shared(clock_ref);
    };
    
    ts::end(scenario);
}

#[test]
#[expected_failure]
fun test_insufficient_fee() {
    let mut scenario = ts::begin(ADMIN);
    
    // Initialize module
    {
        weapon_nft::init_for_testing(ts::ctx(&mut scenario));
    };
    
    // Setup clock
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::increment_for_testing(&mut clock, 1); // Start at 1ms to distinguish from 0 (never minted)
    clock::share_for_testing(clock);
    
    // First mint
    scenario.next_tx(USER1);
    {
        let mut registry: MintRegistry = ts::take_shared(&mut scenario);
        let clock_ref = ts::take_shared<Clock>(&mut scenario);
        let mut coin = coin::mint_for_testing<OCT>(1000000000, ts::ctx(&mut scenario));
        let payment = coin::split(&mut coin, 1000000, ts::ctx(&mut scenario));
        transfer::public_transfer(coin, USER1);
        
        weapon_nft::mint_weapon(
            &mut registry,
            &clock_ref,
            payment,
            b"First Weapon",
            b"Description",
            0u8,
            1u8,
            25u64,
            500u64,
            400u64,
            b"https://example.com/weapon.png",
            ts::ctx(&mut scenario),
        );
        
        ts::return_shared(registry);
        ts::return_shared(clock_ref);
    };
    
    // Cleanup first mint
    scenario.next_tx(USER1);
    {
        let weapon: WeaponNFT = ts::take_from_sender(&mut scenario);
        ts::return_to_sender(&mut scenario, weapon);
        let payment_refund: coin::Coin<OCT> = ts::take_from_sender(&mut scenario);
        coin::burn_for_testing(payment_refund);
    };
    
    // Advance time by 12 hours
    scenario.next_tx(ADMIN);
    {
        let mut clock_ref: Clock = ts::take_shared(&mut scenario);
        clock::increment_for_testing(&mut clock_ref, 43200000); // 12 hours
        ts::return_shared(clock_ref);
    };
    
    // Try to mint with insufficient payment
    scenario.next_tx(USER1);
    {
        let mut registry: MintRegistry = ts::take_shared(&mut scenario);
        let clock_ref = ts::take_shared<Clock>(&mut scenario);
        
        // Create payment with less than required fee
        let mut coin = coin::mint_for_testing<OCT>(100000000, ts::ctx(&mut scenario)); // 0.1 OCT (too little)
        let payment = coin::split(&mut coin, 100000000, ts::ctx(&mut scenario));
        transfer::public_transfer(coin, USER1);
        
        weapon_nft::mint_weapon(
            &mut registry,
            &clock_ref,
            payment,
            b"Second Weapon",
            b"Description",
            1u8,
            2u8,
            30u64,
            800u64,
            300u64,
            b"https://example.com/weapon2.png",
            ts::ctx(&mut scenario),
        );
        
        // This should abort, so we won't reach here
        ts::return_shared(registry);
        ts::return_shared(clock_ref);
    };
    
    ts::end(scenario);
}
