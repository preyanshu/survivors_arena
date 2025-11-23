import { useState, useEffect } from 'react';
import { useOneWallet } from '../contexts/WalletContext';
import { ACHIEVEMENTS } from '../data/achievements';
import { Achievement } from '../types/game';
import { Transaction } from '@onelabs/sui/transactions';

interface GameOverProps {
  wave: number;
  onReturnToMenu: () => void;
}

const PACKAGE_ID = '0x1c6ffbfbb6802ce3fc34265c255c3768883ec8e93b9268fea738912c3817ac1a';
const CLOCK_ID = '0x6';

const GameOver = ({ wave, onReturnToMenu }: GameOverProps) => {
  // Calculate survived waves: if you die during wave 1, you've survived 0 waves
  // If you die during wave 2, you've survived 1 wave, etc.
  const survivedWaves = Math.max(0, wave - 1);
  
  const { connected, address, client, executeTransaction } = useOneWallet();
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [checkingAchievement, setCheckingAchievement] = useState(false);
  const [minting, setMinting] = useState(false);
  const [minted, setMinted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAchievements = async () => {
      if (!connected || !address || !client) return;

      setCheckingAchievement(true);
      
      // Find all achievements met by current performance
      const unlockedAchievements = ACHIEVEMENTS.filter(a => survivedWaves >= a.waveRequirement);
      
      // Sort by difficulty (wave requirement descending) to find the best one
      unlockedAchievements.sort((a, b) => b.waveRequirement - a.waveRequirement);

      if (unlockedAchievements.length === 0) {
        setCheckingAchievement(false);
        return;
      }

      // Check if user already owns these achievements
      // We'll check the highest tier one first. If they don't have it, offer it.
      try {
        let bestUnownedAchievement: Achievement | null = null;

        // We need to fetch owned objects and check their content/type
        const type = `${PACKAGE_ID}::achievement_nft::AchievementNFT`;
        
        let hasNextPage = true;
        let nextCursor = null;
        let ownedAchievementIds = new Set<string>();

        while (hasNextPage) {
          const response: any = await client.getOwnedObjects({
            owner: address,
            filter: { StructType: type },
            options: { showContent: true },
            cursor: nextCursor,
          });

          const data = response.data;
          if (!data || data.length === 0) {
            hasNextPage = false;
            break;
          }

          for (const obj of data) {
            if (obj.data?.content?.dataType === 'moveObject') {
               // The field name in Move struct is 'achievement_id'
               const fields = obj.data.content.fields as any;
               if (fields.achievement_id) {
                 ownedAchievementIds.add(fields.achievement_id);
               }
            }
          }

          hasNextPage = response.hasNextPage;
          nextCursor = response.nextCursor;
        }

        // Find the highest unlocked achievement that is NOT in ownedAchievementIds
        for (const ach of unlockedAchievements) {
          if (!ownedAchievementIds.has(ach.id)) {
            bestUnownedAchievement = ach;
            break; // Found the best one
          }
        }

        setNewAchievement(bestUnownedAchievement);

      } catch (e) {
        console.error("Error checking achievements:", e);
      } finally {
        setCheckingAchievement(false);
      }
    };

    checkAchievements();
  }, [connected, address, client, survivedWaves]);

  const handleMint = async () => {
    if (!newAchievement || !address || !executeTransaction) return;
    
    setMinting(true);
    setError(null);
    
    try {
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${PACKAGE_ID}::achievement_nft::mint_achievement`,
        arguments: [
          tx.pure.string(newAchievement.id),
          tx.pure.string(newAchievement.title),
          tx.pure.string(newAchievement.description),
          tx.pure.u64(newAchievement.waveRequirement),
          tx.pure.string(newAchievement.image),
          tx.object(CLOCK_ID)
        ]
      });

      await executeTransaction(tx);
      setMinted(true);
      // Keep newAchievement visible but show success state
    } catch (e: any) {
      console.error("Mint failed:", e);
      setError(e.message || "Failed to mint achievement");
    } finally {
      setMinting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 pointer-events-auto" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
      <div className="border-4 border-white p-8 text-center shadow-2xl" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated', minWidth: '500px' }}>
        <h2 className="text-white mb-4 font-bold" style={{ fontSize: '48px', textShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>GAME OVER</h2>
        <p className="text-gray-300 mb-4 font-bold" style={{ fontSize: '20px' }}>
          YOU SURVIVED {survivedWaves} WAVE{survivedWaves !== 1 ? 'S' : ''}
        </p>

        {/* Achievement Section */}
        {checkingAchievement && (
          <div className="text-yellow-300 mb-4 animate-pulse text-xl font-bold">CHECKING ACHIEVEMENTS...</div>
        )}

        {newAchievement && !minted && (
          <>
            <h3 className="text-yellow-400 text-2xl mb-3 font-bold animate-pulse" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.8)' }}>
              NEW ACHIEVEMENT UNLOCKED!
            </h3>
            
            <div className="flex flex-col items-center gap-3 mb-4">
              {newAchievement.image && (
                 <img 
                   src={newAchievement.image} 
                   alt={newAchievement.title}
                   className="w-32 h-32 object-cover border-4 border-white shadow-lg"
                   style={{ imageRendering: 'pixelated' }}
                 />
              )}
              <div className="text-center">
                <div className="text-white text-2xl font-bold mb-1" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.8)' }}>
                  {newAchievement.title}
                </div>
                <div className="text-gray-300 text-lg font-bold">
                  {newAchievement.description}
                </div>
              </div>
              
              <button
                onClick={handleMint}
                disabled={minting}
                className={`mt-2 border-4 border-yellow-500 py-2 px-6 text-yellow-300 font-bold transition-all ${minting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-yellow-900 hover:text-white hover:scale-105'}`}
                style={{ fontSize: '18px', backgroundColor: '#000000', textShadow: '2px 2px 0px rgba(0,0,0,0.5)' }}
              >
                {minting ? 'MINTING...' : 'MINT ACHIEVEMENT NFT'}
              </button>
              {error && <div className="text-red-500 text-base font-bold mt-1">{error}</div>}
            </div>
          </>
        )}

        {minted && (
           <>
             <h3 className="text-green-400 text-2xl font-bold mb-1" style={{ textShadow: '3px 3px 0px rgba(0,0,0,0.8)' }}>
               ACHIEVEMENT MINTED!
             </h3>
             <p className="text-white text-lg font-bold mb-4">Check achievements section!</p>
           </>
        )}

        <button
          onClick={onReturnToMenu}
          className="bg-red-700 hover:bg-red-600 text-white border-4 border-white py-3 px-10 transition-all font-bold shadow-lg hover:shadow-xl"
          style={{ 
            fontSize: '18px',
            imageRendering: 'pixelated'
          }}
        >
          RETURN TO MENU
        </button>
      </div>
    </div>
  );
};

export default GameOver;
