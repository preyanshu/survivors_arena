import { PlayerStats } from '../types/game';

interface GameUIProps {
  playerStats: PlayerStats;
  wave: number;
  enemiesRemaining: number;
  enemiesKilled: number;
  targetEnemies: number;
}

const GameUI = ({ playerStats, wave, enemiesRemaining, enemiesKilled, targetEnemies }: GameUIProps) => {
  const healthPercentage = (playerStats.health / playerStats.maxHealth) * 100;

  return (
    <div className="fixed top-0 left-0 right-0 p-2 pointer-events-none z-10" style={{ fontFamily: "'Press Start 2P', monospace" }}>
      <div className="max-w-6xl mx-auto flex justify-between items-start">
        <div className="bg-purple-900 bg-opacity-95 p-3 border-4 border-white" style={{ imageRendering: 'pixelated' }}>
          <div className="text-white text-xs mb-2" style={{ fontSize: '10px' }}>
            HP: {Math.ceil(playerStats.health)}/{playerStats.maxHealth}
          </div>
          <div className="w-48 h-6 bg-gray-800 border-2 border-gray-600 overflow-hidden" style={{ imageRendering: 'pixelated' }}>
            <div
              className="h-full bg-red-600 transition-all duration-200"
              style={{ 
                width: `${Math.max(0, healthPercentage)}%`,
                imageRendering: 'pixelated'
              }}
            />
          </div>
        </div>

        <div className="bg-purple-900 bg-opacity-95 p-3 border-4 border-white text-center" style={{ imageRendering: 'pixelated' }}>
          <div className="text-yellow-300 text-xs mb-2" style={{ fontSize: '12px' }}>WAVE {wave}</div>
          <div className="flex flex-col gap-1 text-white" style={{ fontSize: '8px' }}>
            <div className="text-xs">
              {enemiesRemaining} REMAINING
            </div>
            <div className="text-xs">
              {enemiesKilled}/{targetEnemies} KILLED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameUI;
