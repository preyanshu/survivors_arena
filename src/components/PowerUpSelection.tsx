import { useEffect } from 'react';
import { PowerUp } from '../types/game';

interface PowerUpSelectionProps {
  powerUps: PowerUp[];
  onSelectPowerUp: (powerUp: PowerUp) => void;
  wave: number;
}

const PowerUpSelection = ({ powerUps, onSelectPowerUp, wave }: PowerUpSelectionProps) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === '1' && powerUps[0]) {
        onSelectPowerUp(powerUps[0]);
      } else if (key === '2' && powerUps[1]) {
        onSelectPowerUp(powerUps[1]);
      } else if (key === '3' && powerUps[2]) {
        onSelectPowerUp(powerUps[2]);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [powerUps, onSelectPowerUp]);

  const getPowerUpIcon = (id: string) => {
    const icons: { [key: string]: string } = {
      speed: '🏃',
      attack_speed: '💥',
      damage: '⚔️',
      max_health: '❤️',
      projectile_size: '📈',
      knockback: '🛡️',
      cooldown: '🔄',
      health_regen: '💚',
      // Ability icons
      ability_shield: '🛡️',
      ability_fire_ring: '🔥',
      ability_speed_boost: '⚡',
      ability_damage_boost: '💥',
      ability_freeze: '❄️',
    };
    return icons[id] || '⚡';
  };

  return (
    <>
      <style>{`
        .powerup-card {
          background-color: #5a0000;
        }
        .powerup-card:hover {
          background-color: #7a0000;
        }
      `}</style>
      <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
      <div className="border-4 border-white p-12 max-w-6xl shadow-2xl" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated' }}>
        <div className="text-center mb-8">
          <h2 className="text-white mb-4 font-bold" style={{ fontSize: '48px', textShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>LEVEL UP!</h2>
          <p className="text-yellow-300 font-bold" style={{ fontSize: '24px' }}>WAVE {wave} COMPLETE</p>
        </div>

        <div className="flex gap-6 justify-center flex-wrap">
          {powerUps.map((powerUp, index) => (
            <button
              key={powerUp.id}
              onClick={() => onSelectPowerUp(powerUp)}
              className="border-4 border-white p-6 w-72 transition-all shadow-lg hover:shadow-xl hover:scale-105 powerup-card"
              style={{ 
                imageRendering: 'pixelated'
              }}
            >
              <div className="text-center mb-3">
                <div className="text-5xl mb-2">{getPowerUpIcon(powerUp.id)}</div>
                <div className="text-yellow-300 font-bold mb-2" style={{ fontSize: '28px' }}>
                  [{index + 1}]
                </div>
              </div>
              <h3 className="text-white mb-4 font-bold text-center" style={{ fontSize: '18px' }}>{powerUp.name.toUpperCase()}</h3>
              <p className="text-cyan-300 font-bold text-center" style={{ fontSize: '14px', lineHeight: '1.5' }}>{powerUp.description.toUpperCase()}</p>
            </button>
          ))}
        </div>

        <p className="text-white text-center mt-8 font-bold" style={{ fontSize: '20px' }}>PRESS <span className="text-yellow-300">1</span>, <span className="text-yellow-300">2</span>, OR <span className="text-yellow-300">3</span> TO SELECT</p>
      </div>
    </div>
    </>
  );
};

export default PowerUpSelection;
