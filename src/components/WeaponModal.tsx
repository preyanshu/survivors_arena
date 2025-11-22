import { Weapon } from '../types/game';
import { spriteManager } from '../utils/spriteManager';
import { useEffect, useRef } from 'react';
import { getRarityColor, getRarityBorderColor, calculateFirerate } from '../data/weapons';

interface WeaponModalProps {
  weapon: Weapon | null;
  onConfirm: () => void;
  onClose: () => void;
}

const WeaponModal = ({ weapon, onConfirm, onClose }: WeaponModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!weapon || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw weapon sprite
    const spriteName = `weapon_${weapon.type}`;
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
  }, [weapon]);

  if (!weapon) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
      style={{ fontFamily: "'Pixelify Sans', sans-serif" }}
      onClick={onClose}
    >
      <div 
        className="border-4 p-8 max-w-lg"
        style={{ 
          backgroundColor: getRarityColor(weapon.rarity), 
          borderColor: getRarityBorderColor(weapon.rarity),
          imageRendering: 'pixelated' 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white text-center mb-2" style={{ fontSize: '32px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
          {weapon.name.toUpperCase()}
        </h2>
        <div className="text-center mb-6">
          <span 
            className="font-bold px-4 py-2 border-2 inline-block"
            style={{
              fontSize: '14px',
              backgroundColor: getRarityColor(weapon.rarity),
              borderColor: getRarityBorderColor(weapon.rarity),
              color: '#ffffff',
              textShadow: '2px 2px 0px rgba(0,0,0,0.8)',
            }}
          >
            {weapon.rarity.toUpperCase()}
          </span>
        </div>

        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            width={360}
            height={360}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="text-white mb-6" style={{ fontSize: '18px' }}>
          <div className="mb-3">
            <span className="text-gray-300">DAMAGE:</span> <span className="text-yellow-300 ml-2">{weapon.baseDamage}</span>
          </div>
          <div className="mb-3">
            <span className="text-gray-300">FIRERATE:</span> <span className="text-yellow-300 ml-2">{calculateFirerate(weapon.cooldown).toFixed(5)}</span>
          </div>
          {weapon.range && (
            <div className="mb-3">
              <span className="text-gray-300">RANGE:</span> <span className="text-yellow-300 ml-2">{weapon.range}</span>
            </div>
          )}
          <div className="mt-6 text-cyan-300 font-bold" style={{ fontSize: '16px', lineHeight: '1.6' }}>
            {weapon.description.toUpperCase()}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white border-4 border-white py-4 px-8 transition-all"
            style={{ fontSize: '16px', imageRendering: 'pixelated' }}
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="bg-green-700 hover:bg-green-600 text-white border-4 border-white py-4 px-8 transition-all"
            style={{ fontSize: '16px', imageRendering: 'pixelated' }}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeaponModal;

