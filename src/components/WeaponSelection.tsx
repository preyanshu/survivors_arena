import { Weapon } from '../types/game';
import { WEAPONS } from '../data/weapons';

interface WeaponSelectionProps {
  onSelectWeapon: (weapon: Weapon) => void;
}

const WeaponSelection = ({ onSelectWeapon }: WeaponSelectionProps) => {
  return (
    <div className="text-white text-center" style={{ fontFamily: "'Press Start 2P', monospace" }}>
      <h1 className="mb-6 text-red-500" style={{ fontSize: '24px' }}>SURVIVAL ARENA</h1>
      <p className="mb-8 text-gray-300" style={{ fontSize: '12px' }}>CHOOSE YOUR WEAPON</p>

      <div className="flex flex-wrap gap-6 justify-center max-w-7xl mx-auto">
        {WEAPONS.map((weapon) => (
          <button
            key={weapon.type}
            onClick={() => onSelectWeapon(weapon)}
            className="bg-purple-900 hover:bg-purple-800 border-4 border-white p-6 w-64 transition-all"
            style={{ 
              imageRendering: 'pixelated',
              fontSize: '8px'
            }}
          >
            <h3 className="text-white mb-3" style={{ fontSize: '12px' }}>{weapon.name.toUpperCase()}</h3>
            <p className="text-gray-300 mb-4" style={{ fontSize: '8px', lineHeight: '1.4' }}>{weapon.description.toUpperCase()}</p>
            <div className="text-gray-400" style={{ fontSize: '8px' }}>
              <p>DMG: {weapon.baseDamage}</p>
              <p>CD: {weapon.cooldown}MS</p>
              {weapon.range && <p>RNG: {weapon.range}</p>}
            </div>
          </button>
        ))}
      </div>

      <p className="mt-8 text-gray-500" style={{ fontSize: '8px' }}>USE WASD TO MOVE • SURVIVE THE WAVES</p>
    </div>
  );
};

export default WeaponSelection;
