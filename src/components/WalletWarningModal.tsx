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
        className="hud-panel p-8 max-w-md w-full mx-4 relative"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "'Pixelify Sans', sans-serif" }}
      >
        <div className="hud-corner hud-corner-tl"></div>
        <div className="hud-corner hud-corner-tr"></div>
        <div className="hud-corner hud-corner-bl"></div>
        <div className="hud-corner hud-corner-br"></div>
        <h2 
          className="hud-text-accent text-2xl font-bold mb-4 text-center"
          style={{ imageRendering: 'pixelated' }}
        >
          WALLET REQUIRED
        </h2>
        
        <p className="hud-text text-lg mb-6 text-center">
          Please connect your OneChain wallet before proceeding.
        </p>
        
        <div className="flex gap-4 justify-center">
          <button
            onClick={onClose}
            className="hud-button py-2 px-6 font-bold"
            style={{ fontSize: '16px', imageRendering: 'pixelated', borderColor: 'rgba(0, 200, 255, 0.5)' }}
          >
            <span className="hud-text">CANCEL</span>
          </button>
          <button
            onClick={() => {
              onConnect();
              onClose();
            }}
            className="hud-button py-2 px-6 font-bold"
            style={{ fontSize: '16px', imageRendering: 'pixelated', borderColor: 'rgba(255, 68, 68, 0.5)' }}
          >
            <span className="hud-text-danger">CONNECT WALLET</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletWarningModal;


