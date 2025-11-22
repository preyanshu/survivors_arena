import { Weapon } from '../types/game';
import { spriteManager } from '../utils/spriteManager';
import { useEffect, useRef } from 'react';

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
      const size = 120;
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
        className="bg-purple-900 border-4 border-white p-8 max-w-md"
        style={{ imageRendering: 'pixelated' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-white text-center mb-6" style={{ fontSize: '20px' }}>
          {weapon.name.toUpperCase()}
        </h2>

        <div className="flex justify-center mb-6">
          <canvas
            ref={canvasRef}
            width={150}
            height={150}
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <div className="text-white mb-6" style={{ fontSize: '10px' }}>
          <div className="mb-2">
            <span className="text-gray-300">DAMAGE:</span> <span className="text-yellow-300">{weapon.baseDamage}</span>
          </div>
          <div className="mb-2">
            <span className="text-gray-300">COOLDOWN:</span> <span className="text-yellow-300">{weapon.cooldown}MS</span>
          </div>
          {weapon.range && (
            <div className="mb-2">
              <span className="text-gray-300">RANGE:</span> <span className="text-yellow-300">{weapon.range}</span>
            </div>
          )}
          <div className="mt-4 text-gray-300" style={{ fontSize: '8px', lineHeight: '1.4' }}>
            {weapon.description.toUpperCase()}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-600 text-white border-4 border-white py-3 px-6 transition-all"
            style={{ fontSize: '10px', imageRendering: 'pixelated' }}
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="bg-green-700 hover:bg-green-600 text-white border-4 border-white py-3 px-6 transition-all"
            style={{ fontSize: '10px', imageRendering: 'pixelated' }}
          >
            CONFIRM
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeaponModal;

