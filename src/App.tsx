import { useState } from 'react';
import MainMenu from './components/MainMenu';
import WeaponSelection from './components/WeaponSelection';
import GameCanvas from './components/GameCanvas';
import Inventory from './components/Inventory';
import DailyChest from './components/DailyChest';
import Achievements from './components/Achievements';
import Guide from './components/Guide';
import { Weapon, WeaponType, WeaponRarity } from './types/game';
import { WalletProvider } from './contexts/WalletContext';
import { MusicProvider, useMusic } from './contexts/MusicContext';
import { useUserWeapons } from './hooks/useUserWeapons';

type AppScreen = 'mainMenu' | 'weaponSelection' | 'game' | 'inventory' | 'dailyChest' | 'achievements' | 'guide';

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
  const [isMobile, setIsMobile] = useState(false);
  const { stopMusic, resumeMusic } = useMusic();
  
  // Check for mobile device on mount and resize
  useState(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // Tablet/Mobile breakpoint (iPad Pro is 1024px, usually want desktop for this game)
    };
    
    // Initial check
    if (typeof window !== 'undefined') {
      checkMobile();
      window.addEventListener('resize', checkMobile);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', checkMobile);
      }
    };
  });

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

  const handleGuide = () => {
    setCurrentScreen('guide');
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

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-4" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
        <div className="bg-gray-900 border-4 border-red-500 p-8 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
          {/* Background pattern or effect could go here */}
          
          <div className="text-6xl mb-6">🖥️</div>
          
          <h2 
            className="text-red-500 text-3xl font-bold mb-4"
            style={{ 
              imageRendering: 'pixelated',
              textShadow: '2px 2px 0px rgba(0,0,0,0.5)'
            }}
          >
            DESKTOP ONLY
          </h2>
          
          <p className="text-white text-xl mb-6 leading-relaxed">
            This game is designed for mouse and keyboard controls.
          </p>
          
          <div className="bg-black/50 border-2 border-white/20 p-4 rounded mb-6">
            <p className="text-yellow-300 font-bold mb-2">REQUIRED INPUTS:</p>
            <div className="flex justify-center gap-6 text-sm text-gray-300">
              <div className="flex flex-col items-center">
                <span className="border border-white/30 px-2 py-1 rounded bg-white/10 mb-1">WASD</span>
                <span>MOVE</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="border border-white/30 px-2 py-1 rounded bg-white/10 mb-1">MOUSE</span>
                <span>AIM</span>
              </div>
            </div>
          </div>

          <p className="text-gray-400 text-sm">
            Please open this link on a PC or Mac to play.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {currentScreen === 'mainMenu' && (
        <MainMenu 
          onPlay={handlePlay}
          onInventory={handleInventory}
          onDailyChest={handleDailyChest}
          onAchievements={handleAchievements}
          onGuide={handleGuide}
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
      {currentScreen === 'guide' && (
        <Guide 
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

