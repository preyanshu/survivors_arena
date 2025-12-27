import { useState, useEffect, useRef } from 'react';
import { Weapon } from '../types/game';
import { getRarityColor, getRarityBorderColor, calculateFirerate, getDebugWeapons } from '../data/weapons';
import { spriteManager } from '../utils/spriteManager';
import { useOneWallet } from '../hooks/useOneWallet';
import { Transaction } from '@onelabs/sui/transactions';

interface InventoryProps {
  onBack: () => void;
  playerInventory: Weapon[];
  loading?: boolean;
}

const Inventory = ({ onBack, playerInventory, loading }: InventoryProps) => {
  const { executeTransaction, connected, address, connect, disconnect, installWallet, isWalletInstalled, isCorrectChain } = useOneWallet();
  
  // Check for debug flag from environment
  const isDebugMode = import.meta.env.VITE_DEBUG_WEAPONS === 'true';

  console.log('isDebugMode', isDebugMode);
  
  // Use debug weapons if flag is enabled, otherwise use player inventory
  const displayInventory = isDebugMode ? getDebugWeapons() : playerInventory;
  
  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(displayInventory[0] || null);
  
  // Update selected weapon when inventory changes
  useEffect(() => {
    if (displayInventory.length > 0 && (!selectedWeapon || !displayInventory.find(w => w.id === selectedWeapon.id))) {
      setSelectedWeapon(displayInventory[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayInventory.length, isDebugMode]);
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleTransfer = async () => {
    if (!selectedWeapon?.id || !recipientAddress || isTransferring) return;
    
    setIsTransferring(true);
    setTransferError(null);
    
    try {
      const tx = new Transaction();
      tx.transferObjects([tx.object(selectedWeapon.id)], tx.pure.address(recipientAddress));
      
      await executeTransaction(tx);
      setTransferSuccess(true);
      setTimeout(() => {
        setShowTransferModal(false);
        setTransferSuccess(false);
        // Ideally we should refetch inventory here, but we might need to trigger it from parent
        // For now, user can go back and refresh
      }, 2000);
    } catch (err: any) {
      console.error("Transfer failed:", err);
      const errorMessage = err.message || "Transfer failed";
      
      // Check for wallet permission errors
      if (errorMessage.includes('viewAccount') || errorMessage.includes('suggestTransaction') || errorMessage.includes('permission')) {
        setTransferError("Your wallet is not connected properly. Please reconnect your wallet and try again.");
      } else {
        setTransferError(errorMessage);
      }
    } finally {
      setIsTransferring(false);
    }
  };

  useEffect(() => {
    spriteManager.loadSprites().then(() => {
      setSpritesLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!selectedWeapon || !spritesLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw weapon sprite
    const spriteName = `weapon_${selectedWeapon.type}`;
    const sprite = spriteManager.getSprite(spriteName);
    
    if (sprite) {
      const size = 300;
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
  }, [selectedWeapon, spritesLoaded]);

  return (
    <>
      <style>{`
        .weapon-list-item {
          background-color: #5a0000;
        }
        .weapon-list-item:hover {
          background-color: #7a0000;
        }
        .weapon-list-item.selected {
          background-color: #8b0000;
        }
        .back-button {
          background-color: #5a0000;
        }
        .back-button:hover {
          background-color: #7a0000;
        }
        .weapons-scrollable::-webkit-scrollbar {
          width: 14px;
        }
        .weapons-scrollable::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(0, 200, 255, 0.2);
        }
        .weapons-scrollable::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(0, 200, 255, 0.4) 0%, rgba(0, 150, 200, 0.5) 100%);
          border: 1px solid rgba(0, 200, 255, 0.6);
          box-shadow: inset 0 0 4px rgba(0, 200, 255, 0.3);
        }
        .weapons-scrollable::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(0, 200, 255, 0.6) 0%, rgba(0, 150, 200, 0.7) 100%);
          border-color: rgba(0, 200, 255, 0.9);
          box-shadow: inset 0 0 6px rgba(0, 200, 255, 0.5);
        }
      `}</style>
      <div className="h-screen w-screen bg-black text-white flex overflow-hidden relative" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
        {/* Background image */}
        <img
          src="/assets/sprites/image copy 3.png"
          alt="Background"
          className="absolute inset-0 w-screen h-screen object-cover pointer-events-none"
        style={{ 
          imageRendering: 'pixelated', 
          zIndex: 0,
          filter: 'brightness(0.7) contrast(1.15)',
          opacity: 0.9
        }}
        />
        
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 hud-button py-3 px-8 font-bold"
          style={{ 
            fontSize: '18px',
            imageRendering: 'pixelated',
            zIndex: 20,
            borderColor: 'rgba(0, 200, 255, 0.5)'
          }}
        >
          <span className="hud-text">← BACK</span>
        </button>

        {/* Wallet connection button - top right */}
        <div className="absolute top-8 right-8 z-20">
          {connected ? (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3">
                <div className="text-white text-sm font-bold bg-black/70 px-3 py-2 rounded border border-white/30 flex items-center gap-2">
                  {formatAddress(address)}
                  {!isCorrectChain && (
                    <span className="text-red-400 text-xs font-bold" title="Wrong network">!</span>
                  )}
                </div>
                <button
                  onClick={disconnect}
                  className="border-2 border-white/50 py-2 px-4 text-white text-sm font-bold transition-all rounded bg-[#0a4a0a] hover:bg-[#0a5a0a]"
                  style={{ fontSize: '14px', imageRendering: 'pixelated' }}
                >
                  DISCONNECT
                </button>
              </div>
              {!isCorrectChain && (
                <div className="text-red-400 text-xs font-bold bg-red-900/50 px-2 py-1 rounded border border-red-400">
                  WRONG NETWORK - SWITCH TO ONECHAIN TESTNET
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={isWalletInstalled() ? connect : installWallet}
              className="border-2 border-white/50 py-2 px-4 text-white text-sm font-bold transition-all rounded bg-[#1a1a1a] hover:bg-[#2a2a2a]"
              style={{ fontSize: '14px', imageRendering: 'pixelated' }}
            >
              {isWalletInstalled() ? 'CONNECT ONECHAIN WALLET' : 'INSTALL ONECHAIN WALLET'}
            </button>
          )}
        </div>

        {/* Left side - Weapon list */}
        <div className="w-1/3 p-8 pt-20 border-r-2 border-cyan-500/30 overflow-y-auto flex-shrink-0 relative weapons-scrollable" style={{ zIndex: 10 }}>
          <h1 className="hud-text-accent mb-8 text-center font-bold" style={{ fontSize: '32px' }}>
            INVENTORY
          </h1>

          <div className="flex flex-col gap-4">
            {displayInventory.map((weapon) => {
              const rarityColor = getRarityColor(weapon.rarity);
              const rarityBorderColor = getRarityBorderColor(weapon.rarity);
              const isSelected = selectedWeapon?.type === weapon.type && selectedWeapon?.rarity === weapon.rarity;
              
              return (
                <button
                  key={weapon.id || `${weapon.type}-${weapon.rarity}-${Math.random()}`}
                  onClick={() => setSelectedWeapon(weapon)}
                  className={`hud-panel p-4 text-left transition-all relative hover:scale-105 ${
                    isSelected ? 'selected' : ''
                  }`}
                  style={{ 
                    imageRendering: 'pixelated',
                    backgroundColor: isSelected ? rarityColor : 'rgba(0, 0, 0, 0.85)',
                    '--hud-border-color': rarityBorderColor,
                  } as React.CSSProperties}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.setProperty('--hud-border-color', rarityBorderColor);
                    e.currentTarget.style.boxShadow = `0 0 10px ${rarityBorderColor}40, inset 0 0 10px ${rarityBorderColor}20`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = '';
                  }}
                >
                  <div className="hud-corner hud-corner-tl" style={{ borderColor: rarityBorderColor }}></div>
                  <div className="hud-corner hud-corner-tr" style={{ borderColor: rarityBorderColor }}></div>
                  <div className="hud-corner hud-corner-bl" style={{ borderColor: rarityBorderColor }}></div>
                  <div className="hud-corner hud-corner-br" style={{ borderColor: rarityBorderColor }}></div>
                  <span className="hud-text font-bold" style={{ fontSize: '20px' }}>
                    {weapon.name.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
          
          {loading && (
            <div className="hud-text-warning text-center mt-4 font-bold text-xl animate-pulse">
              LOADING INVENTORY...
            </div>
          )}
        </div>

        {/* Right side - Weapon details */}
        <div className="w-2/3 p-6 pt-20 flex flex-col items-center justify-start overflow-y-auto flex-shrink-0 relative weapons-scrollable" style={{ zIndex: 10 }}>
          {selectedWeapon ? (
            <>
              <h2 className="hud-text-accent mb-2 font-bold text-center" style={{ fontSize: '32px' }}>
                {selectedWeapon.name.toUpperCase()}
              </h2>
              
              <div className="mb-4 mx-auto max-w-full px-4 text-center">
                <div className="hud-panel px-4 py-2 relative inline-block max-w-full overflow-hidden">
                  <div className="hud-corner hud-corner-tl"></div>
                  <div className="hud-corner hud-corner-tr"></div>
                  <div className="hud-corner hud-corner-bl"></div>
                  <div className="hud-corner hud-corner-br"></div>
                  <div className="hud-text-warning text-xs font-bold font-mono whitespace-nowrap overflow-x-auto scrollbar-hide">
                    {selectedWeapon.id?.startsWith('default-') 
                      ? '[DEFAULT WEAPON]' 
                      : selectedWeapon.id 
                        ? `NFT ID: ${selectedWeapon.id}`
                        : ''}
                  </div>
                </div>
              </div>

              <div className="mb-2 text-center flex justify-center items-center gap-4">
                <span 
                  className="hud-panel px-4 py-2 relative inline-block"
                  style={{
                    fontSize: '14px',
                    backgroundColor: getRarityColor(selectedWeapon.rarity),
                    '--hud-border-color': getRarityBorderColor(selectedWeapon.rarity),
                  } as React.CSSProperties}
                >
                  <div className="hud-corner hud-corner-tl"></div>
                  <div className="hud-corner hud-corner-tr"></div>
                  <div className="hud-corner hud-corner-bl"></div>
                  <div className="hud-corner hud-corner-br"></div>
                  <span className="hud-text font-bold">{selectedWeapon.rarity.toUpperCase()}</span>
                </span>
                
                {selectedWeapon.id && !selectedWeapon.id.startsWith('default-') && !selectedWeapon.id.startsWith('debug-') && (
                  <button
                    onClick={() => {
                      setRecipientAddress('');
                      setTransferError(null);
                      setTransferSuccess(false);
                      setShowTransferModal(true);
                    }}
                    className="hud-button py-2 px-4 font-bold h-[38px] flex items-center"
                    style={{ fontSize: '14px', imageRendering: 'pixelated', borderColor: 'rgba(255, 68, 68, 0.5)' }}
                  >
                    <span className="hud-text-danger">TRANSFER</span>
                  </button>
                )}
              </div>

              <div className="flex justify-center mb-6">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={300}
                  style={{ imageRendering: 'pixelated', maxWidth: '100%', height: 'auto' }}
                />
              </div>

              <div className="w-full px-4" style={{ fontSize: '18px' }}>
                <div className="mb-3 p-3 hud-panel relative">
                  <div className="hud-corner hud-corner-tl"></div>
                  <div className="hud-corner hud-corner-tr"></div>
                  <div className="hud-corner hud-corner-bl"></div>
                  <div className="hud-corner hud-corner-br"></div>
                  <span className="hud-text-accent">DAMAGE:</span> <span className="hud-text-warning ml-2 font-bold">{selectedWeapon.baseDamage}</span>
                </div>
                <div className="mb-3 p-3 hud-panel relative">
                  <div className="hud-corner hud-corner-tl"></div>
                  <div className="hud-corner hud-corner-tr"></div>
                  <div className="hud-corner hud-corner-bl"></div>
                  <div className="hud-corner hud-corner-br"></div>
                  <span className="hud-text-accent">FIRERATE:</span> <span className="hud-text-warning ml-2 font-bold">{calculateFirerate(selectedWeapon.cooldown).toFixed(5)}</span>
                </div>
                {selectedWeapon.range && (
                  <div className="mb-3 p-3 hud-panel relative">
                    <div className="hud-corner hud-corner-tl"></div>
                    <div className="hud-corner hud-corner-tr"></div>
                    <div className="hud-corner hud-corner-bl"></div>
                    <div className="hud-corner hud-corner-br"></div>
                    <span className="hud-text-accent">RANGE:</span> <span className="hud-text-warning ml-2 font-bold">{selectedWeapon.range}</span>
                  </div>
                )}
                <div className="mt-4 p-3 hud-panel relative">
                  <div className="hud-corner hud-corner-tl"></div>
                  <div className="hud-corner hud-corner-tr"></div>
                  <div className="hud-corner hud-corner-bl"></div>
                  <div className="hud-corner hud-corner-br"></div>
                  <p className="hud-text-accent font-bold" style={{ fontSize: '16px', lineHeight: '1.5' }}>
                    {selectedWeapon.description.toUpperCase()}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="hud-text-accent text-center" style={{ fontSize: '24px' }}>
              SELECT A WEAPON TO VIEW DETAILS
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 font-['Pixelify_Sans']">
          <div className="hud-panel p-8 max-w-md w-full mx-4 relative" style={{ imageRendering: 'pixelated' }}>
            <div className="hud-corner hud-corner-tl"></div>
            <div className="hud-corner hud-corner-tr"></div>
            <div className="hud-corner hud-corner-bl"></div>
            <div className="hud-corner hud-corner-br"></div>
            <h3 className="hud-text-accent text-3xl font-bold mb-6 text-center border-b-2 border-cyan-500/50 pb-4">TRANSFER NFT</h3>
            
            {transferSuccess ? (
              <div className="text-center py-4">
                <div className="hud-text-success text-2xl mb-4 font-bold">TRANSFER SUCCESSFUL!</div>
                <p className="hud-text text-lg mb-6">The weapon has been sent to the recipient.</p>
              </div>
            ) : (
              <>
                <p className="hud-text mb-6 text-lg text-center">
                  Enter the recipient's OneChain address below. 
                  <br/>
                  <span className="hud-text-danger font-bold mt-2 block">WARNING: THIS ACTION CANNOT BE UNDONE!</span>
                </p>
                
                <div className="mb-8">
                  <label className="block hud-text-accent text-lg font-bold mb-2">RECIPIENT ADDRESS</label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full hud-panel p-4 hud-text font-mono text-lg placeholder-gray-600 outline-none relative"
                    style={{ borderColor: 'rgba(0, 200, 255, 0.5)' }}
                  />
                </div>

                {transferError && (
                  <div className="mb-6 hud-text-danger text-lg hud-panel p-4 font-bold text-center relative" style={{ '--hud-border-color': 'rgba(255, 68, 68, 0.6)' } as React.CSSProperties}>
                    <div className="hud-corner hud-corner-tl"></div>
                    <div className="hud-corner hud-corner-tr"></div>
                    <div className="hud-corner hud-corner-bl"></div>
                    <div className="hud-corner hud-corner-br"></div>
                    {transferError}
                  </div>
                )}

                <div className="flex gap-6 justify-center">
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="hud-button py-3 px-8 font-bold"
                    disabled={isTransferring}
                    style={{ fontSize: '18px', borderColor: 'rgba(0, 200, 255, 0.5)' }}
                  >
                    <span className="hud-text">CANCEL</span>
                  </button>
                  <button
                    onClick={handleTransfer}
                    disabled={!recipientAddress || isTransferring}
                    className="hud-button py-3 px-8 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ fontSize: '18px', borderColor: 'rgba(0, 255, 136, 0.5)' }}
                  >
                    <span className="hud-text-success">{isTransferring ? 'SENDING...' : 'CONFIRM'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Inventory;

