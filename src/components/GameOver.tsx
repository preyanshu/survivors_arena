interface GameOverProps {
  wave: number;
  onReturnToMenu: () => void;
}

const GameOver = ({ wave, onReturnToMenu }: GameOverProps) => {
  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 pointer-events-auto" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
      <div className="bg-purple-900 border-4 border-white p-8 text-center" style={{ imageRendering: 'pixelated' }}>
        <h2 className="text-white mb-6" style={{ fontSize: '24px' }}>GAME OVER</h2>
        <p className="text-gray-300 mb-8" style={{ fontSize: '10px' }}>
          YOU SURVIVED {wave} WAVE{wave !== 1 ? 'S' : ''}
        </p>

        <button
          onClick={onReturnToMenu}
          className="bg-red-700 hover:bg-red-600 text-white border-4 border-white py-3 px-6 transition-all"
          style={{ 
            fontSize: '10px',
            imageRendering: 'pixelated'
          }}
        >
          RETURN TO MENU
        </button>
      </div>
    </div>
  );
};

export default GameOver;
