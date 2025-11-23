module weapon_nft::achievement_nft;

use one::object::{Self, UID, ID};
use one::transfer;
use one::tx_context::{Self, TxContext};
use one::clock::{Self, Clock};
use std::string::{String};
use one::event;

// Achievement NFT struct
public struct AchievementNFT has key, store {
    id: UID,
    achievement_id: String, // Internal ID like 'survivor_100'
    title: String,
    description: String,
    wave_requirement: u64,
    image_url: String,
    minted_at: u64,
}

// Events
public struct AchievementMinted has copy, drop {
    nft_id: ID,
    recipient: address,
    achievement_id: String,
    title: String,
    wave_requirement: u64,
    timestamp: u64,
}

// Mint an achievement NFT
public entry fun mint_achievement(
    achievement_id: String,
    title: String,
    description: String,
    wave_requirement: u64,
    image_url: String,
    clock: &Clock,
    ctx: &mut TxContext
) {
    let sender = tx_context::sender(ctx);
    let id = object::new(ctx);
    let nft_id = object::uid_to_inner(&id);
    let timestamp = clock::timestamp_ms(clock);

    let nft = AchievementNFT {
        id,
        achievement_id,
        title,
        description,
        wave_requirement,
        image_url,
        minted_at: timestamp,
    };

    event::emit(AchievementMinted {
        nft_id,
        recipient: sender,
        achievement_id: nft.achievement_id,
        title: nft.title,
        wave_requirement,
        timestamp,
    });

    transfer::public_transfer(nft, sender);
}

// Accessors
public fun achievement_id(nft: &AchievementNFT): String {
    nft.achievement_id
}

public fun title(nft: &AchievementNFT): String {
    nft.title
}

public fun description(nft: &AchievementNFT): String {
    nft.description
}

public fun wave_requirement(nft: &AchievementNFT): u64 {
    nft.wave_requirement
}

public fun image_url(nft: &AchievementNFT): String {
    nft.image_url
}

public fun minted_at(nft: &AchievementNFT): u64 {
    nft.minted_at
}
