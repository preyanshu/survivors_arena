import { ACHIEVEMENTS } from '../data/achievements';

interface AchievementsProps {
  onBack: () => void;
}

const Achievements = ({ onBack }: AchievementsProps) => {
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
        
        <div className="overflow-y-auto flex-1 pr-4 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ACHIEVEMENTS.map((achievement) => (
              <div 
                key={achievement.id} 
                className="border-2 border-white/50 bg-black/40 p-4 flex gap-4 text-left hover:bg-black/60 transition-colors"
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
                    <h3 className="text-yellow-400 font-bold text-xl">{achievement.title}</h3>
                    <span className="text-gray-400 text-sm">Wave {achievement.waveRequirement}</span>
                  </div>
                  <p className="text-white/80 text-sm mb-2">{achievement.description}</p>
                  <div className="mt-auto pt-2 border-t border-white/20 flex justify-between items-center">
                    <span className="text-gray-500 text-xs font-bold">LOCKED</span>
                    <button 
                      disabled
                      className="px-3 py-1 bg-gray-700 text-gray-400 text-xs border border-gray-600 cursor-not-allowed opacity-50"
                    >
                      MINT NFT
                    </button>
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
