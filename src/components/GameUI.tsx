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
          50% { opacity: 0.3; }
        }
        .low-ammo-text {
          animation: blinkText 0.6s ease-in-out infinite;
        }
      `}</style>
      <div className="fixed top-0 left-0 right-0 p-3 pointer-events-none z-10" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
        <div className="max-w-7xl mx-auto flex justify-between items-start gap-4">
          <div className="flex flex-col gap-2">
          <div className="hud-panel p-3 relative" style={{ imageRendering: 'pixelated' }}>
            <div className="hud-corner hud-corner-tl"></div>
            <div className="hud-corner hud-corner-tr"></div>
            <div className="hud-corner hud-corner-bl"></div>
            <div className="hud-corner hud-corner-br"></div>
            <div className="flex items-center gap-2 hud-text-success mb-2 font-bold" style={{ fontSize: '16px' }}>
              <img src="/assets/health.png" alt="Health" className="w-5 h-5" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 2px rgba(0, 255, 136, 0.6))' }} />
              <span>HP: {Math.ceil(playerStats.health)}/{playerStats.maxHealth}</span>
              {playerStats.blueHealth > 0 && (
                <span className="hud-text-accent">+{Math.ceil(playerStats.blueHealth)}</span>
              )}
            </div>
            {/* Blue health bar (vest/armor) */}
            {playerStats.blueHealth > 0 && (
              <div className="w-48 h-3 hud-health-bar mb-1" style={{ imageRendering: 'pixelated' }}>
                <div
                  className="hud-health-fill transition-all duration-200"
                  style={{ 
                    width: `${Math.min(100, (playerStats.blueHealth / 120) * 100)}%`,
                    imageRendering: 'pixelated',
                    background: 'linear-gradient(90deg, #00c8ff 0%, #0088ff 100%)'
                  }}
                />
              </div>
            )}
            {/* Green health bar */}
            <div className="w-48 h-5 hud-health-bar" style={{ imageRendering: 'pixelated' }}>
              <div
                className="hud-health-fill transition-all duration-200"
                style={{ 
                  width: `${Math.max(0, healthPercentage)}%`,
                  imageRendering: 'pixelated'
                }}
              />
            </div>
          </div>
            
            {showAmmo && (
              <div className="hud-panel p-3 relative" style={{ imageRendering: 'pixelated' }}>
                <div className="hud-corner hud-corner-tl"></div>
                <div className="hud-corner hud-corner-tr"></div>
                <div className="hud-corner hud-corner-bl"></div>
                <div className="hud-corner hud-corner-br"></div>
                <div className="flex items-center gap-2 hud-text-warning font-bold" style={{ fontSize: '16px' }}>
                  <img src="/assets/ammo.png" alt="Ammo" className="w-5 h-5" style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 0 2px rgba(255, 170, 0, 0.6))' }} />
                  <span>AMMO: {currentAmmo}/{maxAmmo}</span>
                </div>
                {/* Ammo bar */}
                <div className="w-48 h-3 hud-ammo-bar mt-2" style={{ imageRendering: 'pixelated' }}>
                  <div
                    className="hud-ammo-fill transition-all duration-200"
                    style={{ 
                      width: `${Math.max(0, ammoPercentage)}%`,
                      imageRendering: 'pixelated'
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="hud-panel p-4 text-center relative" style={{ imageRendering: 'pixelated' }}>
            <div className="hud-corner hud-corner-tl"></div>
            <div className="hud-corner hud-corner-tr"></div>
            <div className="hud-corner hud-corner-bl"></div>
            <div className="hud-corner hud-corner-br"></div>
            <div className="flex items-center justify-center gap-2 hud-text-warning mb-2 font-bold" style={{ fontSize: '20px' }}>
              <PixelIcon name="star" size={24} />
              <span>WAVE {wave}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-center gap-2 hud-text-accent font-bold" style={{ fontSize: '14px' }}>
                <PixelIcon name="circle-notch" size={16} />
                <span>{enemiesRemaining} REMAINING</span>
              </div>
              <div className="flex items-center justify-center gap-2 hud-text font-bold" style={{ fontSize: '14px' }}>
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
              className="hud-text-danger font-bold text-center"
              style={{ 
                fontSize: '48px',
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
