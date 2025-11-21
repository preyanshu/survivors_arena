import { Skull } from 'lucide-react';

interface GameOverProps {
  wave: number;
  onReturnToMenu: () => void;
}

const GameOver = ({ wave, onReturnToMenu }: GameOverProps) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 pointer-events-auto">
      <div className="text-white text-center">
        <h2 className="text-6xl font-bold mb-4 text-red-500 drop-shadow-lg">GAME OVER</h2>
        <p className="text-xl mb-8 text-gray-200">You survived {wave} wave{wave !== 1 ? 's' : ''}</p>

        <button
          onClick={onReturnToMenu}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-all transform hover:scale-105"
        >
          Return to Menu
        </button>
      </div>
    </div>
  );
};

export default GameOver;
