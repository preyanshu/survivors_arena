import { useState } from 'react';

interface AchievementsProps {
  onBack: () => void;
}

const Achievements = ({ onBack }: AchievementsProps) => {
  return (
    <div className="h-screen w-screen bg-black text-white flex items-center justify-center relative" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
      {/* Background image */}
      <img
        src="/assets/sprites/image copy 3.png"
        alt="Background"
        className="absolute inset-0 w-screen h-screen object-cover pointer-events-none"
        style={{ imageRendering: 'pixelated', zIndex: 0 }}
      />
      
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 border-4 border-white py-3 px-8 text-white font-bold bg-[#5a0000] hover:bg-[#7a0000] transition-all"
        style={{ 
          fontSize: '18px',
          imageRendering: 'pixelated',
          zIndex: 20
        }}
      >
        ← BACK
      </button>

      <div className="border-4 border-white p-8 text-center relative max-w-4xl w-full mx-4" style={{ backgroundColor: '#3a0000', imageRendering: 'pixelated', zIndex: 10 }}>
        <h1 className="text-white mb-8 font-bold" style={{ fontSize: '48px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>ACHIEVEMENTS</h1>
        
        <div className="text-white text-xl">
          <p className="mb-4">Achievements system coming soon!</p>
          <p className="text-gray-400 text-lg">Track your progress and unlock rewards.</p>
        </div>
      </div>
    </div>
  );
};

export default Achievements;

