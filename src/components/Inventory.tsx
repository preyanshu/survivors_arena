import { useState, useEffect, useRef } from 'react';
import { Weapon } from '../types/game';
import { getRarityColor, getRarityBorderColor, calculateFirerate } from '../data/weapons';
import { spriteManager } from '../utils/spriteManager';
import { useOneWallet } from '../hooks/useOneWallet';
import { Transaction } from '@onelabs/sui/transactions';

interface InventoryProps {
  onBack: () => void;
  playerInventory: Weapon[];
  loading?: boolean;
}

const Inventory = ({ onBack, playerInventory, loading }: InventoryProps) => {
  const { executeTransaction } = useOneWallet();
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(playerInventory[0] || null);
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
      setTransferError(err.message || "Transfer failed");
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
          width: 16px;
        }
        .weapons-scrollable::-webkit-scrollbar-track {
          background: #1a0000;
          border: 2px solid #3a0000;
        }
        .weapons-scrollable::-webkit-scrollbar-thumb {
          background: #5a0000;
          border: 2px solid #3a0000;
          border-radius: 0;
        }
        .weapons-scrollable::-webkit-scrollbar-thumb:hover {
          background: #7a0000;
        }
      `}</style>
      <div className="h-screen w-screen bg-black text-white flex overflow-hidden relative" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
        {/* Background image */}
        <img
          src="/assets/sprites/image copy 3.png"
          alt="Background"
          className="absolute inset-0 w-screen h-screen object-cover pointer-events-none"
          style={{ imageRendering: 'pixelated', zIndex: 0 }}
        />
        
        {/* Back button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 border-4 border-white py-3 px-8 text-white font-bold back-button"
          style={{ 
            fontSize: '18px',
            imageRendering: 'pixelated',
            zIndex: 20
          }}
        >
          ← BACK
        </button>

        {/* Left side - Weapon list */}
        <div className="w-1/3 p-8 pt-20 border-r-4 border-white overflow-y-auto flex-shrink-0 relative weapons-scrollable" style={{ zIndex: 10 }}>
          <h1 className="text-white mb-8 text-center font-bold" style={{ fontSize: '32px' }}>INVENTORY</h1>

          <div className="flex flex-col gap-4">
            {playerInventory.map((weapon) => {
              const rarityColor = getRarityColor(weapon.rarity);
              const rarityBorderColor = getRarityBorderColor(weapon.rarity);
              const isSelected = selectedWeapon?.type === weapon.type && selectedWeapon?.rarity === weapon.rarity;
              
              return (
                <button
                  key={weapon.id || `${weapon.type}-${weapon.rarity}-${Math.random()}`}
                  onClick={() => setSelectedWeapon(weapon)}
                  className={`border-4 p-4 text-left transition-all weapon-list-item ${
                    isSelected ? 'selected' : ''
                  }`}
                  style={{ 
                    imageRendering: 'pixelated',
                    backgroundColor: isSelected ? rarityColor : '#5a0000',
                    borderColor: rarityBorderColor,
                  }}
                >
                  <span className="text-white font-bold" style={{ fontSize: '20px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
                    {weapon.name.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
          
          {loading && (
            <div className="text-yellow-300 text-center mt-4 font-bold text-xl animate-pulse">
              LOADING INVENTORY...
            </div>
          )}
        </div>

        {/* Right side - Weapon details */}
        <div className="w-2/3 p-6 pt-20 flex flex-col items-center justify-start overflow-y-auto flex-shrink-0 relative weapons-scrollable" style={{ zIndex: 10 }}>
          {selectedWeapon ? (
            <>
              <h2 className="text-white mb-2 font-bold text-center" style={{ fontSize: '32px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
                {selectedWeapon.name.toUpperCase()}
              </h2>
              
              <div className="mb-4 mx-auto max-w-full px-4 text-center">
                <div className="inline-block bg-black/60 border-2 border-yellow-500/50 px-4 py-2 rounded max-w-full overflow-hidden">
                  <div className="text-yellow-300 text-xs font-bold font-mono whitespace-nowrap overflow-x-auto scrollbar-hide" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.8)' }}>
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
                  className="font-bold px-4 py-2 border-2 inline-block"
                  style={{
                    fontSize: '14px',
                    backgroundColor: getRarityColor(selectedWeapon.rarity),
                    borderColor: getRarityBorderColor(selectedWeapon.rarity),
                    color: '#ffffff',
                    textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
                  }}
                >
                  {selectedWeapon.rarity.toUpperCase()}
                </span>
                
                {selectedWeapon.id && !selectedWeapon.id.startsWith('default-') && (
                  <button
                    onClick={() => {
                      setRecipientAddress('');
                      setTransferError(null);
                      setTransferSuccess(false);
                      setShowTransferModal(true);
                    }}
                    className="bg-[#8b0000] hover:bg-[#a00000] text-white font-bold py-2 px-4 border-2 border-[#ff0000] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:shadow-none transition-all h-[38px] flex items-center"
                    style={{ fontSize: '14px', imageRendering: 'pixelated' }}
                  >
                    TRANSFER
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

              <div className="text-white w-full px-4" style={{ fontSize: '18px' }}>
                <div className="mb-3 p-3 border-4 border-white" style={{ backgroundColor: '#3a0000' }}>
                  <span className="text-gray-300">DAMAGE:</span> <span className="text-yellow-300 ml-2 font-bold">{selectedWeapon.baseDamage}</span>
                </div>
                <div className="mb-3 p-3 border-4 border-white" style={{ backgroundColor: '#3a0000' }}>
                  <span className="text-gray-300">FIRERATE:</span> <span className="text-yellow-300 ml-2 font-bold">{calculateFirerate(selectedWeapon.cooldown).toFixed(5)}</span>
                </div>
                {selectedWeapon.range && (
                  <div className="mb-3 p-3 border-4 border-white" style={{ backgroundColor: '#3a0000' }}>
                    <span className="text-gray-300">RANGE:</span> <span className="text-yellow-300 ml-2 font-bold">{selectedWeapon.range}</span>
                  </div>
                )}
                <div className="mt-4 p-3 border-4 border-white" style={{ backgroundColor: '#3a0000' }}>
                  <p className="text-cyan-300 font-bold" style={{ fontSize: '16px', lineHeight: '1.5' }}>
                    {selectedWeapon.description.toUpperCase()}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-gray-400 text-center" style={{ fontSize: '24px' }}>
              SELECT A WEAPON TO VIEW DETAILS
            </div>
          )}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 font-['Pixelify_Sans']">
          <div className="bg-[#3a0000] border-4 border-white p-8 max-w-md w-full mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]" style={{ imageRendering: 'pixelated' }}>
            <h3 className="text-white text-3xl font-bold mb-6 text-center border-b-4 border-white pb-4">TRANSFER NFT</h3>
            
            {transferSuccess ? (
              <div className="text-center py-4">
                <div className="text-green-400 text-2xl mb-4 font-bold">TRANSFER SUCCESSFUL!</div>
                <p className="text-white text-lg mb-6">The weapon has been sent to the recipient.</p>
              </div>
            ) : (
              <>
                <p className="text-white mb-6 text-lg text-center">
                  Enter the recipient's OneChain address below. 
                  <br/>
                  <span className="text-[#ff5555] font-bold mt-2 block">WARNING: THIS ACTION CANNOT BE UNDONE!</span>
                </p>
                
                <div className="mb-8">
                  <label className="block text-white text-lg font-bold mb-2">RECIPIENT ADDRESS</label>
                  <input
                    type="text"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-black border-4 border-white text-white p-4 focus:border-yellow-400 outline-none font-mono text-lg placeholder-gray-600"
                  />
                </div>

                {transferError && (
                  <div className="mb-6 text-[#ff5555] text-lg border-4 border-[#ff5555] bg-black/50 p-4 font-bold text-center">
                    {transferError}
                  </div>
                )}

                <div className="flex gap-6 justify-center">
                  <button
                    onClick={() => setShowTransferModal(false)}
                    className="bg-[#5a0000] hover:bg-[#7a0000] text-white font-bold py-3 px-8 border-4 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-1 hover:shadow-none transition-all"
                    disabled={isTransferring}
                    style={{ fontSize: '18px' }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleTransfer}
                    disabled={!recipientAddress || isTransferring}
                    className="bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 px-8 border-4 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-1 hover:shadow-none transition-all"
                    style={{ fontSize: '18px' }}
                  >
                    {isTransferring ? 'SENDING...' : 'CONFIRM'}
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

