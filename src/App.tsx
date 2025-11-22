import { useState } from 'react';
import MainMenu from './components/MainMenu';
import WeaponSelection from './components/WeaponSelection';
import GameCanvas from './components/GameCanvas';
import Inventory from './components/Inventory';
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
          <WeaponSelection onSelectWeapon={handleWeaponSelect} onBack={handleReturnToMenu} />
        </div>
      )}
      {currentScreen === 'game' && selectedWeapon && (
        <GameCanvas weapon={selectedWeapon} onReturnToMenu={handleReturnToMenu} />
      )}
      {currentScreen === 'inventory' && (
        <Inventory onBack={handleReturnToMenu} />
      )}
      {currentScreen === 'dailyChest' && (
        <div className="min-h-screen w-screen bg-black flex items-center justify-center relative" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
          {/* Background image */}
          <img
            src="/assets/sprites/image copy 3.png"
            alt="Background"
            className="absolute inset-0 w-screen h-screen object-cover pointer-events-none"
            style={{ imageRendering: 'pixelated', zIndex: 0 }}
          />
          <div className="border-4 border-white p-8 text-center relative" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated', zIndex: 10 }}>
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
