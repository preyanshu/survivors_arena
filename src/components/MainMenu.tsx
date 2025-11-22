interface MainMenuProps {
  onPlay: () => void;
  onInventory: () => void;
  onDailyChest: () => void;
}

const MainMenu = ({ onPlay, onInventory, onDailyChest }: MainMenuProps) => {
  return (
    <div 
      className="min-h-screen bg-black flex items-center justify-start pl-12"
      style={{ fontFamily: "'Pixelify Sans', sans-serif" }}
    >
      <div className="flex flex-col gap-6">
        <button
          onClick={onPlay}
          className="bg-purple-900 hover:bg-purple-800 border-4 border-white py-6 px-12 text-white transition-all w-80"
          style={{ 
            fontSize: '24px',
            imageRendering: 'pixelated'
          }}
        >
          PLAY
        </button>

        <button
          onClick={onInventory}
          className="bg-purple-900 hover:bg-purple-800 border-4 border-white py-6 px-12 text-white transition-all w-80"
          style={{ 
            fontSize: '24px',
            imageRendering: 'pixelated'
          }}
        >
          INVENTORY
        </button>

        <button
          onClick={onDailyChest}
          className="bg-purple-900 hover:bg-purple-800 border-4 border-white py-6 px-12 text-white transition-all w-80"
          style={{ 
            fontSize: '24px',
            imageRendering: 'pixelated'
          }}
        >
          DAILY CHEST
        </button>
      </div>
    </div>
  );
};

export default MainMenu;

