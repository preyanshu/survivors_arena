interface MainMenuProps {
  onPlay: () => void;
  onInventory: () => void;
  onDailyChest: () => void;
}

const MainMenu = ({ onPlay, onInventory, onDailyChest }: MainMenuProps) => {
  return (
    <>
      <style>{`
        .menu-button {
          background-color: #5a0000;
        }
        .menu-button:hover {
          background-color: #7a0000;
        }
      `}</style>
      <div 
        className="min-h-screen relative overflow-hidden"
        style={{ fontFamily: "'Pixelify Sans', sans-serif" }}
      >
      {/* Background image covering full screen */}
      <img
        src="/assets/sprites/image copy 2.png"
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Game title at the top */}
      <div className="absolute top-8 left-0 right-0 text-center z-10">
        <h1 
          className="font-bold"
          style={{ 
            fontSize: '72px',
            background: 'linear-gradient(135deg, #8b0000, #ff4500, #ff8c00, #8b0000, #4a0000)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '4px 4px 0px rgba(0,0,0,0.9), 0 0 20px rgba(255, 69, 0, 0.8), 0 0 40px rgba(139, 0, 0, 0.6)',
            imageRendering: 'pixelated',
            filter: 'drop-shadow(0 0 15px rgba(255, 69, 0, 0.7))'
          }}
        >
          SURVIVAL ARENA
        </h1>
      </div>
      
      {/* Menu buttons on the left side */}
      <div className="absolute left-48 top-6 bottom-0 flex flex-col gap-6 justify-center px-12 z-10">
        <button
          onClick={onPlay}
          className="border-4 border-white py-6 px-12 text-white transition-all w-80 font-bold menu-button"
          style={{ 
            fontSize: '24px',
            imageRendering: 'pixelated'
          }}
        >
          PLAY
        </button>

        <button
          onClick={onInventory}
          className="border-4 border-white py-6 px-12 text-white transition-all w-80 font-bold menu-button"
          style={{ 
            fontSize: '24px',
            imageRendering: 'pixelated'
          }}
        >
          INVENTORY
        </button>

        <button
          onClick={onDailyChest}
          className="border-4 border-white py-6 px-12 text-white transition-all w-80 font-bold menu-button"
          style={{ 
            fontSize: '24px',
            imageRendering: 'pixelated'
          }}
        >
          DAILY CHEST
        </button>
      </div>
    </div>
    </>
  );
};

export default MainMenu;

