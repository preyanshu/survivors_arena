import { useState, useEffect, useRef } from 'react';
import { Weapon } from '../types/game';
import { WEAPONS } from '../data/weapons';
import { spriteManager } from '../utils/spriteManager';
import WeaponModal from './WeaponModal';

interface WeaponSelectionProps {
  onSelectWeapon: (weapon: Weapon) => void;
}

const WeaponSelection = ({ onSelectWeapon }: WeaponSelectionProps) => {
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
    <div className="min-h-screen bg-black text-white flex flex-col" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
      <div className="text-center pt-24 pb-8">
        <h1 className="mb-4 text-white" style={{ fontSize: '40px' }}>CHOOSE A WEAPON FROM YOUR INVENTORY</h1>
      </div>

      <div className="flex flex-wrap gap-6 justify-center max-w-6xl mx-auto px-4 flex-grow items-start">
        {WEAPONS.map((weapon) => (
          <WeaponCard
            key={weapon.type}
            weapon={weapon}
            onClick={() => handleWeaponClick(weapon)}
            spritesLoaded={spritesLoaded}
          />
        ))}
      </div>

      <WeaponModal
        weapon={selectedWeapon}
        onConfirm={handleConfirm}
        onClose={handleCloseModal}
      />
    </div>
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

  return (
    <button
      onClick={onClick}
      className="bg-purple-900 hover:bg-purple-800 border-4 border-white p-6 w-64 h-64 transition-all flex flex-col items-center justify-center"
      style={{ 
        imageRendering: 'pixelated'
      }}
    >
      <canvas
        ref={canvasRef}
        width={240}
        height={240}
        style={{ imageRendering: 'pixelated' }}
        className="mb-3"
      />
      <span className="text-white" style={{ fontSize: '16px' }}>
        {weapon.name.toUpperCase()}
      </span>
    </button>
  );
};

export default WeaponSelection;
