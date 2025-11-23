import { useState } from 'react';
import MainMenu from './components/MainMenu';
import WeaponSelection from './components/WeaponSelection';
import GameCanvas from './components/GameCanvas';
import Inventory from './components/Inventory';
import DailyChest from './components/DailyChest';
import Achievements from './components/Achievements';
import { Weapon, WeaponType, WeaponRarity } from './types/game';
import { WalletProvider } from './contexts/WalletContext';
import { MusicProvider, useMusic } from './contexts/MusicContext';
import { useUserWeapons } from './hooks/useUserWeapons';

type AppScreen = 'mainMenu' | 'weaponSelection' | 'game' | 'inventory' | 'dailyChest' | 'achievements';

const DEFAULT_WEAPONS: Weapon[] = [
  {
    id: 'default-pistol',
    type: WeaponType.PISTOL,
    rarity: WeaponRarity.COMMON,
    name: 'Common Pistol',
    description: 'A reliable standard-issue sidearm. Low damage but consistent fire rate. Good for beginners.',
    baseDamage: 15,
    cooldown: 500,
    range: 400
  },
  {
    id: 'default-sword',
    type: WeaponType.SWORD,
    rarity: WeaponRarity.COMMON,
    name: 'Common Sword',
    description: 'A basic forged iron sword. High damage but low range.',
    baseDamage: 25,
    cooldown: 400,
    range: 100
  }
];

function AppContent() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('mainMenu');
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const { stopMusic, resumeMusic } = useMusic();
  
  // Fetch weapons from blockchain
  const { weapons: userWeapons, loading: weaponsLoading, refetch: refetchWeapons } = useUserWeapons();
  
  // Combine default weapons with user's NFT weapons
  const playerInventory = [...DEFAULT_WEAPONS, ...userWeapons];

  const handlePlay = () => {
    setCurrentScreen('weaponSelection');
  };

  const handleInventory = () => {
    refetchWeapons(); // Refresh inventory when opening
    setCurrentScreen('inventory');
  };

  const handleDailyChest = () => {
    setCurrentScreen('dailyChest');
  };

  const handleAchievements = () => {
    setCurrentScreen('achievements');
  };

  const handleWeaponSelect = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setCurrentScreen('game');
    // Stop menu music when game starts
    stopMusic();
  };

  const handleReturnToMenu = () => {
    setCurrentScreen('mainMenu');
    setSelectedWeapon(null);
    // Resume menu music if it's enabled
    resumeMusic();
  };

  const handleWeaponObtained = (_weapon: Weapon) => {
    // We don't need to manually update state anymore, just refetch
    // But refetch might be async, so we can optimistically update if we want
    // For now, just triggering refetch is safer
    refetchWeapons();
  };

  return (
    <div className="min-h-screen bg-black">
      {currentScreen === 'mainMenu' && (
        <MainMenu 
          onPlay={handlePlay}
          onInventory={handleInventory}
          onDailyChest={handleDailyChest}
          onAchievements={handleAchievements}
        />
      )}
      {currentScreen === 'weaponSelection' && (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <WeaponSelection 
            onSelectWeapon={handleWeaponSelect} 
            onBack={handleReturnToMenu}
            availableWeapons={playerInventory}
            loading={weaponsLoading}
          />
        </div>
      )}
      {currentScreen === 'game' && selectedWeapon && (
        <GameCanvas weapon={selectedWeapon} onReturnToMenu={handleReturnToMenu} />
      )}
      {currentScreen === 'inventory' && (
        <Inventory 
          onBack={handleReturnToMenu} 
          playerInventory={playerInventory} 
          loading={weaponsLoading}
        />
      )}
      {currentScreen === 'dailyChest' && (
        <DailyChest 
          onBack={handleReturnToMenu}
          onWeaponObtained={handleWeaponObtained}
        />
      )}
      {currentScreen === 'achievements' && (
        <Achievements 
          onBack={handleReturnToMenu}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <MusicProvider>
        <AppContent />
      </MusicProvider>
    </WalletProvider>
  );
}

export default App;
