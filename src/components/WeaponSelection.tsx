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
    <div className="min-h-screen bg-black text-white" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
      <div className="text-center pt-8 pb-6">
        <h1 className="mb-4 text-white" style={{ fontSize: '28px' }}>CHOOSE A WEAPON FROM YOUR INVENTORY</h1>
      </div>

      <div className="flex flex-wrap gap-4 justify-center max-w-6xl mx-auto px-4">
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
      const size = 80;
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
      className="bg-purple-900 hover:bg-purple-800 border-4 border-white p-4 w-32 h-32 transition-all flex flex-col items-center justify-center"
      style={{ 
        imageRendering: 'pixelated'
      }}
    >
      <canvas
        ref={canvasRef}
        width={80}
        height={80}
        style={{ imageRendering: 'pixelated' }}
        className="mb-2"
      />
      <span className="text-white" style={{ fontSize: '8px' }}>
        {weapon.name.toUpperCase()}
      </span>
    </button>
  );
};

export default WeaponSelection;
