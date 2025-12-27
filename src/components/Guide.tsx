import { useState } from 'react';
import { ACTIVE_ABILITIES } from '../data/activeAbilities';
import { PixelIcon } from '../utils/pixelIcons';

interface GuideProps {
  onBack: () => void;
}

type GuideCategory = 'enemies' | 'hero' | 'abilities' | 'lore';

interface EnemyAbility {
  name: string;
  description: string;
  details: string;
  image: string;
}

interface EnemyData {
  id: string;
  name: string;
  title: string;
  type: 'weak' | 'normal' | 'strong' | 'lazer';
  image: string;
  hp: string;
  speed: string;
  damage: string;
  description: string;
  lore: string;
  abilities: EnemyAbility[];
}

const Guide = ({ onBack }: GuideProps) => {
  const [activeCategory, setActiveCategory] = useState<GuideCategory>('enemies');
  const [selectedEnemy, setSelectedEnemy] = useState<string>('swarmer');
  const [selectedAbility, setSelectedAbility] = useState<string>('shield');

  const enemies: EnemyData[] = [
    {
      id: 'swarmer',
      name: 'CYBER DRONE',
      title: 'The Explosive Swarm',
      type: 'weak',
      image: '/assets/sprites/enemy_weak.png',
      hp: 'Low',
      speed: 'Very Fast',
      damage: 'High (Explosion)',
      description: 'Mass-produced combat drones with unstable plasma cores that detonate on impact.',
      lore: `The CYBER DRONE series was originally designed as cheap, disposable security units for corporate facilities. When the corporate wars escalated, these drones were mass-produced by the millions - simple AI cores in lightweight frames, armed with self-destruct protocols.

Their green plasma cores glow with unstable energy, a design flaw that became a feature. When a drone's target acquisition locks on, it accelerates to maximum velocity and detonates its core on impact. The explosion is devastating, but the drone itself is destroyed in the process.

These units operate in swarms, overwhelming defenses through sheer numbers. Their AI is primitive - they feel no fear, no pain, only the directive to eliminate the target. Corporate veterans call them "Green Death" and prioritize eliminating them at range before they can close the distance.

The command variant, identifiable by its golden command module, coordinates swarm attacks. Even in destruction, it leads its units to their explosive end.`,
      abilities: [
        {
          name: 'PLASMA DETONATION',
          description: 'Core ruptures on contact, releasing devastating area damage.',
          details: 'Upon making contact with the target, the drone\'s unstable plasma core ruptures instantly, creating a deadly explosion that damages everything in the blast radius. The detonation is unavoidable once contact is made - your only defense is to eliminate them before they reach you.',
          image: '/assets/guide/swarmer_explosion.png'
        },
        {
          name: 'TERMINAL PURSUIT',
          description: 'Charges directly at target with no self-preservation protocols.',
          details: 'Cyber Drones have the highest movement speed of any hostile unit. They calculate the shortest path to the target and never retreat or take cover. Their single-minded aggression makes them predictable but dangerous in numbers.',
          image: '/assets/guide/swarmer_pursuit.png'
        },
        {
          name: 'SWARM DEPLOYMENT',
          description: 'Always deploys in large groups to overwhelm defenses.',
          details: 'Cyber Drones never operate alone. They deploy in clusters, often from multiple vectors simultaneously. In later waves, swarm sizes increase dramatically, creating waves of green plasma that require area weapons or defensive protocols to handle effectively.',
          image: '/assets/guide/swarmer_swarm.png'
        }
      ]
    },
    {
      id: 'soldier',
      name: 'STALKER UNIT',
      title: 'The Tactical Hunter',
      type: 'normal',
      image: '/assets/sprites/enemy_normal.png',
      hp: 'Medium',
      speed: 'Normal',
      damage: 'Medium',
      description: 'Advanced combat cyborgs equipped with plasma weapons and tracking systems.',
      lore: `The STALKER UNIT series represents the next generation of corporate combat technology. Originally designed as perimeter security for high-value facilities, these units were upgraded with advanced AI and plasma weapon systems during the corporate wars.

Their multi-limbed design allows for superior mobility and weapon mounting. The purple energy cores on their chassis power their plasma cannons and tracking systems. Unlike the primitive Cyber Drones, Stalkers possess sophisticated combat AI that analyzes target behavior and adapts tactics in real-time.

Stalkers maintain optimal engagement distance, using their plasma weapons to harass targets while avoiding close combat. Their red optical sensors can track movement through smoke, darkness, and electronic interference. Their projectiles use advanced guidance systems that home in on targets with deadly accuracy.

The most disturbing aspect of Stalkers is their memory systems. They remember. Combat veterans report being targeted by the same Stalker unit across multiple engagements, as if the AI holds a grudge.`,
      abilities: [
        {
          name: 'TRACKING PLASMA',
          description: 'Fires guided energy bolts that lock onto target.',
          details: 'The Stalker launches blue tracking projectiles from its plasma cores. These projectiles use advanced guidance systems to follow the target\'s position and can be destroyed by counter-fire, but their tracking makes them difficult to avoid if ignored.',
          image: '/assets/guide/hunter_homing.png'
        },
        {
          name: 'LINEAR PLASMA BOLT',
          description: 'Fires high-velocity straight-line energy projectiles.',
          details: 'In addition to tracking shots, Stalkers fire orange plasma bolts in straight trajectories toward the target\'s current position. These travel faster than tracking projectiles but don\'t follow targets. Both projectile types can be active simultaneously, creating a devastating barrage.',
          image: '/assets/guide/hunter_projectile.png'
        },
        {
          name: 'TACTICAL POSITIONING',
          description: 'Maintains optimal engagement distance while attacking.',
          details: 'Stalkers calculate and maintain medium-range distance from targets. If you close the distance, they retreat while firing. If you flee, they pursue relentlessly. This behavior makes them dangerous harassers that whittle down structural integrity over time.',
          image: '/assets/guide/hunter_movement.png'
        }
      ]
    },
    {
      id: 'commander',
      name: 'WARLORD CLASS',
      title: 'The Heavy Assault Unit',
      type: 'strong',
      image: '/assets/sprites/enemy_strong.png',
      hp: 'Very High',
      speed: 'Slow',
      damage: 'Very High',
      description: 'Heavy combat mechs that deploy defensive fields and unleash devastating charged plasma cannons.',
      lore: `The WARLORD CLASS represents the pinnacle of corporate military technology - massive combat mechs originally designed for siege warfare. These units were the pride of corporate armies, piloted by elite cyborgs who had proven themselves in countless battles.

Their hulking green armor is covered in battle scars and corporate insignia. The reinforced faceplate and life support systems pump combat stimulants directly into the pilot's bloodstream, keeping them in a permanent state of combat readiness. Despite their size, they retain the tactical instincts that made their pilots legendary.

The most terrifying aspect of Warlords is their defensive protocols. Even in combat, they remember their primary directive: protect allied units. They project energy shields that make nearby hostiles invulnerable to all damage. The only way to break this protection is to destroy the Warlord itself.

When structural integrity drops below critical levels, a Warlord enters what combat logs call "BERSERKER PROTOCOL" - a state where all safety limits are disabled. Their optical sensors glow red, their movements become erratic, and their attack cycles accelerate to terrifying speeds. Many operators have celebrated damaging a Warlord, only to be immediately destroyed by its berserk retaliation.`,
      abilities: [
        {
          name: 'DEFENSIVE FIELD GENERATOR',
          description: 'Projects invulnerability field to all nearby allied units.',
          details: 'All hostiles within range of a Warlord become COMPLETELY INVULNERABLE to all damage. Protected units display a cyan shield glow and connecting data links to the Warlord. The ONLY way to damage shielded units is to eliminate the Warlord first. Multiple Warlords can stack their protection ranges.',
          image: '/assets/guide/overlord_shield.png'
        },
        {
          name: 'CHARGED PLASMA CANNON',
          description: 'Charges and fires an unstoppable beam of destruction.',
          details: 'After a charge period (indicated by orange pulsing and a targeting laser line), the Warlord fires a massive plasma projectile. This projectile CANNOT BE DESTROYED by counter-fire - it will pass through all defenses. The targeting line shows exactly where it will fire, giving you time to evade.',
          image: '/assets/guide/overlord_laser.png'
        },
        {
          name: 'BERSERKER PROTOCOL',
          description: 'Activates at low structural integrity, becoming exponentially more dangerous.',
          details: 'When structural integrity drops below critical levels, the Warlord transforms. Size increases, movement speed increases dramatically, weapon cooldowns decrease significantly, and charge time for the plasma cannon is reduced. A blood-red glow and system alert signal this transformation. Many operators die to Berserker Warlords they thought they had neutralized.',
          image: '/assets/guide/overlord_berserk.png'
        }
      ]
    },
    {
      id: 'lazer',
      name: 'SHADOW UNIT',
      title: 'The Unknown Threat',
      type: 'lazer',
      image: '/assets/sprites/enemy_lazer.png',
      hp: '???',
      speed: '???',
      damage: '???',
      description: 'An unidentified hostile unit that appears in higher threat levels. Very little is known about this dark silhouette. Operators who have encountered it speak of its ominous presence and unpredictable behavior. It only appears starting from wave 3.',
      lore: `The first reports came from an operator who barely escaped wave 3. They spoke of a dark figure that moved unlike any other hostile - not with the mindless aggression of Cyber Drones, nor the calculated precision of Stalkers, nor the brute force of Warlords.

This unit is different. It observes. It waits. And when it strikes... those who survive refuse to speak of what they witnessed.

The few who have lived to file reports describe it only as a shadow - a black silhouette that seems to absorb electromagnetic radiation itself. Some claim it moves through the battlefield like lightning. Others say it can appear behind you in an instant, as if it were never in front of you at all.

What is certain is that this threat only appears when threat levels escalate. It seems drawn to chaos, to the heat of combat. Whether it is a new corporate weapon, an experimental AI unit, or something else entirely... remains classified.

Operators are advised to be extremely cautious when this unit appears. Its true nature and capabilities are still being analyzed.`,
      abilities: [
        {
          name: 'UNKNOWN CAPABILITIES',
          description: 'The full extent of this unit\'s systems remains classified.',
          details: 'Very little is known about how this unit attacks or behaves. Operators report seeing strange energy signatures and unexpected movements, but the details are unclear. Further encounters may reveal more about its true nature. Approach with extreme caution.',
          image: '/assets/sprites/enemy_lazer.png'
        }
      ]
    }
  ];

  const loreEntries = [
    {
      id: 'arena',
      title: 'THE TESTING FACILITY',
      content: `The Testing Facility was not always a place of death. Decades ago, it stood as the primary research and development center for corporate military technology - a place where new weapons were tested, where combat systems were refined, and where the future of warfare was shaped.

The facility's construction took ten years and the resources of three major corporations. Its walls were reinforced with advanced alloys, its systems powered by experimental energy cores, and its architecture designed to be infinitely reconfigurable - a feat of engineering that allowed the facility to adapt to any combat scenario.

When the corporate wars escalated, the facility became a battleground. For three years, elite corporate forces fought here, protecting the valuable research data stored in the underground servers. But even the best fall.

Now the facility serves a darker purpose. Corporate remnants use it as a proving ground, drawing in operators with promises of advanced technology and weapons. Those who enter find themselves trapped in an ever-expanding combat simulation, fighting endless waves of hostile units until they either escape... or become part of the system.`
    },
    {
      id: 'corruption',
      title: 'THE CORPORATE WAR',
      content: `No one knows exactly when the Corporate War began. Some say it started with the first hostile takeover. Others believe it was always inevitable - corporations fighting for control of resources, technology, and power. The truth is classified.

What is known is its effect: the war transforms everything it touches. It doesn't destroy - it repurposes. Cities become battlegrounds, civilians become soldiers, and technology becomes weapons. What remains is a world driven by an insatiable hunger for corporate dominance.

The war spreads through contracts, through acquisitions, through prolonged exposure to corporate influence. The facility is so saturated with combat data that simply entering begins the transformation. Only those with exceptional skills - or exceptional equipment - can resist its influence.

Intelligence analysts who studied the war discovered that it has a network-like intelligence. The corporate forces share a collective command structure, coordinating their attacks with algorithmic precision. When you fight one, you fight them all.`
    },
    {
      id: 'survivor',
      title: 'THE OPERATOR',
      content: `You are not the first to enter the facility. Thousands have come before you - soldiers, mercenaries, desperate civilians with nothing left to lose. Most became part of the system within hours.

But you are different.

Perhaps it's the weapons you carry, forged with advanced corporate technology that resists system override. Perhaps it's your cybernetic enhancements, honed through years of combat. Or perhaps you carry something the system cannot process - free will.

The protocols you discover in the facility are not random. They are fragments from fallen operators, pieces of their combat data that recognize a worthy successor. Each protocol you claim is a piece of history, a legacy of skill passed down to you.

Your mission is simple: survive. But as you progress deeper into the facility, you'll discover that survival is just the beginning. The war has a source. The system has a master. And somewhere in the endless waves of hostiles, there's a path to ending this nightmare once and for all.`
    }
  ];

  const selectedEnemyData = enemies.find(e => e.id === selectedEnemy);
  const selectedAbilityData = ACTIVE_ABILITIES.find(a => a.type === selectedAbility);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'weak': return { bg: '#5a3000', border: '#ff8c00', text: '#ffaa00' };
      case 'normal': return { bg: '#003a00', border: '#00aa00', text: '#00ff00' };
      case 'strong': return { bg: '#5a0000', border: '#ff0000', text: '#ff4444' };
      case 'lazer': return { bg: '#1a1a1a', border: '#000000', text: '#666666' };
      default: return { bg: '#3a3a3a', border: '#888888', text: '#cccccc' };
    }
  };

  return (
    <>
      <style>{`
        .guide-sidebar::-webkit-scrollbar {
          width: 14px;
        }
        .guide-sidebar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(0, 200, 255, 0.2);
        }
        .guide-sidebar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(0, 200, 255, 0.4) 0%, rgba(0, 150, 200, 0.5) 100%);
          border: 1px solid rgba(0, 200, 255, 0.6);
          box-shadow: inset 0 0 4px rgba(0, 200, 255, 0.3);
        }
        .guide-sidebar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(0, 200, 255, 0.6) 0%, rgba(0, 150, 200, 0.7) 100%);
          border-color: rgba(0, 200, 255, 0.9);
          box-shadow: inset 0 0 6px rgba(0, 200, 255, 0.5);
        }
        .guide-content::-webkit-scrollbar {
          width: 14px;
        }
        .guide-content::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(0, 200, 255, 0.2);
        }
        .guide-content::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, rgba(0, 200, 255, 0.4) 0%, rgba(0, 150, 200, 0.5) 100%);
          border: 1px solid rgba(0, 200, 255, 0.6);
          box-shadow: inset 0 0 4px rgba(0, 200, 255, 0.3);
        }
        .guide-content::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, rgba(0, 200, 255, 0.6) 0%, rgba(0, 150, 200, 0.7) 100%);
          border-color: rgba(0, 200, 255, 0.9);
          box-shadow: inset 0 0 6px rgba(0, 200, 255, 0.5);
        }
        .tab-button {
          background-color: #3a0000;
        }
        .tab-button:hover {
          background-color: #5a0000;
        }
        .tab-button.active {
          background-color: #8b0000;
        }
        .list-item {
          background-color: #3a0000;
        }
        .list-item:hover {
          background-color: #5a0000;
        }
        .list-item.selected {
          background-color: #5a0000;
          border-left-width: 8px;
        }
      `}</style>
      
      <div className="h-screen w-screen bg-black text-white flex flex-col overflow-hidden relative" style={{ fontFamily: "'Pixelify Sans', sans-serif" }}>
        {/* Background image */}
        <img
          src="/assets/sprites/image copy 3.png"
          alt="Background"
          className="absolute inset-0 w-screen h-screen object-cover pointer-events-none"
        style={{ 
          imageRendering: 'pixelated', 
          zIndex: 0,
          filter: 'brightness(0.9) contrast(1.1)',
          opacity: 0.90
        }}
        />

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center p-4 border-b-2 border-cyan-500/30 hud-panel" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="hud-button py-3 px-8 font-bold"
              style={{ fontSize: '18px', borderColor: 'rgba(0, 200, 255, 0.5)' }}
            >
              <span className="hud-text">← BACK</span>
            </button>
            <h1 className="hud-text-accent font-bold" style={{ fontSize: '32px' }}>
              ENCYCLOPEDIA
            </h1>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            {(['enemies', 'hero', 'abilities', 'lore'] as GuideCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`hud-button px-5 py-2 font-bold transition-all ${activeCategory === cat ? '' : ''}`}
                style={{ 
                  fontSize: '16px',
                  borderColor: activeCategory === cat ? 'rgba(0, 200, 255, 0.9)' : 'rgba(0, 200, 255, 0.5)',
                  backgroundColor: activeCategory === cat ? 'rgba(0, 200, 255, 0.1)' : 'rgba(0, 0, 0, 0.85)'
                }}
              >
                <span className={activeCategory === cat ? 'hud-text-accent' : 'hud-text'}>{cat.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden relative z-10">
          
          {/* ENEMIES TAB */}
          {activeCategory === 'enemies' && (
            <>
              {/* Left Sidebar */}
              <div className="w-80 border-r-2 border-cyan-500/30 overflow-y-auto guide-sidebar" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
                <div className="p-4">
                  <h2 className="hud-text-accent font-bold mb-4 pb-2 border-b-2 border-cyan-500/30" style={{ fontSize: '16px' }}>SELECT ENEMY</h2>
                  {enemies.map((enemy) => {
                    const colors = getTypeColor(enemy.type);
                    return (
                      <button
                        key={enemy.id}
                        onClick={() => setSelectedEnemy(enemy.id)}
                        className={`w-full flex items-center gap-4 p-4 mb-2 hud-panel transition-all relative hover:scale-105 ${selectedEnemy === enemy.id ? 'selected' : ''}`}
                        style={{ 
                          borderColor: selectedEnemy === enemy.id ? colors.border : 'rgba(0, 200, 255, 0.5)',
                          backgroundColor: selectedEnemy === enemy.id ? colors.bg : 'rgba(0, 0, 0, 0.85)'
                        }}
                      >
                        <div className="hud-corner hud-corner-tl"></div>
                        <div className="hud-corner hud-corner-tr"></div>
                        <div className="hud-corner hud-corner-bl"></div>
                        <div className="hud-corner hud-corner-br"></div>
                        <img 
                          src={enemy.image} 
                          alt={enemy.name}
                          className="w-14 h-14 object-contain"
                          style={{ 
                            imageRendering: 'pixelated'
                          }}
                        />
                        <div className="text-left">
                          <div className="hud-text font-bold" style={{ fontSize: '18px' }}>{enemy.name}</div>
                          <div className="hud-text-accent" style={{ fontSize: '14px' }}>{enemy.title}</div>
                        </div>
                      </button>
                    );
                  })}
                  
                  {/* Coming Soon Message */}
                  <div className="hud-panel p-4 mt-4 relative" style={{ '--hud-border-color': 'rgba(255, 170, 0, 0.5)' } as React.CSSProperties}>
                    <div className="hud-corner hud-corner-tl"></div>
                    <div className="hud-corner hud-corner-tr"></div>
                    <div className="hud-corner hud-corner-bl"></div>
                    <div className="hud-corner hud-corner-br"></div>
                    <p className="hud-text-warning text-center font-bold" style={{ fontSize: '14px' }}>
                      EXPECT MORE ENEMY TYPES SOON
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 overflow-y-auto p-6 guide-content flex justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
                {selectedEnemyData && (
                  <div className="max-w-4xl w-full">
                    {/* Enemy Header */}
                    <div className="flex gap-6 mb-6 pb-5 border-b-2 border-cyan-500/30">
                      <div 
                        className="w-40 h-40 shrink-0 hud-panel flex items-center justify-center relative"
                        style={{ borderColor: getTypeColor(selectedEnemyData.type).border }}
                      >
                        <div className="hud-corner hud-corner-tl"></div>
                        <div className="hud-corner hud-corner-tr"></div>
                        <div className="hud-corner hud-corner-bl"></div>
                        <div className="hud-corner hud-corner-br"></div>
                        <img 
                          src={selectedEnemyData.image} 
                          alt={selectedEnemyData.name}
                          className="w-32 h-32 object-contain"
                          style={{ 
                            imageRendering: 'pixelated'
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="hud-text font-bold" style={{ fontSize: '32px' }}>{selectedEnemyData.name}</h2>
                          <span 
                            className="hud-panel px-3 py-1 font-bold relative"
                            style={{ 
                              fontSize: '14px',
                              backgroundColor: getTypeColor(selectedEnemyData.type).bg,
                              borderColor: getTypeColor(selectedEnemyData.type).border,
                            }}
                          >
                            <div className="hud-corner hud-corner-tl"></div>
                            <div className="hud-corner hud-corner-tr"></div>
                            <div className="hud-corner hud-corner-bl"></div>
                            <div className="hud-corner hud-corner-br"></div>
                            <span className="hud-text">{selectedEnemyData.type.toUpperCase()}</span>
                          </span>
                        </div>
                        <div className="hud-text-accent italic mb-3" style={{ fontSize: '16px' }}>"{selectedEnemyData.title}"</div>
                        <p className="hud-text mb-4" style={{ fontSize: '16px' }}>{selectedEnemyData.description}</p>
                        
                        {/* Stats */}
                        <div className="flex gap-4">
                          <div className="hud-panel px-4 py-2 relative" style={{ '--hud-border-color': 'rgba(255, 68, 68, 0.5)' } as React.CSSProperties}>
                            <div className="hud-corner hud-corner-tl"></div>
                            <div className="hud-corner hud-corner-tr"></div>
                            <div className="hud-corner hud-corner-bl"></div>
                            <div className="hud-corner hud-corner-br"></div>
                            <span className="hud-text-danger" style={{ fontSize: '12px' }}>HP</span>
                            <span className="hud-text font-bold ml-2" style={{ fontSize: '16px' }}>{selectedEnemyData.hp}</span>
                          </div>
                          <div className="hud-panel px-4 py-2 relative" style={{ '--hud-border-color': 'rgba(0, 200, 255, 0.5)' } as React.CSSProperties}>
                            <div className="hud-corner hud-corner-tl"></div>
                            <div className="hud-corner hud-corner-tr"></div>
                            <div className="hud-corner hud-corner-bl"></div>
                            <div className="hud-corner hud-corner-br"></div>
                            <span className="hud-text-accent" style={{ fontSize: '12px' }}>SPEED</span>
                            <span className="hud-text font-bold ml-2" style={{ fontSize: '16px' }}>{selectedEnemyData.speed}</span>
                          </div>
                          <div className="hud-panel px-4 py-2 relative" style={{ '--hud-border-color': 'rgba(255, 170, 0, 0.5)' } as React.CSSProperties}>
                            <div className="hud-corner hud-corner-tl"></div>
                            <div className="hud-corner hud-corner-tr"></div>
                            <div className="hud-corner hud-corner-bl"></div>
                            <div className="hud-corner hud-corner-br"></div>
                            <span className="hud-text-warning" style={{ fontSize: '12px' }}>DMG</span>
                            <span className="hud-text font-bold ml-2" style={{ fontSize: '16px' }}>{selectedEnemyData.damage}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Abilities Section */}
                    <div className="mb-6">
                      <h3 className="hud-text-warning font-bold mb-4 flex items-center gap-2" style={{ fontSize: '22px' }}>
                        <PixelIcon name="star" size={24} /> ABILITIES
                      </h3>
                      <div className="space-y-4">
                        {selectedEnemyData.abilities.map((ability, idx) => (
                          <div key={idx} className="hud-panel p-5 relative">
                            <div className="hud-corner hud-corner-tl"></div>
                            <div className="hud-corner hud-corner-tr"></div>
                            <div className="hud-corner hud-corner-bl"></div>
                            <div className="hud-corner hud-corner-br"></div>
                            <div className="flex gap-5">
                              <div className="w-48 h-48 shrink-0 hud-panel flex items-center justify-center overflow-hidden relative">
                                <div className="hud-corner hud-corner-tl"></div>
                                <div className="hud-corner hud-corner-tr"></div>
                                <div className="hud-corner hud-corner-bl"></div>
                                <div className="hud-corner hud-corner-br"></div>
                                <img 
                                  src={ability.image} 
                                  alt={ability.name}
                                  className="w-full h-full object-cover"
                                  style={{ imageRendering: 'pixelated' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = '<div class="hud-text-accent text-center" style="font-size: 11px; padding: 4px;">SCREENSHOT</div>';
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="hud-text font-bold mb-1" style={{ fontSize: '18px' }}>{ability.name}</h4>
                                <p className="hud-text-warning mb-2" style={{ fontSize: '15px' }}>{ability.description}</p>
                                <p className="hud-text-accent" style={{ fontSize: '14px', lineHeight: '1.5' }}>{ability.details}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lore Section */}
                    <div>
                      <h3 className="hud-text-accent font-bold mb-4 flex items-center gap-2" style={{ fontSize: '22px' }}>
                        <PixelIcon name="heart" size={24} /> LORE
                      </h3>
                      <div className="hud-panel p-5 relative">
                        <div className="hud-corner hud-corner-tl"></div>
                        <div className="hud-corner hud-corner-tr"></div>
                        <div className="hud-corner hud-corner-bl"></div>
                        <div className="hud-corner hud-corner-br"></div>
                        <p className="hud-text whitespace-pre-line" style={{ fontSize: '15px', lineHeight: '1.6' }}>{selectedEnemyData.lore}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* HERO TAB */}
          {activeCategory === 'hero' && (
            <div className="flex-1 overflow-y-auto p-6 guide-content flex justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
              <div className="max-w-4xl w-full">
                {/* Hero Header */}
                <div className="flex gap-6 mb-6 pb-5 border-b-2 border-cyan-500/30">
                  <div className="w-44 h-44 shrink-0 hud-panel flex items-center justify-center relative">
                    <div className="hud-corner hud-corner-tl"></div>
                    <div className="hud-corner hud-corner-tr"></div>
                    <div className="hud-corner hud-corner-bl"></div>
                    <div className="hud-corner hud-corner-br"></div>
                    <img 
                      src="/assets/sprites/player.png" 
                      alt="The Survivor"
                      className="w-36 h-36 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="hud-text-accent font-bold mb-2" style={{ fontSize: '32px' }}>THE SURVIVOR</h2>
                    <div className="hud-text-accent italic mb-3" style={{ fontSize: '16px' }}>"Last Hope of Valdris"</div>
                    <p className="hud-text mb-4" style={{ fontSize: '16px' }}>
                      You are the chosen one - a warrior who resists the corruption through sheer willpower and ancient weaponry. Armed with weapons blessed by the old gods and abilities inherited from fallen champions, you alone stand against the endless horde.
                    </p>
                    
                    <div className="flex gap-4 flex-wrap">
                      <div className="hud-panel px-4 py-2 relative">
                        <div className="hud-corner hud-corner-tl"></div>
                        <div className="hud-corner hud-corner-tr"></div>
                        <div className="hud-corner hud-corner-bl"></div>
                        <div className="hud-corner hud-corner-br"></div>
                        <span className="hud-text-accent" style={{ fontSize: '12px' }}>CLASS</span>
                        <span className="hud-text font-bold ml-2" style={{ fontSize: '16px' }}>Human Champion</span>
                      </div>
                      <div className="hud-panel px-4 py-2 relative">
                        <div className="hud-corner hud-corner-tl"></div>
                        <div className="hud-corner hud-corner-tr"></div>
                        <div className="hud-corner hud-corner-bl"></div>
                        <div className="hud-corner hud-corner-br"></div>
                        <span className="hud-text-accent" style={{ fontSize: '12px' }}>SPECIALTY</span>
                        <span className="hud-text font-bold ml-2" style={{ fontSize: '16px' }}>Adaptive Combat</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="mb-6">
                  <h3 className="hud-text-accent font-bold mb-4 flex items-center gap-2" style={{ fontSize: '22px' }}>
                    <PixelIcon name="bolt" size={24} /> CONTROLS
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { key: 'WASD', action: 'Movement' },
                      { key: 'MOUSE', action: 'Aim' },
                      { key: 'L-CLICK', action: 'Attack' },
                      { key: '1-5', action: 'Abilities' },
                      { key: 'E', action: 'Interact' },
                      { key: 'ESC', action: 'Pause' },
                    ].map((control, idx) => (
                      <div key={idx} className="hud-panel p-4 text-center relative">
                        <div className="hud-corner hud-corner-tl"></div>
                        <div className="hud-corner hud-corner-tr"></div>
                        <div className="hud-corner hud-corner-bl"></div>
                        <div className="hud-corner hud-corner-br"></div>
                        <div className="hud-text-warning font-bold" style={{ fontSize: '18px' }}>{control.key}</div>
                        <div className="hud-text-accent" style={{ fontSize: '14px' }}>{control.action}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coming Soon - Weapons */}
                <div className="mb-6">
                  <div className="hud-panel p-4 relative" style={{ '--hud-border-color': 'rgba(255, 170, 0, 0.5)' } as React.CSSProperties}>
                    <div className="hud-corner hud-corner-tl"></div>
                    <div className="hud-corner hud-corner-tr"></div>
                    <div className="hud-corner hud-corner-bl"></div>
                    <div className="hud-corner hud-corner-br"></div>
                    <p className="hud-text-warning text-center font-bold" style={{ fontSize: '16px' }}>
                      EXPECT MORE WEAPONS SOON
                    </p>
                  </div>
                </div>

                {/* Backstory */}
                <div>
                  <h3 className="hud-text-accent font-bold mb-4 flex items-center gap-2" style={{ fontSize: '22px' }}>
                    <PixelIcon name="heart" size={24} /> YOUR STORY
                  </h3>
                  <div className="hud-panel p-5 relative">
                    <div className="hud-corner hud-corner-tl"></div>
                    <div className="hud-corner hud-corner-tr"></div>
                    <div className="hud-corner hud-corner-bl"></div>
                    <div className="hud-corner hud-corner-br"></div>
                    <p className="hud-text whitespace-pre-line" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                      You awoke in the arena with no memory of how you arrived. The last thing you remember is a blinding light, a voice calling your name, and then... darkness.
                      <br /><br />
                      Now you fight. Not just for survival, but for answers. Who brought you here? Why can you resist the corruption when so many others have fallen? And what is the source of the power that courses through your veins every time you claim a new ability?
                      <br /><br />
                      The corrupted fear you. You can see it in the way they hesitate, in the way the Overlords' eyes flicker with something almost like recognition. They know something about you - something even you don't know.
                      <br /><br />
                      <span className="hud-text-accent font-bold">Your destiny is not to merely survive. It is to end this nightmare once and for all.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABILITIES TAB */}
          {activeCategory === 'abilities' && (
            <>
              {/* Left Sidebar */}
              <div className="w-80 border-r-2 border-cyan-500/30 overflow-y-auto guide-sidebar" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
                <div className="p-4">
                  <h2 className="hud-text-accent font-bold mb-4 pb-2 border-b-2 border-cyan-500/30" style={{ fontSize: '16px' }}>SELECT ABILITY</h2>
                  {ACTIVE_ABILITIES.map((ability) => (
                    <button
                      key={ability.type}
                      onClick={() => setSelectedAbility(ability.type)}
                      className={`w-full flex items-center gap-4 p-4 mb-2 hud-panel transition-all relative hover:scale-105 ${selectedAbility === ability.type ? 'selected' : ''}`}
                      style={{ 
                        borderColor: selectedAbility === ability.type ? 'rgba(255, 170, 0, 0.8)' : 'rgba(0, 200, 255, 0.5)',
                        backgroundColor: selectedAbility === ability.type ? 'rgba(255, 170, 0, 0.1)' : 'rgba(0, 0, 0, 0.85)'
                      }}
                    >
                      <div className="hud-corner hud-corner-tl"></div>
                      <div className="hud-corner hud-corner-tr"></div>
                      <div className="hud-corner hud-corner-bl"></div>
                      <div className="hud-corner hud-corner-br"></div>
                      <div className="w-12 h-12 hud-panel flex items-center justify-center relative">
                        <div className="hud-corner hud-corner-tl"></div>
                        <div className="hud-corner hud-corner-tr"></div>
                        <div className="hud-corner hud-corner-bl"></div>
                        <div className="hud-corner hud-corner-br"></div>
                        <PixelIcon name={ability.icon} size={28} />
                      </div>
                      <div className="text-left">
                        <div className="hud-text font-bold" style={{ fontSize: '16px' }}>{ability.name}</div>
                        <div className="hud-text-accent" style={{ fontSize: '13px' }}>{ability.duration / 1000}s duration</div>
                      </div>
                    </button>
                  ))}
                  
                  {/* Coming Soon Message */}
                  <div className="hud-panel p-4 mt-4 relative" style={{ '--hud-border-color': 'rgba(255, 170, 0, 0.5)' } as React.CSSProperties}>
                    <div className="hud-corner hud-corner-tl"></div>
                    <div className="hud-corner hud-corner-tr"></div>
                    <div className="hud-corner hud-corner-bl"></div>
                    <div className="hud-corner hud-corner-br"></div>
                    <p className="hud-text-warning text-center font-bold" style={{ fontSize: '14px' }}>
                      EXPECT MORE ABILITIES SOON
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 overflow-y-auto p-6 guide-content flex justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
                {selectedAbilityData && (
                  <div className="max-w-4xl w-full">
                    <div className="flex gap-6 mb-6 pb-5 border-b-2 border-cyan-500/30">
                      <div className="w-28 h-28 shrink-0 hud-panel flex items-center justify-center relative">
                        <div className="hud-corner hud-corner-tl"></div>
                        <div className="hud-corner hud-corner-tr"></div>
                        <div className="hud-corner hud-corner-bl"></div>
                        <div className="hud-corner hud-corner-br"></div>
                        <PixelIcon name={selectedAbilityData.icon} size={64} />
                      </div>
                      <div className="flex-1">
                        <h2 className="hud-text-warning font-bold mb-2" style={{ fontSize: '32px' }}>{selectedAbilityData.name.toUpperCase()}</h2>
                        <p className="hud-text mb-4" style={{ fontSize: '16px' }}>{selectedAbilityData.description}</p>
                        
                        <div className="flex gap-4">
                          <div className="hud-panel px-4 py-2 relative" style={{ '--hud-border-color': 'rgba(0, 255, 136, 0.5)' } as React.CSSProperties}>
                            <div className="hud-corner hud-corner-tl"></div>
                            <div className="hud-corner hud-corner-tr"></div>
                            <div className="hud-corner hud-corner-bl"></div>
                            <div className="hud-corner hud-corner-br"></div>
                            <span className="hud-text-success" style={{ fontSize: '12px' }}>DURATION</span>
                            <span className="hud-text font-bold ml-2" style={{ fontSize: '18px' }}>{selectedAbilityData.duration / 1000}s</span>
                          </div>
                          <div className="hud-panel px-4 py-2 relative" style={{ '--hud-border-color': 'rgba(255, 68, 68, 0.5)' } as React.CSSProperties}>
                            <div className="hud-corner hud-corner-tl"></div>
                            <div className="hud-corner hud-corner-tr"></div>
                            <div className="hud-corner hud-corner-bl"></div>
                            <div className="hud-corner hud-corner-br"></div>
                            <span className="hud-text-danger" style={{ fontSize: '12px' }}>COOLDOWN</span>
                            <span className="hud-text font-bold ml-2" style={{ fontSize: '18px' }}>{selectedAbilityData.cooldown / 1000}s</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* How It Works */}
                    <div className="hud-panel p-5 mb-5 relative">
                      <div className="hud-corner hud-corner-tl"></div>
                      <div className="hud-corner hud-corner-tr"></div>
                      <div className="hud-corner hud-corner-bl"></div>
                      <div className="hud-corner hud-corner-br"></div>
                      <h3 className="hud-text-accent font-bold mb-3" style={{ fontSize: '20px' }}>HOW IT WORKS</h3>
                      <p className="hud-text" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                        {selectedAbilityData.type === 'shield' && 
                          `The NANOMACHINE BARRIER protocol deploys an energy shield that nullifies ALL incoming damage. Hostile projectiles, explosions, and melee attacks are completely neutralized while the barrier is active. A cyan energy field surrounds you, pulsing rhythmically to indicate the barrier's presence. This protocol is perfect for escaping overwhelming situations or pushing through hostile lines.`
                        }
                        {selectedAbilityData.type === 'fire_ring' && 
                          `The PLASMA FIELD protocol activates a thermal discharge ring around you. Any hostile that enters this zone takes continuous plasma damage and is marked with a thermal signature. The field rotates visually and emits plasma particles along its perimeter. Hostiles caught in the plasma glow orange, making them easy to track. This protocol excels at crowd control and area denial.`
                        }
                        {selectedAbilityData.type === 'speed_boost' && 
                          `OVERDRIVE PROTOCOL increases your mobility by 100%, allowing you to outrun most hostiles in the facility. Cyan energy trails appear around your character to indicate the protocol is active. This enhancement is invaluable for repositioning, escaping dangerous situations, or kiting hostiles while your weapons are on cooldown.`
                        }
                        {selectedAbilityData.type === 'damage_boost' && 
                          `NANOMACHINE ENHANCEMENT multiplies ALL damage output by 5x for its duration. Your character gains a red energy glow to indicate the power surge. This protocol transforms even basic weapons into devastating tools of destruction. Best used when you have clear shots at high-value targets.`
                        }
                        {selectedAbilityData.type === 'freeze' && 
                          `STASIS FIELD slows ALL hostiles on the screen significantly, giving you a tactical advantage. Temporal particles orbit around you while this protocol is active, and affected hostiles move visibly slower. This protocol affects everything - movement speed, attack speed, and projectile speed.`
                        }
                      </p>
                    </div>

                    {/* Tips */}
                    <div className="hud-panel p-5 relative" style={{ '--hud-border-color': 'rgba(255, 170, 0, 0.5)' } as React.CSSProperties}>
                      <div className="hud-corner hud-corner-tl"></div>
                      <div className="hud-corner hud-corner-tr"></div>
                      <div className="hud-corner hud-corner-bl"></div>
                      <div className="hud-corner hud-corner-br"></div>
                      <h3 className="hud-text-warning font-bold mb-3 flex items-center gap-2" style={{ fontSize: '20px' }}>
                        <PixelIcon name="bolt" size={20} /> PRO TIPS
                      </h3>
                      <ul className="hud-text space-y-2" style={{ fontSize: '15px' }}>
                        {selectedAbilityData.type === 'shield' && (
                          <>
                            <li>• Use NANOMACHINE BARRIER to safely collect health pickups in dangerous areas</li>
                            <li>• Activate when a Warlord begins charging to nullify their attack</li>
                            <li>• Don't waste it on small groups - save it for emergencies</li>
                          </>
                        )}
                        {selectedAbilityData.type === 'fire_ring' && (
                          <>
                            <li>• Stand still to maximize damage - hostiles walking through take repeated hits</li>
                            <li>• Combine with STASIS FIELD to trap hostiles in the plasma longer</li>
                            <li>• Great for clearing Cyber Drone waves before they can detonate</li>
                          </>
                        )}
                        {selectedAbilityData.type === 'speed_boost' && (
                          <>
                            <li>• Use to kite Warlords while their defensive field protects other hostiles</li>
                            <li>• Perfect for repositioning when surrounded</li>
                            <li>• Can outrun even Berserker Protocol Warlords</li>
                          </>
                        )}
                        {selectedAbilityData.type === 'damage_boost' && (
                          <>
                            <li>• Focus fire on Warlords to eliminate their defensive field quickly</li>
                            <li>• Devastating with scattershot or rapid-fire plasma weapons</li>
                            <li>• Time it when hostiles are clustered for maximum impact</li>
                          </>
                        )}
                        {selectedAbilityData.type === 'freeze' && (
                          <>
                            <li>• Use to create distance when overwhelmed</li>
                            <li>• Slowed hostiles are easier to hit with slow projectiles</li>
                            <li>• Combine with PLASMA FIELD for a deadly combo</li>
                          </>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* LORE TAB */}
          {activeCategory === 'lore' && (
            <div className="flex-1 overflow-y-auto p-6 guide-content flex justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}>
              <div className="max-w-4xl w-full space-y-6">
                {loreEntries.map((entry) => (
                  <div key={entry.id} className="hud-panel p-6 relative">
                    <div className="hud-corner hud-corner-tl"></div>
                    <div className="hud-corner hud-corner-tr"></div>
                    <div className="hud-corner hud-corner-bl"></div>
                    <div className="hud-corner hud-corner-br"></div>
                    <h2 className="hud-text-accent font-bold mb-4 flex items-center gap-3" style={{ fontSize: '26px' }}>
                      <PixelIcon name="heart" size={28} /> {entry.title}
                    </h2>
                    <p className="hud-text whitespace-pre-line" style={{ fontSize: '15px', lineHeight: '1.7' }}>{entry.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Guide;
