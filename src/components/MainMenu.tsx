import { useState } from 'react';
import { useOneWallet } from '../hooks/useOneWallet';
import WalletWarningModal from './WalletWarningModal';

interface MainMenuProps {
  onPlay: () => void;
  onInventory: () => void;
  onDailyChest: () => void;
  onAchievements: () => void;
}

const MainMenu = ({ onPlay, onInventory, onDailyChest, onAchievements }: MainMenuProps) => {
  const { connected, address, connect, disconnect, installWallet, isWalletInstalled, isCorrectChain, chainId, checkChain } = useOneWallet();
  const [showWalletWarning, setShowWalletWarning] = useState(false);
  const [showChainWarning, setShowChainWarning] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

  const formatAddress = (addr: string | null) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleMenuClick = (action: () => void) => {
    if (!connected) {
      setShowWalletWarning(true);
    } else if (!isCorrectChain) {
      setShowChainWarning(true);
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
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <div className="text-white text-sm font-bold bg-black/70 px-3 py-2 rounded border border-white/30 flex items-center gap-2">
                {formatAddress(address)}
                {!isCorrectChain && (
                  <span className="text-red-400 text-xs font-bold" title="Wrong network">!</span>
                )}
              </div>
              <button
                onClick={disconnect}
                className="wallet-button connected border-2 border-white/50 py-2 px-4 text-white text-sm font-bold transition-all rounded"
                style={{ fontSize: '14px', imageRendering: 'pixelated' }}
              >
                DISCONNECT
              </button>
            </div>
            {!isCorrectChain && (
              <div className="text-red-400 text-xs font-bold bg-red-900/50 px-2 py-1 rounded border border-red-400">
                WRONG NETWORK - SWITCH TO ONECHAIN TESTNET
              </div>
            )}
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
        <div className="relative">
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
          
          {/* Trophy icon button - positioned to the right, slightly upward */}
          <button
            onClick={onAchievements}
            className="absolute -right-20 -top-4 text-yellow-400 hover:text-yellow-200 hover:scale-110 transition-all p-2 text-6xl cursor-pointer"
            style={{ 
              background: 'transparent',
              border: 'none',
              fontSize: '60px',
              lineHeight: '1',
              transform: 'scale(1)',
              filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.5))'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(4px 4px 0px rgba(0,0,0,0.5)) brightness(1.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'drop-shadow(2px 2px 0px rgba(0,0,0,0.5))';
            }}
            title="Achievements"
          >
            🏆
          </button>
        </div>

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

        <button
          onClick={() => setShowComingSoon(true)}
          className="border-4 border-white py-6 px-12 text-white transition-all w-80 font-bold menu-button"
          style={{ 
            fontSize: '24px',
            imageRendering: 'pixelated'
          }}
        >
          MARKETPLACE
        </button>
      </div>

      {/* Controls Info - Bottom Center */}
      <div className="absolute bottom-8 left-0 right-0 text-center z-10 pointer-events-none">
        <div className="inline-block bg-black/70 border-2 border-white/30 p-4 rounded text-white/80">
          <p className="text-sm font-bold mb-2 text-yellow-400">CONTROLS</p>
          <div className="flex gap-8 text-xs">
            <div className="flex flex-col items-center">
              <span className="font-bold text-white">WASD</span>
              <span>MOVE</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-white">MOUSE</span>
              <span>AIM</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-white">L-CLICK</span>
              <span>SHOOT</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-white">1 - 5</span>
              <span>ABILITIES</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-white">E</span>
              <span>INTERACT</span>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Warning Modal */}
      <WalletWarningModal
        isOpen={showWalletWarning}
        onClose={() => setShowWalletWarning(false)}
        onConnect={handleConnectWallet}
      />

      {/* Chain Warning Modal */}
      {showChainWarning && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowChainWarning(false)}
        >
          <div 
            className="bg-gray-900 border-4 border-red-500 p-8 max-w-md w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "'Pixelify Sans', sans-serif" }}
          >
            <h2 
              className="text-red-400 text-2xl font-bold mb-4 text-center"
              style={{ imageRendering: 'pixelated' }}
            >
              WRONG NETWORK
            </h2>
            
            <p className="text-white text-lg mb-4 text-center">
              Your wallet is connected to the wrong network.
            </p>
            
            <p className="text-yellow-300 text-base mb-6 text-center font-bold">
              Please switch to <span className="text-cyan-300">OneChain Testnet</span> in your wallet settings.
            </p>

            {chainId && (
              <p className="text-gray-400 text-sm mb-6 text-center">
                Current network: {chainId}
              </p>
            )}
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setShowChainWarning(false);
                  checkChain();
                }}
                className="border-2 border-white py-2 px-6 text-white font-bold transition-all bg-gray-800 hover:bg-gray-700"
                style={{ fontSize: '16px', imageRendering: 'pixelated' }}
              >
                CHECK AGAIN
              </button>
              <button
                onClick={() => setShowChainWarning(false)}
                className="border-2 border-white py-2 px-6 text-white font-bold transition-all bg-red-800 hover:bg-red-700"
                style={{ fontSize: '16px', imageRendering: 'pixelated' }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setShowComingSoon(false)}
        >
          <div 
            className="bg-gray-900 border-4 border-yellow-500 p-8 max-w-md w-full mx-4 relative"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: "'Pixelify Sans', sans-serif" }}
          >
            <h2 
              className="text-yellow-400 text-2xl font-bold mb-4 text-center"
              style={{ imageRendering: 'pixelated' }}
            >
              MARKETPLACE
            </h2>
            
            <p className="text-white text-lg mb-6 text-center font-bold">
              COMING SOON
            </p>
            
            <p className="text-gray-300 text-base mb-6 text-center">
              The marketplace feature is under development. 
              Check back soon to buy and sell weapons!
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowComingSoon(false)}
                className="border-2 border-white py-2 px-8 text-white font-bold transition-all bg-gray-800 hover:bg-gray-700"
                style={{ fontSize: '16px', imageRendering: 'pixelated' }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default MainMenu;

