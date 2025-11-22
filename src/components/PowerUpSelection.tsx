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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50" style={{ fontFamily: "'Press Start 2P', monospace" }}>
      <div className="bg-purple-900 border-4 border-white p-8 max-w-5xl" style={{ imageRendering: 'pixelated' }}>
        <h2 className="text-white text-center mb-6" style={{ fontSize: '20px' }}>LEVEL UP!</h2>
        <p className="text-white text-center mb-6" style={{ fontSize: '10px' }}>WAVE {wave} COMPLETE</p>

        <div className="flex gap-4 justify-center flex-wrap">
          {powerUps.map((powerUp, index) => (
            <button
              key={powerUp.id}
              onClick={() => onSelectPowerUp(powerUp)}
              className="bg-purple-800 hover:bg-purple-700 border-4 border-white p-4 w-56 transition-all"
              style={{ 
                imageRendering: 'pixelated',
                fontSize: '8px'
              }}
            >
              <div className="text-white mb-2" style={{ fontSize: '10px' }}>
                [{index + 1}]
              </div>
              <h3 className="text-white mb-3" style={{ fontSize: '10px' }}>{powerUp.name.toUpperCase()}</h3>
              <p className="text-gray-300" style={{ fontSize: '8px', lineHeight: '1.4' }}>{powerUp.description.toUpperCase()}</p>
            </button>
          ))}
        </div>

        <p className="text-white text-center mt-6" style={{ fontSize: '8px' }}>PRESS 1, 2, OR 3 TO SELECT</p>
      </div>
    </div>
  );
};

export default PowerUpSelection;
