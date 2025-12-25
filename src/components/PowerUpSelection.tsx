import { useEffect } from 'react';
import { PowerUp } from '../types/game';
import { PixelIcon } from '../utils/pixelIcons';

interface PowerUpSelectionProps {
  powerUps: PowerUp[];
  onSelectPowerUp: (powerUp: PowerUp) => void;
  wave: number;
}

const PowerUpSelection = ({ powerUps, onSelectPowerUp, wave }: PowerUpSelectionProps) => {
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if modal is visible (prevent conflicts with other key handlers)
      const key = e.key;
      
      if (key === '1' && powerUps[0]) {
        e.preventDefault();
        e.stopPropagation();
        onSelectPowerUp(powerUps[0]);
      } else if (key === '2' && powerUps[1]) {
        e.preventDefault();
        e.stopPropagation();
        onSelectPowerUp(powerUps[1]);
      } else if (key === '3' && powerUps[2]) {
        e.preventDefault();
        e.stopPropagation();
        onSelectPowerUp(powerUps[2]);
      }
    };

    // Use capture phase to ensure we catch the event early
    window.addEventListener('keydown', handleKeyPress, true);
    return () => window.removeEventListener('keydown', handleKeyPress, true);
  }, [powerUps, onSelectPowerUp]);

  const getPowerUpIcon = (id: string) => {
    const icons: { [key: string]: string } = {
      attack_speed: 'bolt',
      damage: 'star',
      max_health: 'heart',
      knockback: 'arrow-up',
      cooldown: 'refresh',
      // Ability icons
      ability_shield: 'lock-alt',
      ability_fire_ring: 'fire',
      ability_speed_boost: 'bolt',
      ability_damage_boost: 'star',
      ability_freeze: 'circle-notch',
    };
    return icons[id] || 'bolt';
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
      <div className="hud-panel p-12 max-w-6xl shadow-2xl relative" style={{ imageRendering: 'pixelated' }}>
        <div className="hud-corner hud-corner-tl"></div>
        <div className="hud-corner hud-corner-tr"></div>
        <div className="hud-corner hud-corner-bl"></div>
        <div className="hud-corner hud-corner-br"></div>
        <div className="text-center mb-8">
          <h2 className="hud-text-success mb-4 font-bold" style={{ fontSize: '48px' }}>LEVEL UP!</h2>
          <p className="hud-text-warning font-bold" style={{ fontSize: '24px' }}>WAVE {wave} COMPLETE</p>
        </div>

        <div className="flex gap-6 justify-center flex-wrap">
          {powerUps.map((powerUp, index) => (
            <button
              key={powerUp.id}
              onClick={() => onSelectPowerUp(powerUp)}
              className="hud-panel p-6 w-72 transition-all relative hover:scale-105"
              style={{ 
                imageRendering: 'pixelated',
                borderColor: 'rgba(0, 200, 255, 0.5)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 200, 255, 0.9)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 200, 255, 0.4), inset 0 0 15px rgba(0, 200, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0, 200, 255, 0.5)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div className="hud-corner hud-corner-tl"></div>
              <div className="hud-corner hud-corner-tr"></div>
              <div className="hud-corner hud-corner-bl"></div>
              <div className="hud-corner hud-corner-br"></div>
              <div className="text-center mb-3">
                <div className="mb-2 flex justify-center items-center" style={{ minHeight: '48px' }}>
                  <div style={{ filter: 'drop-shadow(0 0 3px rgba(0, 200, 255, 0.6))' }}>
                    <PixelIcon name={getPowerUpIcon(powerUp.id)} size={48} />
                  </div>
                </div>
                <div className="hud-text-warning font-bold mb-2" style={{ fontSize: '28px' }}>
                  [{index + 1}]
                </div>
              </div>
              <h3 className="hud-text mb-4 font-bold text-center" style={{ fontSize: '18px' }}>{powerUp.name.toUpperCase()}</h3>
              <p className="hud-text-accent font-bold text-center" style={{ fontSize: '14px', lineHeight: '1.5' }}>{powerUp.description.toUpperCase()}</p>
            </button>
          ))}
        </div>

        <p className="hud-text text-center mt-8 font-bold" style={{ fontSize: '20px' }}>PRESS <span className="hud-text-warning">1</span>, <span className="hud-text-warning">2</span>, OR <span className="hud-text-warning">3</span> TO SELECT</p>
      </div>
    </div>
    </>
  );
};

export default PowerUpSelection;
