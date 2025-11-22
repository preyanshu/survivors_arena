import { useState, useEffect, useRef } from 'react';
import { Weapon } from '../types/game';
import { getRarityColor, getRarityBorderColor } from '../data/weapons';
import { spriteManager } from '../utils/spriteManager';
import WeaponModal from './WeaponModal';

interface WeaponSelectionProps {
  onSelectWeapon: (weapon: Weapon) => void;
  onBack?: () => void;
  availableWeapons: Weapon[];
}

const WeaponSelection = ({ onSelectWeapon, onBack, availableWeapons }: WeaponSelectionProps) => {
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [spritesLoaded, setSpritesLoaded] = useState(false);

  useEffect(() => {
    spriteManager.loadSprites().then(() => {
      setSpritesLoaded(true);
    });
  }, []);

  const handleWeaponClick = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
  };

  const handleConfirm = () => {
    if (selectedWeapon) {
      onSelectWeapon(selectedWeapon);
    }
  };

  const handleCloseModal = () => {
    setSelectedWeapon(null);
  };

  return (
    <>
      <style>{`
        .weapon-card {
          background-color: #5a0000;
        }
        .weapon-card:hover {
          background-color: #7a0000;
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
      <div className="h-screen w-screen bg-black text-white flex flex-col relative overflow-hidden" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
      {/* Background image */}
      <img
        src="/assets/sprites/image copy 3.png"
        alt="Background"
        className="absolute inset-0 w-screen h-screen object-cover pointer-events-none"
        style={{ imageRendering: 'pixelated', zIndex: 0 }}
      />
      
      {/* Back button */}
      {onBack && (
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
      )}
      <div className="text-center pt-24 pb-8 relative flex-shrink-0" style={{ zIndex: 10 }}>
        <h1 className="mb-4 text-white" style={{ fontSize: '40px' }}>CHOOSE A WEAPON FROM YOUR INVENTORY</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-8 relative weapons-scrollable" style={{ zIndex: 10, minHeight: 0 }}>
        <div className="grid grid-cols-4 justify-items-center max-w-6xl mx-auto px-8" style={{ gap: '1rem 0.25rem' }}>
          {availableWeapons.map((weapon) => (
            <WeaponCard
              key={`${weapon.type}-${weapon.rarity}`}
              weapon={weapon}
              onClick={() => handleWeaponClick(weapon)}
              spritesLoaded={spritesLoaded}
            />
          ))}
        </div>
      </div>

      <WeaponModal
        weapon={selectedWeapon}
        onConfirm={handleConfirm}
        onClose={handleCloseModal}
      />
    </div>
    </>
  );
};

interface WeaponCardProps {
  weapon: Weapon;
  onClick: () => void;
  spritesLoaded: boolean;
}

const WeaponCard = ({ weapon, onClick, spritesLoaded }: WeaponCardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!spritesLoaded || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw weapon sprite
    const spriteName = `weapon_${weapon.type}`;
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
  }, [weapon, spritesLoaded]);

  const rarityColor = getRarityColor(weapon.rarity);
  const rarityBorderColor = getRarityBorderColor(weapon.rarity);

  return (
    <button
      onClick={onClick}
      className="border-4 p-6 w-64 h-64 transition-all flex flex-col items-center justify-center weapon-card"
      style={{ 
        imageRendering: 'pixelated',
        backgroundColor: rarityColor,
        borderColor: rarityBorderColor,
      }}
    >
      <canvas
        ref={canvasRef}
        width={240}
        height={240}
        style={{ imageRendering: 'pixelated' }}
        className="mb-3"
      />
      <span className="text-white font-bold" style={{ fontSize: '14px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
        {weapon.name.toUpperCase()}
      </span>
    </button>
  );
};

export default WeaponSelection;
