import { useState, useEffect } from 'react';
import MainMenu from './components/MainMenu';
import WeaponSelection from './components/WeaponSelection';
import GameCanvas from './components/GameCanvas';
import Inventory from './components/Inventory';
import DailyChest from './components/DailyChest';
import { Weapon } from './types/game';
import { loadInventoryFromStorage, addWeaponToInventory } from './utils/storage';

type AppScreen = 'mainMenu' | 'weaponSelection' | 'game' | 'inventory' | 'dailyChest';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('mainMenu');
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [playerInventory, setPlayerInventory] = useState<Weapon[]>([]);

  // Load inventory from localStorage on mount
  useEffect(() => {
    const inventory = loadInventoryFromStorage();
    setPlayerInventory(inventory);
  }, []);

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

  const handleWeaponObtained = (weapon: Weapon) => {
    const updatedInventory = addWeaponToInventory(weapon, playerInventory);
    setPlayerInventory(updatedInventory);
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
          <WeaponSelection 
            onSelectWeapon={handleWeaponSelect} 
            onBack={handleReturnToMenu}
            availableWeapons={playerInventory}
          />
        </div>
      )}
      {currentScreen === 'game' && selectedWeapon && (
        <GameCanvas weapon={selectedWeapon} onReturnToMenu={handleReturnToMenu} />
      )}
      {currentScreen === 'inventory' && (
        <Inventory onBack={handleReturnToMenu} playerInventory={playerInventory} />
      )}
      {currentScreen === 'dailyChest' && (
        <DailyChest 
          onBack={handleReturnToMenu}
          onWeaponObtained={handleWeaponObtained}
        />
      )}
    </div>
  );
}

export default App;
