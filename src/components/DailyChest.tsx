import { useState, useEffect } from 'react';
import { Weapon, WeaponType } from '../types/game';
import { getRarityColor, getRarityBorderColor, calculateFirerate } from '../data/weapons';
import { 
  formatTimeRemaining,
  getRandomWeapon
} from '../utils/storage';
import { spriteManager } from '../utils/spriteManager';
import { useOneWallet } from '../hooks/useOneWallet';
import { Transaction } from '@onelabs/sui/transactions';
import { bcs } from '@onelabs/sui/bcs';

interface DailyChestProps {
  onBack: () => void;
  onWeaponObtained: (weapon: Weapon) => void;
}

const PACKAGE_ID = '0xc6c261cb39c87d87c62f0d1fb90b201cff1c9154f1d1c165e87637db44420dfc';
const REGISTRY_ID = '0x538fdb679284c9ac0bd482f28a1254480b05a78485a83ef22870fec343c667cd';
const CLOCK_ID = '0x6';

const DailyChest = ({ onBack, onWeaponObtained }: DailyChestProps) => {
  const { connected, address, client, signTransaction, executeTransaction, isWalletInstalled } = useOneWallet();
  const [canOpen, setCanOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [openedWeapon, setOpenedWeapon] = useState<Weapon | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isLoadingState, setIsLoadingState] = useState(false);
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [feeRequired, setFeeRequired] = useState<number>(0);

  const handleBack = () => {
    setOpenedWeapon(null); // Reset opened weapon when going back
    setMintError(null);
    onBack();
  };

  useEffect(() => {
    spriteManager.loadSprites().then(() => {
      setSpritesLoaded(true);
    });
  }, []);

  // Fetch contract state to determine if crate can be opened
  useEffect(() => {
    if (!connected || !address || !client) {
      setCanOpen(false);
      setTimeRemaining("CONNECT WALLET");
      return;
    }

    const checkContractState = async () => {
      try {
        // Don't set loading on every tick, only initial or if needed
        // setIsLoadingState(true); 

        const tx = new Transaction();
        // We want to call the view function `get_time_remaining`
        // But for view functions via SDK we usually use devInspectTransactionBlock
        
        tx.moveCall({
          target: `${PACKAGE_ID}::weapon_nft::get_time_remaining`,
          arguments: [
            tx.object(REGISTRY_ID),
            tx.pure.address(address),
            tx.object(CLOCK_ID)
          ]
        });

        const result = await client.devInspectTransactionBlock({
          transactionBlock: tx,
          sender: address,
        });

        // Parse result
        // The return value is a u64 (milliseconds remaining)
        if (result.results && result.results[0] && result.results[0].returnValues) {
          // value is [bytes, type] tuple
          // we need to decode the bytes (BCS)
          // For u64, it's a little complex to decode manually without bcs, but we can assume it works
          // Or better, check if we can get JSON return values
          
          // Alternative: check raw bytes. 
          // But actually, let's look at `returnValues`. It gives raw bytes.
          // We can try `get_last_mint_time` which might be simpler, but `get_time_remaining` is what we want.
          
          // Let's assume 0 means free.
          // If return values are hard to parse without BCS library, we might need to fetch the table object directly.
          // But let's try to parse the u64.
          
          // Actually, devInspect usually returns values we can decode.
          // If we can't decode easily, we can rely on the error from a dry-run of minting? No that's expensive.
          
          // Let's assume we can't easily decode without `bcs` import. 
          // But wait, we can fetch the MintRegistry object dynamic fields? 
          // No, it's a Table. Table fields are not directly visible in the parent object.
          
          // Let's stick to devInspect.
          const returnValues = result.results[0].returnValues;
          if (returnValues && returnValues[0]) {
            const bytes = Uint8Array.from(returnValues[0][0]);
            // Decode u64 le
            const timeRemainingMs = Number(new DataView(bytes.buffer).getBigUint64(0, true));
            
            if (timeRemainingMs === 0) {
              setCanOpen(true);
              setTimeRemaining("NOW");
              setFeeRequired(0);
            } else {
              setCanOpen(false);
              setTimeRemaining(formatTimeRemaining(timeRemainingMs));
              
              // Check fee if cooldown is active
              const feeTx = new Transaction();
              feeTx.moveCall({
                target: `${PACKAGE_ID}::weapon_nft::get_required_fee`,
                arguments: [
                  feeTx.object(REGISTRY_ID),
                  feeTx.pure.address(address),
                  feeTx.object(CLOCK_ID)
                ]
              });
              
              const feeResult = await client.devInspectTransactionBlock({
                transactionBlock: feeTx,
                sender: address,
              });
              
              if (feeResult.results && feeResult.results[0] && feeResult.results[0].returnValues) {
                const feeBytes = Uint8Array.from(feeResult.results[0].returnValues[0][0]);
                const feeMist = Number(new DataView(feeBytes.buffer).getBigUint64(0, true));
                setFeeRequired(feeMist);
              }
            }
          }
        }
      } catch (e) {
        console.error("Failed to check contract state:", e);
        setCanOpen(false);
        // Keep showing checking status or a neutral message instead of breaking the UI
        setTimeRemaining("CHECKING STATUS...");
      }
    };

    checkContractState();
    const interval = setInterval(checkContractState, 5000); // Check every 5s to avoid spamming RPC

    return () => clearInterval(interval);
  }, [connected, address, client]);

  // Helper to convert string to byte array for Move
  const stringToBytes = (str: string) => {
    return Array.from(new TextEncoder().encode(str));
  };

  const handleOpenCrate = async (payFee: boolean = false) => {
    if ((!canOpen && !payFee) || isOpening) return;
    
    if (!connected) {
      setMintError("Please connect your OneChain wallet first!");
      return;
    }

    setMintError(null);
    setIsOpening(true);
    
    try {
      // 1. Generate random weapon stats locally
      const randomWeapon = getRandomWeapon();
      
      // 2. Prepare the transaction
      const tx = new Transaction();
      
      // Strategy: Split a tiny amount (or 0 if allowed, but split needs >0 usually) from gas
      // to create a dedicated payment coin. 
      // If paying fee, split fee amount. If free, split 0 (or 1 mist as placeholder if 0 fails).
      const amountToPay = payFee ? feeRequired : 0;
      // Ensure at least 1 mist if amount is 0 to avoid potential issues with zero-value splits if any
      // Although Move allows 0, splitCoins typically expects > 0 or handles 0 gracefully? 
      // Let's pass 0 if free, but if it fails we might need 1.
      // Actually, if free, we don't need to pay, but contract expects Coin<OCT>.
      // Let's pass exactly what's needed.
      
      const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure(bcs.u64().serialize(amountToPay))]);
      
      const weaponTypeMap: Record<string, number> = {
        [WeaponType.PISTOL]: 0,
        [WeaponType.SHOTGUN]: 1,
        [WeaponType.SWORD]: 2,
        [WeaponType.ASSAULT_RIFLE]: 3,
        [WeaponType.RIFLE]: 4,
      };
      
      const rarityMap: Record<string, number> = {
        'common': 1,
        'uncommon': 2,
        'rare': 3,
        'epic': 4,
        'legendary': 5,
      };

      // Scale decimals for Move (x100000)
      const scaledDamage = Math.round(randomWeapon.baseDamage * 100000);
      const scaledCooldown = Math.round(randomWeapon.cooldown * 100000);
      
      const range = randomWeapon.range || 0;
      const scaledRange = Math.round(range * 100000);

      tx.moveCall({
        target: `${PACKAGE_ID}::weapon_nft::mint_weapon`,
        arguments: [
          tx.object(REGISTRY_ID),
          tx.object(CLOCK_ID),
          paymentCoin,
          tx.pure(bcs.vector(bcs.u8()).serialize(stringToBytes(randomWeapon.name))),
          tx.pure(bcs.vector(bcs.u8()).serialize(stringToBytes(randomWeapon.description))),
          tx.pure(bcs.u8().serialize(weaponTypeMap[randomWeapon.type] ?? 0)),
          tx.pure(bcs.u8().serialize(rarityMap[randomWeapon.rarity] ?? 1)),
          tx.pure(bcs.u64().serialize(scaledDamage)),
          tx.pure(bcs.u64().serialize(scaledCooldown)),
          tx.pure(bcs.u64().serialize(scaledRange)),
          tx.pure(bcs.vector(bcs.u8()).serialize(stringToBytes("https://example.com/weapon.png"))),
        ],
      });

      // 3. Execute transaction
      console.log("Sending mint transaction...");
      const result = await executeTransaction(tx);
      console.log("Mint success:", result);

      // 4. On success, show UI (we don't save time locally anymore)
      setOpenedWeapon(randomWeapon);
      onWeaponObtained(randomWeapon);
      
      // Re-check contract state immediately
      setCanOpen(false); 
      
    } catch (error: any) {
      console.error("Minting failed:", error);
      setMintError(`Minting failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-black text-white flex items-center justify-center relative" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
      {/* Background image */}
      <img
        src="/assets/sprites/image copy 3.png"
        alt="Background"
        className="absolute inset-0 w-screen h-screen object-cover pointer-events-none"
        style={{ imageRendering: 'pixelated', zIndex: 0 }}
      />
      
      <div className="border-4 border-white p-8 text-center relative max-w-2xl w-full mx-4" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated', zIndex: 10 }}>
        <h1 className="text-white mb-6 font-bold" style={{ fontSize: '32px' }}>DAILY CHEST</h1>
        
        {openedWeapon ? (
          <div className="space-y-6">
            <div className="text-white mb-4" style={{ fontSize: '20px' }}>
              YOU OBTAINED:
            </div>
            <div 
              className="border-4 p-6 mx-auto max-w-md"
              style={{
                backgroundColor: getRarityColor(openedWeapon.rarity),
                borderColor: getRarityBorderColor(openedWeapon.rarity),
              }}
            >
              <div className="text-white font-bold mb-2" style={{ fontSize: '24px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
                {openedWeapon.name.toUpperCase()}
              </div>
              <div className="text-white text-sm mb-4" style={{ fontSize: '14px' }}>
                {openedWeapon.description}
              </div>
              <div className="text-white text-xs space-y-1">
                <div>DAMAGE: <span className="text-yellow-300">{openedWeapon.baseDamage}</span></div>
                <div>FIRERATE: <span className="text-yellow-300">{calculateFirerate(openedWeapon.cooldown).toFixed(5)}</span></div>
                {openedWeapon.range && (
                  <div>RANGE: <span className="text-yellow-300">{openedWeapon.range}</span></div>
                )}
              </div>
            </div>
            <div className="text-green-400 font-bold mt-4">
              NFT MINTED SUCCESSFULLY!
            </div>
            <button
              onClick={handleBack}
              className="bg-red-700 hover:bg-red-600 text-white border-4 border-white py-4 px-8 transition-all font-bold"
              style={{ fontSize: '18px', imageRendering: 'pixelated' }}
            >
              BACK
            </button>
          </div>
        ) : (
          <>
            {canOpen ? (
              <div className="space-y-6">
                <p className="text-gray-300 mb-6" style={{ fontSize: '18px' }}>
                  OPEN YOUR DAILY CHEST TO GET A RANDOM WEAPON!
                </p>
                
                {mintError && (
                  <div className="text-red-400 border border-red-400 p-2 mb-4 bg-red-900/50 text-sm">
                    {mintError}
                  </div>
                )}

                <button
                  onClick={() => handleOpenCrate(false)}
                  disabled={isOpening}
                  className="bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white border-4 border-white py-6 px-12 transition-all font-bold"
                  style={{ fontSize: '24px', imageRendering: 'pixelated' }}
                >
                  {isOpening ? 'MINTING...' : 'OPEN CHEST'}
                </button>
                {!connected && (
                  <p className="text-yellow-400 text-sm mt-2">
                    * Wallet connection required to mint
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-gray-300 mb-6" style={{ fontSize: '18px' }}>
                  YOU HAVE ALREADY OPENED YOUR DAILY CHEST
                </p>
                <p className="text-yellow-300 mb-6 font-bold" style={{ fontSize: '20px' }}>
                  {!connected ? "CONNECT WALLET TO CHECK STATUS" : 
                   (timeRemaining ? `NEXT CHEST AVAILABLE IN: ${timeRemaining}` : "CHECKING STATUS...")}
                </p>
                
                {feeRequired > 0 && (
                  <div className="mt-4">
                    <p className="text-white mb-2 text-sm">OR OPEN IMMEDIATELY</p>
                    <button
                      onClick={() => handleOpenCrate(true)}
                      disabled={isOpening}
                      className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white border-4 border-white py-4 px-8 transition-all font-bold"
                      style={{ fontSize: '18px', imageRendering: 'pixelated' }}
                    >
                      {isOpening ? 'MINTING...' : `PAY ${(feeRequired / 1_000_000_000).toFixed(4)} OCT FEE`}
                    </button>
                    <p className="text-gray-400 text-xs mt-2">
                      (1 OCT Base + {((feeRequired / 1_000_000_000) - 1).toFixed(4)} Time Fee)
                    </p>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={handleBack}
              disabled={isOpening}
              className="bg-red-700 hover:bg-red-600 disabled:bg-gray-600 text-white border-4 border-white py-4 px-8 transition-all font-bold mt-6"
              style={{ fontSize: '18px', imageRendering: 'pixelated' }}
            >
              BACK
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyChest;
