interface GameOverProps {
  wave: number;
  onReturnToMenu: () => void;
}

const GameOver = ({ wave, onReturnToMenu }: GameOverProps) => {
  // Calculate survived waves: if you die during wave 1, you've survived 0 waves
  // If you die during wave 2, you've survived 1 wave, etc.
  const survivedWaves = Math.max(0, wave - 1);
  
  return (
    <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 pointer-events-auto" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
      <div className="border-4 border-white p-12 text-center shadow-2xl" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated', minWidth: '500px' }}>
        <h2 className="text-white mb-8 font-bold" style={{ fontSize: '48px', textShadow: '4px 4px 0px rgba(0,0,0,0.5)' }}>GAME OVER</h2>
        <p className="text-gray-300 mb-10 font-bold" style={{ fontSize: '20px' }}>
          YOU SURVIVED {survivedWaves} WAVE{survivedWaves !== 1 ? 'S' : ''}
        </p>

        <button
          onClick={onReturnToMenu}
          className="bg-red-700 hover:bg-red-600 text-white border-4 border-white py-4 px-10 transition-all font-bold shadow-lg hover:shadow-xl"
          style={{ 
            fontSize: '18px',
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
