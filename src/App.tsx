import { useState } from 'react';
import MainMenu from './components/MainMenu';
import WeaponSelection from './components/WeaponSelection';
import GameCanvas from './components/GameCanvas';
import { Weapon } from './types/game';

type AppScreen = 'mainMenu' | 'weaponSelection' | 'game' | 'inventory' | 'dailyChest';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('mainMenu');
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);

  const handlePlay = () => {
    setCurrentScreen('weaponSelection');
  };

  const handleInventory = () => {
    setCurrentScreen('inventory');
  };

  const handleDailyChest = () => {
    setCurrentScreen('dailyChest');
  };

  const handleWeaponSelect = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setCurrentScreen('game');
  };

  const handleReturnToMenu = () => {
    setCurrentScreen('mainMenu');
    setSelectedWeapon(null);
  };

  return (
    <div className="min-h-screen bg-black">
      {currentScreen === 'mainMenu' && (
        <MainMenu 
          onPlay={handlePlay}
          onInventory={handleInventory}
          onDailyChest={handleDailyChest}
        />
      )}
      {currentScreen === 'weaponSelection' && (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <WeaponSelection onSelectWeapon={handleWeaponSelect} />
        </div>
      )}
      {currentScreen === 'game' && selectedWeapon && (
        <GameCanvas weapon={selectedWeapon} onReturnToMenu={handleReturnToMenu} />
      )}
      {currentScreen === 'inventory' && (
        <div className="min-h-screen bg-black flex items-center justify-center" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
          <div className="bg-purple-900 border-4 border-white p-8 text-center" style={{ imageRendering: 'pixelated' }}>
            <h1 className="text-white mb-6" style={{ fontSize: '24px' }}>INVENTORY</h1>
            <p className="text-gray-300 mb-6" style={{ fontSize: '12px' }}>COMING SOON</p>
            <button
              onClick={handleReturnToMenu}
              className="bg-red-700 hover:bg-red-600 text-white border-4 border-white py-3 px-6 transition-all"
              style={{ fontSize: '12px', imageRendering: 'pixelated' }}
            >
              BACK
            </button>
          </div>
        </div>
      )}
      {currentScreen === 'dailyChest' && (
        <div className="min-h-screen bg-black flex items-center justify-center" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
          <div className="bg-purple-900 border-4 border-white p-8 text-center" style={{ imageRendering: 'pixelated' }}>
            <h1 className="text-white mb-6" style={{ fontSize: '24px' }}>DAILY CHEST</h1>
            <p className="text-gray-300 mb-6" style={{ fontSize: '12px' }}>COMING SOON</p>
            <button
              onClick={handleReturnToMenu}
              className="bg-red-700 hover:bg-red-600 text-white border-4 border-white py-3 px-6 transition-all"
              style={{ fontSize: '12px', imageRendering: 'pixelated' }}
            >
              BACK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
