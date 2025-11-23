import { useState, useEffect } from 'react';
import { useOneWallet } from '../contexts/WalletContext';
import { ACHIEVEMENTS } from '../data/achievements';
import { Achievement } from '../types/game';

interface AchievementsProps {
  onBack: () => void;
}

const PACKAGE_ID = '0x1c6ffbfbb6802ce3fc34265c255c3768883ec8e93b9268fea738912c3817ac1a';

interface OwnedAchievement {
  id: string;
  title: string;
  description: string;
  waveRequirement: number;
  image: string;
  nftId: string;
  mintedAt: number;
}

const Achievements = ({ onBack }: AchievementsProps) => {
  const { connected, address, client } = useOneWallet();
  const [ownedAchievements, setOwnedAchievements] = useState<OwnedAchievement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAchievements = async () => {
      if (!connected || !address || !client) {
        setOwnedAchievements([]);
        return;
      }

      setLoading(true);
      try {
        const type = `${PACKAGE_ID}::achievement_nft::AchievementNFT`;
        let hasNextPage = true;
        let nextCursor = null;
        const fetched: OwnedAchievement[] = [];

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
              const fields = obj.data.content.fields as any;
              if (fields.achievement_id) {
                fetched.push({
                  id: fields.achievement_id,
                  title: fields.title || '',
                  description: fields.description || '',
                  waveRequirement: Number(fields.wave_requirement) || 0,
                  image: fields.image_url || '',
                  nftId: obj.data.objectId,
                  mintedAt: Number(fields.minted_at) || 0,
                });
              }
            }
          }

          hasNextPage = response.hasNextPage;
          nextCursor = response.nextCursor;
        }

        setOwnedAchievements(fetched);
      } catch (e) {
        console.error("Error fetching achievements:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, [connected, address, client]);

  // Only show owned achievements
  const displayedAchievements = ownedAchievements.map(owned => {
    // Find matching achievement data for image and other metadata
    const achievementData = ACHIEVEMENTS.find(a => a.id === owned.id);
    return {
      ...owned,
      image: owned.image || achievementData?.image || '',
    };
  });

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
        onClick={onBack}
        className="absolute top-6 left-6 border-4 border-white py-3 px-8 text-white font-bold bg-[#5a0000] hover:bg-[#7a0000] transition-all"
        style={{ 
          fontSize: '18px',
          imageRendering: 'pixelated',
          zIndex: 20
        }}
      >
        ← BACK
      </button>

      <div className="border-4 border-white p-8 text-center relative max-w-6xl w-full mx-4 h-[80vh] flex flex-col" style={{ backgroundColor: 'rgba(58, 0, 0, 0.9)', imageRendering: 'pixelated', zIndex: 10 }}>
        <h1 className="text-white mb-8 font-bold" style={{ fontSize: '48px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>ACHIEVEMENTS</h1>
        
        {loading && (
          <div className="text-yellow-300 text-xl font-bold mb-4 animate-pulse">LOADING ACHIEVEMENTS...</div>
        )}

        {!connected && (
          <div className="text-gray-400 text-lg font-bold mb-4">Connect your wallet to view achievements</div>
        )}

        <div className="overflow-y-auto flex-1 pr-4 custom-scrollbar">
          {displayedAchievements.length === 0 && !loading && connected && (
            <div className="text-gray-400 text-lg font-bold text-center py-8">
              No achievements owned yet. Play the game to unlock achievements!
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedAchievements.map((achievement) => (
              <div 
                key={achievement.id} 
                className="border-2 border-yellow-500 bg-yellow-900/20 p-4 flex gap-4 text-left hover:bg-black/60 transition-colors"
              >
                <div className="w-24 h-24 flex-shrink-0 border-2 border-white/30 bg-black/50">
                  <img 
                    src={achievement.image} 
                    alt={achievement.title} 
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <div className="flex flex-col flex-1 gap-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xl text-yellow-400">
                      {achievement.title}
                    </h3>
                    <span className="text-gray-400 text-sm">Wave {achievement.waveRequirement}</span>
                  </div>
                  <p className="text-white/80 text-sm mb-2">{achievement.description}</p>
                  <div className="mt-auto pt-2 border-t border-white/20 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-green-400 text-xs font-bold">OWNED</span>
                    </div>
                    <div className="text-gray-300 text-xs break-all">
                      NFT ID: {achievement.nftId}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #5a0000;
          border: 1px solid white;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #7a0000;
        }
      `}</style>
    </div>
  );
};

export default Achievements;
