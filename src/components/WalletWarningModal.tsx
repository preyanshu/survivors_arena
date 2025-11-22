interface WalletWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

const WalletWarningModal = ({ isOpen, onClose, onConnect }: WalletWarningModalProps) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border-4 border-white p-8 max-w-md w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Pixelify Sans', sans-serif" }}
      >
        <h2 
          className="text-white text-2xl font-bold mb-4 text-center"
          style={{ imageRendering: 'pixelated' }}
        >
          ⚠️ WALLET REQUIRED
        </h2>
        
        <p className="text-white text-lg mb-6 text-center">
          Please connect your OneChain wallet before proceeding.
        </p>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={onClose}
            className="border-2 border-white py-2 px-6 text-white font-bold transition-all bg-gray-800 hover:bg-gray-700"
            style={{ fontSize: '16px', imageRendering: 'pixelated' }}
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              onConnect();
              onClose();
            }}
            className="border-2 border-white py-2 px-6 text-white font-bold transition-all bg-red-800 hover:bg-red-700"
            style={{ fontSize: '16px', imageRendering: 'pixelated' }}
          >
            CONNECT WALLET
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletWarningModal;


