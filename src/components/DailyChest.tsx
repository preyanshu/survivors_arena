import { useState, useEffect } from 'react';
import { Weapon } from '../types/game';
import { getRarityColor, getRarityBorderColor, calculateFirerate } from '../data/weapons';
import { 
  canOpenCrate, 
  getTimeUntilNextCrate, 
  saveLastCrateOpenTime,
  formatTimeRemaining,
  getRandomWeapon
} from '../utils/storage';
import { spriteManager } from '../utils/spriteManager';

interface DailyChestProps {
  onBack: () => void;
  onWeaponObtained: (weapon: Weapon) => void;
}

const DailyChest = ({ onBack, onWeaponObtained }: DailyChestProps) => {
  const [canOpen, setCanOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [openedWeapon, setOpenedWeapon] = useState<Weapon | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [spritesLoaded, setSpritesLoaded] = useState(false);

  const handleBack = () => {
    setOpenedWeapon(null); // Reset opened weapon when going back
    onBack();
  };

  useEffect(() => {
    spriteManager.loadSprites().then(() => {
      setSpritesLoaded(true);
    });
  }, []);

  useEffect(() => {
    const checkCrateStatus = () => {
      const canOpenNow = canOpenCrate();
      setCanOpen(canOpenNow);
      
      if (!canOpenNow) {
        const timeUntilNext = getTimeUntilNextCrate();
        setTimeRemaining(formatTimeRemaining(timeUntilNext));
      }
    };

    checkCrateStatus();
    const interval = setInterval(checkCrateStatus, 1000); // Update every second for better UX

    return () => clearInterval(interval);
  }, []);

  const handleOpenCrate = () => {
    if (!canOpen || isOpening) return;

    setIsOpening(true);
    
    // Simulate opening animation delay
    setTimeout(() => {
      const randomWeapon = getRandomWeapon();
      setOpenedWeapon(randomWeapon);
      saveLastCrateOpenTime();
      onWeaponObtained(randomWeapon);
      setCanOpen(false);
      setIsOpening(false);
    }, 1500);
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
                <button
                  onClick={handleOpenCrate}
                  disabled={isOpening}
                  className="bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white border-4 border-white py-6 px-12 transition-all font-bold"
                  style={{ fontSize: '24px', imageRendering: 'pixelated' }}
                >
                  {isOpening ? 'OPENING...' : 'OPEN CHEST'}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <p className="text-gray-300 mb-6" style={{ fontSize: '18px' }}>
                  YOU HAVE ALREADY OPENED YOUR DAILY CHEST
                </p>
                <p className="text-yellow-300 mb-6 font-bold" style={{ fontSize: '20px' }}>
                  NEXT CHEST AVAILABLE IN: {timeRemaining}
                </p>
              </div>
            )}
            <button
              onClick={handleBack}
              className="bg-red-700 hover:bg-red-600 text-white border-4 border-white py-4 px-8 transition-all font-bold mt-6"
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

