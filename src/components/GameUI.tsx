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
    <div className="fixed top-0 left-0 right-0 p-4 pointer-events-none z-10" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto flex justify-between items-start gap-4">
        <div className="bg-opacity-95 p-6 border-4 border-white shadow-2xl" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated' }}>
          <div className="text-white mb-3 font-bold" style={{ fontSize: '20px' }}>
            HP: {Math.ceil(playerStats.health)}/{playerStats.maxHealth}
          </div>
          <div className="w-64 h-8 bg-gray-800 border-4 border-gray-600 overflow-hidden shadow-inner" style={{ imageRendering: 'pixelated' }}>
            <div
              className="h-full bg-red-600 transition-all duration-200 shadow-lg"
              style={{ 
                width: `${Math.max(0, healthPercentage)}%`,
                imageRendering: 'pixelated',
                boxShadow: 'inset 0 0 10px rgba(255, 0, 0, 0.5)'
              }}
            />
          </div>
        </div>

        <div className="bg-opacity-95 p-6 border-4 border-white text-center shadow-2xl" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated' }}>
          <div className="text-yellow-300 mb-3 font-bold" style={{ fontSize: '24px' }}>WAVE {wave}</div>
          <div className="flex flex-col gap-2 text-white">
            <div className="font-bold" style={{ fontSize: '16px' }}>
              {enemiesRemaining} REMAINING
            </div>
            <div className="font-bold" style={{ fontSize: '16px' }}>
              {enemiesKilled}/{targetEnemies} KILLED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameUI;
