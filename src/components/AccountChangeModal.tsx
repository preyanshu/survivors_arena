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
        className="border-4 border-white p-8 max-w-md w-full mx-4 relative shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]"
        style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 
          className="text-white text-2xl font-bold mb-4 text-center"
          style={{ fontSize: '28px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)', imageRendering: 'pixelated' }}
        >
          ACCOUNT SWITCHED
        </h2>
        
        <div className="space-y-4 mb-6">
          <div className="border-4 border-white p-4" style={{ backgroundColor: '#5a0000' }}>
            <p className="text-white text-sm mb-2 font-bold" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.8)' }}>PREVIOUS ACCOUNT:</p>
            <p className="text-white text-base font-mono break-all font-bold">
              {oldAddress ? formatAddress(oldAddress) : 'Not connected'}
            </p>
            {oldAddress && (
              <p className="text-gray-300 text-xs mt-1 font-mono break-all">
                {oldAddress}
              </p>
            )}
          </div>

          <div className="text-center">
            <span className="text-yellow-400 text-2xl font-bold" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>↓</span>
          </div>

          <div 
            className="border-4 p-4" 
            style={{ 
              backgroundColor: isNewAccountConnected ? '#0a4a0a' : '#5a0000',
              borderColor: isNewAccountConnected ? '#2a7a2a' : '#ff0000'
            }}
          >
            <p className={`text-sm mb-2 font-bold ${isNewAccountConnected ? 'text-green-300' : 'text-red-300'}`} style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.8)' }}>
              NEW ACCOUNT:
            </p>
            <p className="text-white text-base font-mono break-all font-bold">
              {newAddress ? formatAddress(newAddress) : 'Not connected'}
            </p>
            {newAddress && (
              <p className="text-gray-300 text-xs mt-1 font-mono break-all">
                {newAddress}
              </p>
            )}
            {!isNewAccountConnected && newAddress && (
              <div className="mt-3 pt-3 border-t-2 border-white/30">
                <p className="text-yellow-300 text-xs mb-2 font-bold" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.8)' }}>
                  ⚠️ This account is not connected
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          {!isNewAccountConnected && isWalletInstalled() && (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="border-4 border-white py-2 px-8 text-white font-bold transition-all disabled:bg-gray-600 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-1 hover:shadow-none"
              style={{ 
                fontSize: '16px', 
                backgroundColor: isConnecting ? '#5a0000' : '#0a4a0a',
                imageRendering: 'pixelated' 
              }}
            >
              {isConnecting ? 'CONNECTING...' : 'CONNECT ACCOUNT'}
            </button>
          )}
          {!isNewAccountConnected && !isWalletInstalled() && (
            <button
              onClick={installWallet}
              className="border-4 border-white py-2 px-8 text-white font-bold transition-all bg-[#5a0000] hover:bg-[#7a0000] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-1 hover:shadow-none"
              style={{ fontSize: '16px', imageRendering: 'pixelated' }}
            >
              INSTALL WALLET
            </button>
          )}
          {isNewAccountConnected && (
            <button
              onClick={onClose}
              className="border-4 border-white py-2 px-8 text-white font-bold transition-all bg-[#5a0000] hover:bg-[#7a0000] shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] hover:translate-y-1 hover:shadow-none"
              style={{ fontSize: '16px', imageRendering: 'pixelated' }}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountChangeModal;

