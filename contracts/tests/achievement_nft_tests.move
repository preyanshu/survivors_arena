#[test_only]
module weapon_nft::achievement_nft_tests;

use weapon_nft::achievement_nft::{Self, AchievementNFT};
use one::test_scenario::{Self as ts};
use one::clock::{Self};
use std::string;

const ADMIN: address = @0xAD;
const USER1: address = @0xCAFE;

#[test]
fun test_mint_achievement() {
    let mut scenario = ts::begin(ADMIN);
    
    // Setup clock
    let mut clock = clock::create_for_testing(ts::ctx(&mut scenario));
    clock::increment_for_testing(&mut clock, 1000);
    clock::share_for_testing(clock);
    
    // Mint achievement
    scenario.next_tx(USER1);
    {
        let clock_ref = ts::take_shared(&mut scenario);
        
        let achievement_id = b"survivor_100";
        let title = b"God of Survival";
        let description = b"Survive Wave 100";
        let wave_requirement = 100u64;
        let image_url = b"https://example.com/achievement.png";
        
        weapon_nft::achievement_nft::mint_achievement(
            string::utf8(achievement_id),
            string::utf8(title),
            string::utf8(description),
            wave_requirement,
            string::utf8(image_url),
            &clock_ref,
            ts::ctx(&mut scenario)
        );
        
        ts::return_shared(clock_ref);
    };
    
    // Verify mint
    scenario.next_tx(USER1);
    {
        let nft: AchievementNFT = ts::take_from_sender(&mut scenario);
        
        assert!(weapon_nft::achievement_nft::achievement_id(&nft) == string::utf8(b"survivor_100"), 1);
        assert!(weapon_nft::achievement_nft::title(&nft) == string::utf8(b"God of Survival"), 2);
        assert!(weapon_nft::achievement_nft::description(&nft) == string::utf8(b"Survive Wave 100"), 3);
        assert!(weapon_nft::achievement_nft::wave_requirement(&nft) == 100, 4);
        assert!(weapon_nft::achievement_nft::image_url(&nft) == string::utf8(b"https://example.com/achievement.png"), 5);
        assert!(weapon_nft::achievement_nft::minted_at(&nft) == 1000, 6);
        
        ts::return_to_sender(&mut scenario, nft);
    };
    
    ts::end(scenario);
}

