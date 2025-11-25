import { useState, useEffect, useRef } from 'react';
import { Weapon, WeaponType, WeaponRarity } from '../types/game';
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
const WEAPON_NFT_TYPE = `${PACKAGE_ID}::weapon_nft::WeaponNFT`;

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
  const chestCanvasRef = useRef<HTMLCanvasElement>(null);
  const weaponCanvasRef = useRef<HTMLCanvasElement>(null);

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

  // Draw chest sprite on canvas
  useEffect(() => {
    if (!spritesLoaded || !chestCanvasRef.current) return;

    const canvas = chestCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Determine which chest sprite to show
    const chestSpriteName = openedWeapon ? 'chest_open' : 'chest_closed';
    const sprite = spriteManager.getSprite(chestSpriteName);
    
    if (sprite) {
      const size = 320;
      const x = canvas.width / 2;
      const y = canvas.height / 2;
      
      // Calculate aspect ratio
      const spriteAspect = sprite.width / sprite.height;
      let drawWidth = size;
      let drawHeight = size / spriteAspect;
      
      ctx.drawImage(
        sprite,
        x - drawWidth / 2,
        y - drawHeight / 2,
        drawWidth,
        drawHeight
      );
    }
  }, [spritesLoaded, openedWeapon]);

  // Draw weapon sprite on canvas when weapon is opened
  useEffect(() => {
    if (!openedWeapon || !spritesLoaded || !weaponCanvasRef.current) return;

    const canvas = weaponCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw weapon sprite
    const spriteName = `weapon_${openedWeapon.type}`;
    const sprite = spriteManager.getSprite(spriteName);
    
    if (sprite) {
      const size = 200;
      const x = canvas.width / 2;
      const y = canvas.height / 2;
      
      // Calculate aspect ratio
      const spriteAspect = sprite.width / sprite.height;
      let drawWidth = size;
      let drawHeight = size / spriteAspect;
      
      ctx.drawImage(
        sprite,
        x - drawWidth / 2,
        y - drawHeight / 2,
        drawWidth,
        drawHeight
      );
    }
  }, [openedWeapon, spritesLoaded]);

  // Contract state checking - check cooldown and fee
  useEffect(() => {
    if (!connected || !address || !client) {
      setCanOpen(false);
      setTimeRemaining("CONNECT WALLET");
      setIsLoadingState(false);
      return;
    }

    // Set loading state immediately when starting check
    setIsLoadingState(true);

    const checkContractState = async () => {
      try {
        const tx = new Transaction();
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

        if (result.results && result.results[0] && result.results[0].returnValues) {
          const returnValues = result.results[0].returnValues;
          if (returnValues && returnValues[0]) {
            const bytes = Uint8Array.from(returnValues[0][0]);
            const timeRemainingMs = Number(new DataView(bytes.buffer).getBigUint64(0, true));
            
            if (timeRemainingMs === 0) {
              setCanOpen(true);
              setTimeRemaining("NOW");
              setFeeRequired(0);
              setIsLoadingState(false);
            } else {
              setCanOpen(false);
              setTimeRemaining(formatTimeRemaining(timeRemainingMs));
              
              // Fetch fee while keeping loading state
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
              setIsLoadingState(false);
            }
          } else {
            setIsLoadingState(false);
          }
        } else {
          setIsLoadingState(false);
        }
      } catch (e) {
        console.error("Failed to check contract state:", e);
        setCanOpen(false);
        setTimeRemaining("CHECKING STATUS...");
        setIsLoadingState(false);
      }
    };

    checkContractState();
    const interval = setInterval(checkContractState, 5000);
    return () => clearInterval(interval);
  }, [connected, address, client]);

  // Helper to convert string to byte array for Move
  const stringToBytes = (str: string) => {
    return Array.from(new TextEncoder().encode(str));
  };

  // Helper function to parse weapon from on-chain object
  const parseWeaponFromObject = (objResponse: any): Weapon | null => {
    const content = objResponse.data?.content;
    if (!content || content.dataType !== 'moveObject') return null;

    const fields = content.fields;
    
    // Map u8 type to Enum
    const typeMap: Record<number, WeaponType> = {
      0: WeaponType.PISTOL,
      1: WeaponType.SHOTGUN,
      2: WeaponType.SWORD,
      3: WeaponType.ASSAULT_RIFLE,
      4: WeaponType.RIFLE,
    };

    // Map u8 rarity to Enum
    const rarityMap: Record<number, WeaponRarity> = {
      1: WeaponRarity.COMMON,
      2: WeaponRarity.UNCOMMON,
      3: WeaponRarity.RARE,
      4: WeaponRarity.EPIC,
      5: WeaponRarity.LEGENDARY,
    };

    // Scale down decimal values (contract stores as u64 * 100000)
    const damage = Number(fields.base_damage) / 100000;
    const cooldown = Number(fields.cooldown) / 100000;
    const range = Number(fields.range) / 100000;

    return {
      type: typeMap[Number(fields.weapon_type)] || WeaponType.PISTOL,
      rarity: rarityMap[Number(fields.rarity)] || WeaponRarity.COMMON,
      name: fields.name,
      description: fields.description,
      baseDamage: damage,
      cooldown: cooldown,
      range: range,
      id: objResponse.data?.objectId
    };
  };

  const handleOpenCrate = async (payFee: boolean = false) => {
    if ((!canOpen && !payFee) || isOpening) return;
    
    if (!connected || !client) {
      setMintError("Please connect your OneChain wallet first!");
      return;
    }

    setMintError(null);
    setIsOpening(true);
    
    try {
      // Generate random weapon stats for minting
      const randomWeapon = getRandomWeapon();
      const tx = new Transaction();
      const amountToPay = payFee ? feeRequired : 0;
      
      // Always split at least 1 MIST to create a valid coin object (even for free mints)
      // The contract will return it if no fee is required
      const minAmount = amountToPay > 0 ? amountToPay : 1;
      const [paymentCoin] = tx.splitCoins(tx.gas, [minAmount]);
      
      const weaponTypeMap: Record<string, number> = {
        [WeaponType.PISTOL]: 0,
        [WeaponType.SHOTGUN]: 1,
        [WeaponType.SWORD]: 2,
        [WeaponType.ASSAULT_RIFLE]: 3,
        [WeaponType.RIFLE]: 4,
        [WeaponType.MACHINE_GUN]: 5,
      };
      
      const rarityMap: Record<string, number> = {
        [WeaponRarity.COMMON]: 1,
        [WeaponRarity.UNCOMMON]: 2,
        [WeaponRarity.RARE]: 3,
        [WeaponRarity.EPIC]: 4,
        [WeaponRarity.LEGENDARY]: 5,
      };

      const scaledDamage = Math.round(randomWeapon.baseDamage * 100000);
      const scaledCooldown = Math.round(randomWeapon.cooldown * 100000);
      const range = randomWeapon.range || 0;
      const scaledRange = Math.round(range * 100000);

      // Prepare string arguments as byte vectors
      const nameBytes = stringToBytes(randomWeapon.name);
      const descBytes = stringToBytes(randomWeapon.description);
      const urlBytes = stringToBytes("https://example.com/weapon.png");

      tx.moveCall({
        target: `${PACKAGE_ID}::weapon_nft::mint_weapon`,
        arguments: [
          tx.object(REGISTRY_ID),
          tx.object(CLOCK_ID),
          paymentCoin,
          tx.pure(bcs.vector(bcs.u8()).serialize(nameBytes)),
          tx.pure(bcs.vector(bcs.u8()).serialize(descBytes)),
          tx.pure.u8(weaponTypeMap[randomWeapon.type] ?? 0),
          tx.pure.u8(rarityMap[randomWeapon.rarity] ?? 1),
          tx.pure.u64(scaledDamage),
          tx.pure.u64(scaledCooldown),
          tx.pure.u64(scaledRange),
          tx.pure(bcs.vector(bcs.u8()).serialize(urlBytes)),
        ],
      });

      console.log("Sending mint transaction...");
      console.log("Transaction details:", {
        target: `${PACKAGE_ID}::weapon_nft::mint_weapon`,
        weaponName: randomWeapon.name,
        weaponType: weaponTypeMap[randomWeapon.type],
        rarity: rarityMap[randomWeapon.rarity],
        damage: scaledDamage,
        cooldown: scaledCooldown,
        range: scaledRange,
        amountToPay: amountToPay,
      });
      
      const result = await executeTransaction(tx);
      console.log("Mint success:", result);

      // Extract the created weapon NFT object ID from transaction result
      let weaponObjectId: string | null = null;
      
      // Check transaction effects for created objects
      if (result.effects?.created) {
        for (const created of result.effects.created) {
          if (created.reference?.objectId) {
            const objId = created.reference.objectId;
            // Verify it's a WeaponNFT by checking its type
            try {
              const obj = await client.getObject({
                id: objId,
                options: { showType: true, showContent: true }
              });
              if (obj.data?.type === WEAPON_NFT_TYPE) {
                weaponObjectId = objId;
                break;
              }
            } catch (e) {
              console.warn("Failed to verify object type:", e);
            }
          }
        }
      }

      // If we found the weapon object, fetch its full data
      if (weaponObjectId && client) {
        try {
          const weaponObj = await client.getObject({
            id: weaponObjectId,
            options: { showContent: true }
          });
          
          const parsedWeapon = parseWeaponFromObject(weaponObj);
          if (parsedWeapon) {
            setOpenedWeapon(parsedWeapon);
            onWeaponObtained(parsedWeapon);
          } else {
            // Fallback to random weapon if parsing fails
            setOpenedWeapon({ ...randomWeapon, id: weaponObjectId });
            onWeaponObtained({ ...randomWeapon, id: weaponObjectId });
          }
        } catch (e) {
          console.error("Failed to fetch weapon object:", e);
          // Fallback to random weapon with object ID
          setOpenedWeapon({ ...randomWeapon, id: weaponObjectId });
          onWeaponObtained({ ...randomWeapon, id: weaponObjectId });
        }
      } else {
        // Fallback if we can't find the object ID
        console.warn("Could not find weapon object ID in transaction result");
        setOpenedWeapon(randomWeapon);
        onWeaponObtained(randomWeapon);
      }

      setCanOpen(false); 
      
    } catch (error: any) {
      console.error("Minting failed:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        data: error.data,
        stack: error.stack,
      });
      const errorMessage = error.message || error.toString() || "Unknown error";
      
      // Check for wallet permission errors
      if (errorMessage.includes('viewAccount') || errorMessage.includes('suggestTransaction') || errorMessage.includes('permission')) {
        setMintError("Your wallet is not connected properly. Please reconnect your wallet and try again.");
      } else {
        setMintError(`Minting failed: ${errorMessage}`);
      }
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
      
      {/* Back button */}
      <button
        onClick={handleBack}
        disabled={isOpening}
        className="absolute top-6 left-6 border-4 border-white py-3 px-8 text-white font-bold bg-[#5a0000] hover:bg-[#7a0000] disabled:bg-gray-600 transition-all"
        style={{ 
          fontSize: '18px',
          imageRendering: 'pixelated',
          zIndex: 20
        }}
      >
        ← BACK
      </button>
      
      <div className="border-4 border-white p-5 text-center relative max-w-3xl w-full mx-4" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated', zIndex: 10 }}>
        <h1 className="text-white mb-3 font-bold" style={{ fontSize: '28px' }}>DAILY CHEST</h1>
        
        {/* Chest Canvas Container - Relative positioning for weapon placement */}
        <div className="relative flex justify-center mb-2" style={{ zIndex: 10 }}>
          {/* Weapon Canvas - Display above chest when opened, touching it */}
          {openedWeapon && (
            <div className="absolute flex justify-center" style={{ bottom: '130px', zIndex: 15, left: '50%', transform: 'translateX(-50%)' }}>
              <canvas
                ref={weaponCanvasRef}
                width={250}
                height={250}
                style={{ imageRendering: 'pixelated', maxWidth: '100%', height: 'auto' }}
              />
            </div>
          )}
          
          {/* Chest Canvas - Centerpiece */}
          <canvas
            ref={chestCanvasRef}
            width={350}
            height={350}
            style={{ imageRendering: 'pixelated', maxWidth: '100%', height: 'auto' }}
            className={isOpening ? 'animate-pulse' : ''}
          />
        </div>
        
        {openedWeapon ? (
          <div className="space-y-2">
            <div className="text-[#ffd700] mb-1 font-bold" style={{ fontSize: '20px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
              YOU OBTAINED:
            </div>
            <div 
              className="border-4 p-4 mx-auto max-w-xl"
              style={{
                backgroundColor: getRarityColor(openedWeapon.rarity),
                borderColor: getRarityBorderColor(openedWeapon.rarity),
              }}
            >
              <div className="text-white font-bold mb-3" style={{ fontSize: '20px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
                {openedWeapon.name.toUpperCase()}
              </div>
              <div className="text-white text-xs space-y-2 mt-2">
                <div>DAMAGE: <span className="text-[#ffd700] font-bold">{openedWeapon.baseDamage}</span></div>
                <div>FIRERATE: <span className="text-[#ffd700] font-bold">{calculateFirerate(openedWeapon.cooldown).toFixed(5)}</span></div>
                {openedWeapon.range && (
                  <div>RANGE: <span className="text-[#ffd700] font-bold">{openedWeapon.range}</span></div>
                )}
                <div className="mt-4 pt-3 border-t border-white/30">
                  <div className="text-white text-xs font-mono truncate" title={openedWeapon.id && !openedWeapon.id.startsWith('default-') ? openedWeapon.id : '0x0000000000000000000000000000000000000000000000000000000000000000'}>
                    NFT ID: {openedWeapon.id && !openedWeapon.id.startsWith('default-') ? openedWeapon.id : '0x0000000000000000000000000000000000000000000000000000000000000000'}
                  </div>
                </div>
              </div>
            </div>
            
            <p className="text-[#00d4ff] font-bold mt-2 mb-6" style={{ fontSize: '14px', textShadow: '1px 1px 0px rgba(0,0,0,0.8)' }}>
              CHECK YOUR INVENTORY TO VIEW YOUR NEW WEAPON!
            </p>
            
            <button
              onClick={handleBack}
              className="bg-green-700 hover:bg-green-600 text-white border-4 border-white py-3 px-10 transition-all font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-1 hover:shadow-none"
              style={{ fontSize: '18px', imageRendering: 'pixelated' }}
            >
              OK
            </button>
          </div>
        ) : (
          <>
            {canOpen ? (
              <div className="space-y-3">
                <p className="text-[#ffd700] mb-2 font-bold" style={{ fontSize: '18px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
                  TEST YOUR LUCK FOR A RARE WEAPON!
                </p>
                <p className="text-white mb-2 font-semibold" style={{ fontSize: '14px' }}>
                  UNLOCK THIS CHEST TO MINT AN NFT WEAPON
                </p>
                <p className="text-gray-300 mb-6 text-xs">
                  DISCOVER POWERFUL WEAPONS WITH UNIQUE STATS
                </p>
                
                {mintError && (
                  <div className="text-red-400 border border-red-400 p-2 mb-4 bg-red-900/50 text-xs">
                    {mintError}
                  </div>
                )}

                <button
                  onClick={() => handleOpenCrate(false)}
                  disabled={isOpening}
                  className="bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white border-4 border-white py-4 px-10 transition-all font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-1 hover:shadow-none"
                  style={{ fontSize: '20px', imageRendering: 'pixelated' }}
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
              <div className="space-y-2">
                <p className="text-white mb-2 font-semibold" style={{ fontSize: '16px' }}>
                  YOU HAVE ALREADY OPENED YOUR DAILY CHEST
                </p>
                <p className="text-[#ffd700] mb-3 font-bold" style={{ fontSize: '18px', textShadow: '1px 1px 0px rgba(0,0,0,0.8)' }}>
                  {!connected ? "CONNECT WALLET TO CHECK STATUS" : 
                   (isLoadingState ? "CHECKING STATUS..." : 
                    (timeRemaining ? `NEXT CHEST AVAILABLE IN: ${timeRemaining}` : "CHECKING STATUS..."))}
                </p>
                
                {feeRequired > 0 && (
                  <div className="mt-2">
                    <p className="text-white mb-1 text-xs">OR OPEN IMMEDIATELY</p>
                    <button
                      onClick={() => handleOpenCrate(true)}
                      disabled={isOpening}
                      className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white border-4 border-white py-3 px-6 transition-all font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-1 hover:shadow-none"
                      style={{ fontSize: '16px', imageRendering: 'pixelated' }}
                    >
                      {isOpening ? 'MINTING...' : `PAY ${(feeRequired / 1_000_000_000).toFixed(4)} OCT FEE`}
                    </button>
                    <p className="text-gray-400 text-xs mt-1">
                      (1 OCT Base + {((feeRequired / 1_000_000_000) - 1).toFixed(4)} Time Fee)
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DailyChest;
