import React from 'react';

interface AccountChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  newAddress: string | null;
  oldAddress: string | null;
  currentConnectedAddress: string | null;
  onConnect: () => Promise<void>;
  isWalletInstalled: () => boolean;
  installWallet: () => void;
}

const AccountChangeModal = ({ 
  isOpen, 
  onClose, 
  newAddress, 
  oldAddress,
  currentConnectedAddress,
  onConnect,
  isWalletInstalled,
  installWallet
}: AccountChangeModalProps) => {
  if (!isOpen) return null;

  const isNewAccountConnected = newAddress !== null && currentConnectedAddress === newAddress;
  const [isConnecting, setIsConnecting] = React.useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect();
      // Close modal after successful connection
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('Failed to connect:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const formatAddress = (addr: string | null) => {
    if (!addr) return 'N/A';
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
      style={{ fontFamily: "'Pixelify Sans', sans-serif" }}
    >
      <div 
        className="hud-panel p-8 max-w-md w-full mx-4 relative"
        style={{ imageRendering: 'pixelated', '--hud-border-color': 'rgba(0, 200, 255, 0.5)' } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="hud-corner hud-corner-tl"></div>
        <div className="hud-corner hud-corner-tr"></div>
        <div className="hud-corner hud-corner-bl"></div>
        <div className="hud-corner hud-corner-br"></div>
        
        <h2 
          className="hud-text-warning text-2xl font-bold mb-4 text-center"
          style={{ fontSize: '28px', imageRendering: 'pixelated' }}
        >
          ACCOUNT SWITCHED
        </h2>
        
        <div className="space-y-4 mb-6">
          <div className="hud-panel p-4 relative" style={{ '--hud-border-color': 'rgba(255, 170, 0, 0.5)' } as React.CSSProperties}>
            <div className="hud-corner hud-corner-tl"></div>
            <div className="hud-corner hud-corner-tr"></div>
            <div className="hud-corner hud-corner-bl"></div>
            <div className="hud-corner hud-corner-br"></div>
            <p className="hud-text-warning text-sm mb-2 font-bold">PREVIOUS ACCOUNT:</p>
            <p className="hud-text text-base font-mono break-all font-bold">
              {oldAddress ? formatAddress(oldAddress) : 'Not connected'}
            </p>
            {oldAddress && (
              <p className="hud-text-accent text-xs mt-1 font-mono break-all">
                {oldAddress}
              </p>
            )}
          </div>

          <div className="text-center">
            <span className="hud-text-warning text-2xl font-bold">↓</span>
          </div>

          <div 
            className="hud-panel p-4 relative" 
            style={{ 
              '--hud-border-color': isNewAccountConnected ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)'
            } as React.CSSProperties}
          >
            <div className="hud-corner hud-corner-tl"></div>
            <div className="hud-corner hud-corner-tr"></div>
            <div className="hud-corner hud-corner-bl"></div>
            <div className="hud-corner hud-corner-br"></div>
            <p className={`text-sm mb-2 font-bold ${isNewAccountConnected ? 'hud-text-success' : 'hud-text-danger'}`}>
              NEW ACCOUNT:
            </p>
            <p className="hud-text text-base font-mono break-all font-bold">
              {newAddress ? formatAddress(newAddress) : 'Not connected'}
            </p>
            {newAddress && (
              <p className="hud-text-accent text-xs mt-1 font-mono break-all">
                {newAddress}
              </p>
            )}
            {!isNewAccountConnected && newAddress && (
              <div className="mt-3 pt-3 border-t-2 border-cyan-500/30">
                <p className="hud-text-warning text-xs mb-2 font-bold">
                  ⚠️ This account is not connected
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center gap-4">
          {!isNewAccountConnected && isWalletInstalled() && (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="hud-button py-2 px-8 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                fontSize: '16px', 
                imageRendering: 'pixelated',
                '--hud-border-color': isConnecting ? 'rgba(255, 170, 0, 0.5)' : 'rgba(0, 255, 0, 0.5)'
              } as React.CSSProperties}
            >
              <span className="hud-text">{isConnecting ? 'CONNECTING...' : 'CONNECT ACCOUNT'}</span>
            </button>
          )}
          {!isNewAccountConnected && !isWalletInstalled() && (
            <button
              onClick={installWallet}
              className="hud-button py-2 px-8 font-bold transition-all"
              style={{ 
                fontSize: '16px', 
                imageRendering: 'pixelated',
                '--hud-border-color': 'rgba(255, 170, 0, 0.5)'
              } as React.CSSProperties}
            >
              <span className="hud-text">INSTALL WALLET</span>
            </button>
          )}
          {isNewAccountConnected && (
            <button
              onClick={onClose}
              className="hud-button py-2 px-8 font-bold transition-all"
              style={{ 
                fontSize: '16px', 
                imageRendering: 'pixelated',
                '--hud-border-color': 'rgba(0, 200, 255, 0.5)'
              } as React.CSSProperties}
            >
              <span className="hud-text">OK</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountChangeModal;

