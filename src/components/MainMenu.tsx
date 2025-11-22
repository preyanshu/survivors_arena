import { useState } from 'react';
import { useOneWallet } from '../hooks/useOneWallet';
import WalletWarningModal from './WalletWarningModal';

interface MainMenuProps {
  onPlay: () => void;
  onInventory: () => void;
  onDailyChest: () => void;
}

const MainMenu = ({ onPlay, onInventory, onDailyChest }: MainMenuProps) => {
  const { connected, address, connect, disconnect, installWallet, isWalletInstalled } = useOneWallet();
  const [showWalletWarning, setShowWalletWarning] = useState(false);

  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleMenuClick = (action: () => void) => {
    if (!connected) {
      setShowWalletWarning(true);
    } else {
      action();
    }
  };

  const handleConnectWallet = () => {
    if (isWalletInstalled()) {
      connect();
    } else {
      installWallet();
    }
  };

  return (
    <>
      <style>{`
        .menu-button {
          background-color: #5a0000;
        }
        .menu-button:hover {
          background-color: #7a0000;
        }
        .wallet-button {
          background-color: #1a1a1a;
          border: 2px solid #4a4a4a;
        }
        .wallet-button:hover {
          background-color: #2a2a2a;
          border-color: #6a6a6a;
        }
        .wallet-button.connected {
          background-color: #0a4a0a;
          border-color: #2a7a2a;
        }
        .wallet-button.connected:hover {
          background-color: #0a5a0a;
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
      
      {/* Wallet connection button - top right */}
      <div className="absolute top-8 right-8 z-20">
        {connected ? (
          <div className="flex items-center gap-3">
            <div className="text-white text-sm font-bold bg-black/70 px-3 py-2 rounded border border-white/30 flex items-center">
              {formatAddress(address)}
            </div>
            <button
              onClick={disconnect}
              className="wallet-button connected border-2 border-white/50 py-2 px-4 text-white text-sm font-bold transition-all rounded"
              style={{ fontSize: '14px', imageRendering: 'pixelated' }}
            >
              DISCONNECT
            </button>
          </div>
        ) : (
          <button
            onClick={isWalletInstalled() ? connect : installWallet}
            className="wallet-button border-2 border-white/50 py-2 px-4 text-white text-sm font-bold transition-all rounded"
            style={{ fontSize: '14px', imageRendering: 'pixelated' }}
          >
            {isWalletInstalled() ? 'CONNECT ONECHAIN WALLET' : 'INSTALL ONECHAIN WALLET'}
          </button>
        )}
      </div>
      
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
          onClick={() => handleMenuClick(onPlay)}
          className="border-4 border-white py-6 px-12 text-white transition-all w-80 font-bold menu-button"
          style={{ 
            fontSize: '24px',
            imageRendering: 'pixelated'
          }}
        >
          PLAY
        </button>

        <button
          onClick={() => handleMenuClick(onInventory)}
          className="border-4 border-white py-6 px-12 text-white transition-all w-80 font-bold menu-button"
          style={{ 
            fontSize: '24px',
            imageRendering: 'pixelated'
          }}
        >
          INVENTORY
        </button>

        <button
          onClick={() => handleMenuClick(onDailyChest)}
          className="border-4 border-white py-6 px-12 text-white transition-all w-80 font-bold menu-button"
          style={{ 
            fontSize: '24px',
            imageRendering: 'pixelated'
          }}
        >
          DAILY CHEST
        </button>
      </div>

      {/* Wallet Warning Modal */}
      <WalletWarningModal
        isOpen={showWalletWarning}
        onClose={() => setShowWalletWarning(false)}
        onConnect={handleConnectWallet}
      />
    </div>
    </>
  );
};

export default MainMenu;

