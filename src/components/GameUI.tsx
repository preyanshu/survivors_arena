import { PlayerStats } from '../types/game';
import { PixelIcon } from '../utils/pixelIcons';

interface GameUIProps {
  playerStats: PlayerStats;
  wave: number;
  enemiesRemaining: number;
  enemiesKilled: number;
  targetEnemies: number;
  currentAmmo?: number;
  maxAmmo?: number;
  weaponType?: string;
}

const GameUI = ({ playerStats, wave, enemiesRemaining, enemiesKilled, targetEnemies, currentAmmo, maxAmmo, weaponType }: GameUIProps) => {
  const healthPercentage = (playerStats.health / playerStats.maxHealth) * 100;
  const showAmmo = weaponType !== 'sword' && currentAmmo !== undefined && maxAmmo !== undefined;
  const ammoPercentage = showAmmo ? (currentAmmo / maxAmmo) * 100 : 100;
  const isLowAmmo = showAmmo && currentAmmo !== undefined && maxAmmo !== undefined && (currentAmmo / maxAmmo) < 0.25;

  return (
    <>
      <style>{`
        @keyframes blinkText {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
        .low-ammo-text {
          animation: blinkText 0.6s ease-in-out infinite;
        }
      `}</style>
      <div className="fixed top-0 left-0 right-0 p-3 pointer-events-none z-10" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto flex justify-between items-start gap-4">
          <div className="flex flex-col gap-2">
          <div className="bg-opacity-95 p-3 border-3 border-white shadow-xl" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated' }}>
            <div className="flex items-center gap-2 text-white mb-2 font-bold" style={{ fontSize: '16px' }}>
              <img src="/assets/health.png" alt="Health" className="w-5 h-5" style={{ imageRendering: 'pixelated' }} />
              <span>HP: {Math.ceil(playerStats.health)}/{playerStats.maxHealth}</span>
              {playerStats.blueHealth > 0 && (
                <span className="text-blue-400">+{Math.ceil(playerStats.blueHealth)}</span>
              )}
            </div>
            {/* Blue health bar (vest/armor) */}
            {playerStats.blueHealth > 0 && (
              <div className="w-48 h-3 bg-gray-800 border-2 border-gray-600 overflow-hidden shadow-inner mb-1" style={{ imageRendering: 'pixelated' }}>
                <div
                  className="h-full bg-blue-500 transition-all duration-200 shadow-lg"
                  style={{ 
                    width: `${Math.min(100, (playerStats.blueHealth / 60) * 100)}%`,
                    imageRendering: 'pixelated',
                    boxShadow: 'inset 0 0 6px rgba(0, 136, 255, 0.5)'
                  }}
                />
              </div>
            )}
            {/* Green health bar */}
            <div className="w-48 h-5 bg-gray-800 border-3 border-gray-600 overflow-hidden shadow-inner" style={{ imageRendering: 'pixelated' }}>
              <div
                className="h-full bg-green-600 transition-all duration-200 shadow-lg"
                style={{ 
                  width: `${Math.max(0, healthPercentage)}%`,
                  imageRendering: 'pixelated',
                  boxShadow: 'inset 0 0 8px rgba(0, 255, 0, 0.5)'
                }}
              />
            </div>
          </div>
            
            {showAmmo && (
              <div className="bg-opacity-95 p-3 border-3 border-white shadow-xl" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated' }}>
                <div className="flex items-center gap-2 text-white font-bold" style={{ fontSize: '16px' }}>
                  <img src="/assets/ammo.png" alt="Ammo" className="w-5 h-5" style={{ imageRendering: 'pixelated' }} />
                  <span>AMMO: {currentAmmo}/{maxAmmo}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-opacity-95 p-4 border-3 border-white text-center shadow-xl" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated' }}>
            <div className="flex items-center justify-center gap-2 text-yellow-300 mb-2 font-bold" style={{ fontSize: '20px' }}>
              <PixelIcon name="star" size={24} />
              <span>WAVE {wave}</span>
            </div>
            <div className="flex flex-col gap-1.5 text-white">
              <div className="flex items-center justify-center gap-2 font-bold" style={{ fontSize: '14px' }}>
                <PixelIcon name="circle-notch" size={16} />
                <span>{enemiesRemaining} REMAINING</span>
              </div>
              <div className="flex items-center justify-center gap-2 font-bold" style={{ fontSize: '14px' }}>
                <PixelIcon name="bolt" size={16} />
                <span>{enemiesKilled}/{targetEnemies} KILLED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Low Ammo Warning - Center Screen */}
      {isLowAmmo && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
          <div className="low-ammo-text">
            <div 
              className="text-red-500 font-bold text-center"
              style={{ 
                fontSize: '48px',
                textShadow: '4px 4px 0px rgba(0,0,0,0.8), 0 0 20px rgba(255, 0, 0, 0.8)',
                imageRendering: 'pixelated'
              }}
            >
              LOW ON AMMO
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameUI;
