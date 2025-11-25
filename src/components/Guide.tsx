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
  type: 'weak' | 'normal' | 'strong';
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
      name: 'SWARMER',
      title: 'The Living Bomb',
      type: 'weak',
      image: '/assets/sprites/enemy_weak.png',
      hp: 'Low',
      speed: 'Very Fast',
      damage: 'High (Explosion)',
      description: 'Volatile green goblins that sprint toward their target and detonate on impact.',
      lore: `The Swarmers were once the miners of the old kingdom - small, hardy creatures that worked the depths beneath the arena. When the corruption took hold, their bodies became vessels for unstable energy.

Their sickly green glow is the result of corrupted minerals fused into their flesh. The pickaxes and tools they once used for honest work are now wielded as crude weapons, though they rarely get close enough to use them.

These creatures feel no pain, no fear - only an overwhelming compulsion to reach their target. The moment they make contact, the volatile energy within them ruptures in a devastating explosion. Arena veterans call them "Green Death" and prioritize eliminating them at range.

Their crowned leader, visible by the golden helmet fused to its skull, was once the foreman of the mining operation. Even in corruption, it leads its workers to their explosive doom.`,
      abilities: [
        {
          name: 'Kamikaze Detonation',
          description: 'Explodes on contact with the player, dealing massive area damage.',
          details: 'Upon touching the player, the Swarmer\'s volatile core ruptures instantly, creating a deadly explosion that damages everything caught in the blast radius. The explosion is unavoidable once contact is made - your only defense is to kill them before they reach you.',
          image: '/assets/guide/swarmer_explosion.png'
        },
        {
          name: 'Relentless Pursuit',
          description: 'Charges directly at the player with no self-preservation.',
          details: 'Swarmers have the highest movement speed of any enemy type. They take the shortest path to the player and never retreat or take cover. Their single-minded aggression makes them predictable but dangerous in numbers.',
          image: '/assets/guide/swarmer_pursuit.png'
        },
        {
          name: 'Swarm Spawning',
          description: 'Always spawns in large groups to overwhelm defenses.',
          details: 'Swarmers never appear alone. They spawn in clusters, often from multiple directions simultaneously. In later waves, swarm sizes increase dramatically, creating waves of green death that require area weapons or abilities to handle effectively.',
          image: '/assets/guide/swarmer_swarm.png'
        }
      ]
    },
    {
      id: 'soldier',
      name: 'HUNTER',
      title: 'The Corrupted Beast',
      type: 'normal',
      image: '/assets/sprites/enemy_normal.png',
      hp: 'Medium',
      speed: 'Normal',
      damage: 'Medium',
      description: 'Twisted spider-like creatures that attack from range with homing and standard projectiles.',
      lore: `The Hunters were once the arena's guard beasts - magically enhanced creatures bred to patrol the colosseum's perimeter. Their multiple limbs and keen senses made them perfect sentinels.

The corruption transformed them into nightmarish predators. Their bodies elongated, grew additional appendages, and developed the ability to generate and launch concentrated energy projectiles. The purple crystals sprouting from their backs are corruption nodes that power their ranged attacks.

Unlike the mindless Swarmers, Hunters are cunning. They maintain distance, circle their prey, and coordinate attacks with other corrupted. Their red eyes can track movement in complete darkness, and their projectiles home in on targets with supernatural accuracy.

The most disturbing aspect of the Hunters is their intelligence. They remember. Survivors report being stalked by the same Hunter across multiple arena runs, as if the creature holds a grudge.`,
      abilities: [
        {
          name: 'Homing Projectiles',
          description: 'Fires tracking energy bolts that follow the player.',
          details: 'The Hunter launches blue homing projectiles from its corruption crystals. These projectiles slowly track the player\'s position and can be destroyed by player weapons, but their tracking makes them difficult to avoid if ignored.',
          image: '/assets/guide/hunter_homing.png'
        },
        {
          name: 'Standard Projectiles',
          description: 'Fires fast-moving straight-line projectiles.',
          details: 'In addition to homing shots, Hunters fire orange energy bolts in straight lines toward the player\'s current position. These travel faster than homing projectiles but don\'t track. Both projectile types can be active simultaneously, creating a barrage of attacks.',
          image: '/assets/guide/hunter_projectile.png'
        },
        {
          name: 'Tactical Movement',
          description: 'Maintains optimal combat distance while attacking.',
          details: 'Hunters try to stay at medium range from the player. If you close the distance, they retreat while firing. If you flee, they pursue relentlessly. This behavior makes them dangerous harassers that whittle down your health over time.',
          image: '/assets/guide/hunter_movement.png'
        }
      ]
    },
    {
      id: 'commander',
      name: 'OVERLORD',
      title: 'The Corrupted Champion',
      type: 'strong',
      image: '/assets/sprites/enemy_strong.png',
      hp: 'Very High',
      speed: 'Slow',
      damage: 'Very High',
      description: 'Massive hulking brutes that shield allies and unleash devastating charged laser attacks.',
      lore: `The Overlords were once the arena's greatest champions - warriors who won a hundred battles and earned the right to retire in glory. The corruption found them in their peaceful retirement and twisted their legendary strength into something monstrous.

Their hulking green bodies are covered in battle scars and corruption boils. The gas mask fused to their faces pumps corrupted air directly into their lungs, keeping them in a permanent state of rage. Despite their size, they retain the combat instincts that made them champions.

The most terrifying aspect of the Overlords is their protective nature. Even corrupted, they remember their duty to protect the weak. Now they extend that protection to other corrupted, projecting shields that make nearby enemies invulnerable. The only way to break this protection is to destroy the Overlord itself.

When wounded, an Overlord enters what survivors call "Berserker Mode" - a state of pure fury where all restraint is abandoned. Their eyes glow red, their movements become frantic, and their attacks come with terrifying speed. Many survivors have celebrated wounding an Overlord, only to be immediately destroyed by its berserk retaliation.`,
      abilities: [
        {
          name: 'Shield Aura',
          description: 'Projects an invulnerability field to all nearby allies.',
          details: 'All enemies within range of an Overlord become COMPLETELY INVULNERABLE to all damage. Protected enemies display a cyan shield glow and connecting lines to the Overlord. The ONLY way to damage shielded enemies is to kill the Overlord first. Multiple Overlords can stack their protection ranges.',
          image: '/assets/guide/overlord_shield.png'
        },
        {
          name: 'Charged Laser',
          description: 'Charges up and fires an unstoppable beam of destruction.',
          details: 'After a charge period (indicated by orange pulsing and a targeting laser line), the Overlord fires a massive projectile. This projectile CANNOT BE DESTROYED by player weapons - it will pass through everything. The targeting line shows exactly where it will fire, giving you time to move out of the way.',
          image: '/assets/guide/overlord_laser.png'
        },
        {
          name: 'Berserker Rage',
          description: 'Enters a frenzy at low health, becoming exponentially more dangerous.',
          details: 'When health drops low, the Overlord transforms. Size increases, movement speed increases dramatically, attack cooldowns decrease significantly, and charge time for the laser is reduced. A blood-red glow and roar signal this transformation. Many survivors die to Berserker Overlords they thought they had beaten.',
          image: '/assets/guide/overlord_berserk.png'
        }
      ]
    }
  ];

  const loreEntries = [
    {
      id: 'arena',
      title: 'THE ARENA',
      content: `The Survival Arena was not always a place of death. A thousand years ago, it stood as the Grand Colosseum of the Kingdom of Valdris - a place where warriors tested their skill in honorable combat, where champions were crowned, and where the people gathered to celebrate their heroes.

The arena's construction took fifty years and the labor of ten thousand craftsmen. Its stones were quarried from the Sacred Mountains, blessed by priests, and laid with precision that modern architects cannot replicate. The floor was designed to be infinitely expandable - a feat of magical engineering that allowed the arena to grow or shrink based on the nature of the contest.

When the Dark Corruption emerged from the depths, the arena became humanity's last stronghold. For three years, the greatest warriors held the line here, protecting the civilians who sheltered in the underground chambers. But even heroes fall.

Now the arena serves a darker purpose. The corruption uses it as a hunting ground, drawing in survivors with promises of glory and treasure. Those who enter find themselves trapped in an ever-expanding nightmare, fighting endless waves of the corrupted until they either escape... or join the horde.`
    },
    {
      id: 'corruption',
      title: 'THE CORRUPTION',
      content: `No one knows where the Dark Corruption came from. Some say it seeped up from the world's core, a primordial evil that predates humanity. Others believe it was summoned by a mad sorcerer seeking immortality. The truth may be lost forever.

What is known is its effect: the corruption transforms living beings into mindless servants of destruction. It doesn't kill - it converts. The victim's body is preserved, enhanced even, but their soul is consumed. What remains is a hollow shell driven by an insatiable hunger for violence.

The corruption spreads through contact, through wounds, through prolonged exposure to corrupted areas. The arena is so saturated with dark energy that simply breathing the air begins the transformation. Only those with exceptional willpower - or exceptional weapons - can resist its influence.

Scholars who studied the corruption discovered that it has a hive-like intelligence. The corrupted share a collective consciousness, coordinating their attacks with supernatural precision. When you fight one, you fight them all.`
    },
    {
      id: 'survivor',
      title: 'THE SURVIVOR',
      content: `You are not the first to enter the arena. Thousands have come before you - warriors, mages, desperate civilians with nothing left to lose. Most became part of the horde within hours.

But you are different.

Perhaps it's the weapons you carry, forged with ancient techniques that resist corruption. Perhaps it's your iron will, honed through years of hardship. Or perhaps you carry a spark of something the corruption cannot touch - hope.

The abilities you discover in the arena are not random. They are gifts from the fallen champions, fragments of their power that recognize a worthy successor. Each ability you claim is a piece of history, a legacy of heroism passed down to you.

Your mission is simple: survive. But as you progress deeper into the arena, you'll discover that survival is just the beginning. The corruption has a source. The horde has a master. And somewhere in the endless waves of enemies, there's a path to ending this nightmare once and for all.`
    }
  ];

  const selectedEnemyData = enemies.find(e => e.id === selectedEnemy);
  const selectedAbilityData = ACTIVE_ABILITIES.find(a => a.type === selectedAbility);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'weak': return { bg: '#5a3000', border: '#ff8c00', text: '#ffaa00' };
      case 'normal': return { bg: '#003a00', border: '#00aa00', text: '#00ff00' };
      case 'strong': return { bg: '#5a0000', border: '#ff0000', text: '#ff4444' };
      default: return { bg: '#3a3a3a', border: '#888888', text: '#cccccc' };
    }
  };

  return (
    <>
      <style>{`
        .guide-sidebar::-webkit-scrollbar {
          width: 16px;
        }
        .guide-sidebar::-webkit-scrollbar-track {
          background: #1a0000;
          border: 2px solid #3a0000;
        }
        .guide-sidebar::-webkit-scrollbar-thumb {
          background: #5a0000;
          border: 2px solid #3a0000;
        }
        .guide-sidebar::-webkit-scrollbar-thumb:hover {
          background: #7a0000;
        }
        .guide-content::-webkit-scrollbar {
          width: 16px;
        }
        .guide-content::-webkit-scrollbar-track {
          background: #1a0000;
          border: 2px solid #3a0000;
        }
        .guide-content::-webkit-scrollbar-thumb {
          background: #5a0000;
          border: 2px solid #3a0000;
        }
        .guide-content::-webkit-scrollbar-thumb:hover {
          background: #7a0000;
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
          style={{ imageRendering: 'pixelated', zIndex: 0 }}
        />

        {/* Header */}
        <div className="relative z-10 flex justify-between items-center p-4 border-b-4 border-white" style={{ backgroundColor: 'rgba(58, 0, 0, 0.9)' }}>
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="border-4 border-white py-3 px-8 text-white font-bold hover:bg-red-800 transition-all"
              style={{ fontSize: '18px', backgroundColor: '#5a0000' }}
            >
              ← BACK
            </button>
            <h1 className="text-white font-bold" style={{ fontSize: '32px', textShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
              ENCYCLOPEDIA
            </h1>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            {(['enemies', 'hero', 'abilities', 'lore'] as GuideCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 font-bold border-4 border-white transition-all tab-button ${activeCategory === cat ? 'active' : ''}`}
                style={{ fontSize: '16px' }}
              >
                {cat.toUpperCase()}
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
              <div className="w-80 border-r-4 border-white overflow-y-auto guide-sidebar" style={{ backgroundColor: 'rgba(26, 0, 0, 0.9)' }}>
                <div className="p-4">
                  <h2 className="text-gray-300 font-bold mb-4 pb-2 border-b-2 border-gray-700" style={{ fontSize: '16px' }}>SELECT ENEMY</h2>
                  {enemies.map((enemy) => {
                    const colors = getTypeColor(enemy.type);
                    return (
                      <button
                        key={enemy.id}
                        onClick={() => setSelectedEnemy(enemy.id)}
                        className={`w-full flex items-center gap-4 p-4 mb-2 border-4 transition-all list-item ${selectedEnemy === enemy.id ? 'selected' : ''}`}
                        style={{ 
                          borderColor: selectedEnemy === enemy.id ? colors.border : '#5a0000',
                          backgroundColor: selectedEnemy === enemy.id ? colors.bg : undefined
                        }}
                      >
                        <img 
                          src={enemy.image} 
                          alt={enemy.name}
                          className="w-14 h-14 object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        <div className="text-left">
                          <div className="font-bold text-white" style={{ fontSize: '18px' }}>{enemy.name}</div>
                          <div className="text-gray-400" style={{ fontSize: '14px' }}>{enemy.title}</div>
                        </div>
                      </button>
                    );
                  })}
                  
                  {/* Coming Soon Message */}
                  <div className="border-4 border-yellow-900/50 p-4 mt-4" style={{ backgroundColor: 'rgba(90, 60, 0, 0.2)' }}>
                    <p className="text-yellow-300 text-center font-bold" style={{ fontSize: '14px' }}>
                      EXPECT MORE ENEMY TYPES SOON
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 overflow-y-auto p-6 guide-content flex justify-center" style={{ backgroundColor: 'rgba(26, 0, 0, 0.85)' }}>
                {selectedEnemyData && (
                  <div className="max-w-4xl w-full">
                    {/* Enemy Header */}
                    <div className="flex gap-6 mb-6 pb-5 border-b-4 border-gray-700">
                      <div 
                        className="w-40 h-40 shrink-0 border-4 flex items-center justify-center"
                        style={{ borderColor: getTypeColor(selectedEnemyData.type).border, backgroundColor: 'rgba(0,0,0,0.5)' }}
                      >
                        <img 
                          src={selectedEnemyData.image} 
                          alt={selectedEnemyData.name}
                          className="w-32 h-32 object-contain"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-white font-bold" style={{ fontSize: '32px' }}>{selectedEnemyData.name}</h2>
                          <span 
                            className="px-3 py-1 font-bold border-2"
                            style={{ 
                              fontSize: '14px',
                              backgroundColor: getTypeColor(selectedEnemyData.type).bg,
                              borderColor: getTypeColor(selectedEnemyData.type).border,
                              color: getTypeColor(selectedEnemyData.type).text
                            }}
                          >
                            {selectedEnemyData.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-gray-400 italic mb-3" style={{ fontSize: '16px' }}>"{selectedEnemyData.title}"</div>
                        <p className="text-gray-300 mb-4" style={{ fontSize: '16px' }}>{selectedEnemyData.description}</p>
                        
                        {/* Stats */}
                        <div className="flex gap-4">
                          <div className="border-2 border-red-900 px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <span className="text-red-400" style={{ fontSize: '12px' }}>HP</span>
                            <span className="text-white font-bold ml-2" style={{ fontSize: '16px' }}>{selectedEnemyData.hp}</span>
                          </div>
                          <div className="border-2 border-blue-900 px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <span className="text-blue-400" style={{ fontSize: '12px' }}>SPEED</span>
                            <span className="text-white font-bold ml-2" style={{ fontSize: '16px' }}>{selectedEnemyData.speed}</span>
                          </div>
                          <div className="border-2 border-orange-900 px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <span className="text-orange-400" style={{ fontSize: '12px' }}>DMG</span>
                            <span className="text-white font-bold ml-2" style={{ fontSize: '16px' }}>{selectedEnemyData.damage}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Abilities Section */}
                    <div className="mb-6">
                      <h3 className="text-yellow-500 font-bold mb-4 flex items-center gap-2" style={{ fontSize: '22px' }}>
                        <PixelIcon name="star" size={24} /> ABILITIES
                      </h3>
                      <div className="space-y-4">
                        {selectedEnemyData.abilities.map((ability, idx) => (
                          <div key={idx} className="border-4 border-gray-700 p-5" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <div className="flex gap-5">
                              <div className="w-48 h-48 shrink-0 border-2 border-gray-600 flex items-center justify-center overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                                <img 
                                  src={ability.image} 
                                  alt={ability.name}
                                  className="w-full h-full object-cover"
                                  style={{ imageRendering: 'pixelated' }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                    target.parentElement!.innerHTML = '<div class="text-gray-600 text-center" style="font-size: 11px; padding: 4px;">SCREENSHOT</div>';
                                  }}
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="text-white font-bold mb-1" style={{ fontSize: '18px' }}>{ability.name}</h4>
                                <p className="text-yellow-400 mb-2" style={{ fontSize: '15px' }}>{ability.description}</p>
                                <p className="text-gray-400" style={{ fontSize: '14px', lineHeight: '1.5' }}>{ability.details}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lore Section */}
                    <div>
                      <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2" style={{ fontSize: '22px' }}>
                        <PixelIcon name="heart" size={24} /> LORE
                      </h3>
                      <div className="border-4 border-purple-900 p-5" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <p className="text-gray-300 whitespace-pre-line" style={{ fontSize: '15px', lineHeight: '1.6' }}>{selectedEnemyData.lore}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* HERO TAB */}
          {activeCategory === 'hero' && (
            <div className="flex-1 overflow-y-auto p-6 guide-content flex justify-center" style={{ backgroundColor: 'rgba(26, 0, 0, 0.85)' }}>
              <div className="max-w-4xl w-full">
                {/* Hero Header */}
                <div className="flex gap-6 mb-6 pb-5 border-b-4 border-cyan-700">
                  <div className="w-44 h-44 shrink-0 border-4 border-cyan-500 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <img 
                      src="/assets/sprites/player.png" 
                      alt="The Survivor"
                      className="w-36 h-36 object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-cyan-400 font-bold mb-2" style={{ fontSize: '32px' }}>THE SURVIVOR</h2>
                    <div className="text-gray-400 italic mb-3" style={{ fontSize: '16px' }}>"Last Hope of Valdris"</div>
                    <p className="text-gray-300 mb-4" style={{ fontSize: '16px' }}>
                      You are the chosen one - a warrior who resists the corruption through sheer willpower and ancient weaponry. Armed with weapons blessed by the old gods and abilities inherited from fallen champions, you alone stand against the endless horde.
                    </p>
                    
                    <div className="flex gap-4 flex-wrap">
                      <div className="border-2 border-cyan-700 px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <span className="text-cyan-400" style={{ fontSize: '12px' }}>CLASS</span>
                        <span className="text-white font-bold ml-2" style={{ fontSize: '16px' }}>Human Champion</span>
                      </div>
                      <div className="border-2 border-cyan-700 px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <span className="text-cyan-400" style={{ fontSize: '12px' }}>SPECIALTY</span>
                        <span className="text-white font-bold ml-2" style={{ fontSize: '16px' }}>Adaptive Combat</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="mb-6">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2" style={{ fontSize: '22px' }}>
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
                      <div key={idx} className="border-4 border-gray-700 p-4 text-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="text-yellow-400 font-bold" style={{ fontSize: '18px' }}>{control.key}</div>
                        <div className="text-gray-400" style={{ fontSize: '14px' }}>{control.action}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coming Soon - Weapons */}
                <div className="mb-6">
                  <div className="border-4 border-yellow-900/50 p-4" style={{ backgroundColor: 'rgba(90, 60, 0, 0.2)' }}>
                    <p className="text-yellow-300 text-center font-bold" style={{ fontSize: '16px' }}>
                      EXPECT MORE WEAPONS SOON
                    </p>
                  </div>
                </div>

                {/* Backstory */}
                <div>
                  <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2" style={{ fontSize: '22px' }}>
                    <PixelIcon name="heart" size={24} /> YOUR STORY
                  </h3>
                  <div className="border-4 border-purple-900 p-5" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <p className="text-gray-300" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                      You awoke in the arena with no memory of how you arrived. The last thing you remember is a blinding light, a voice calling your name, and then... darkness.
                      <br /><br />
                      Now you fight. Not just for survival, but for answers. Who brought you here? Why can you resist the corruption when so many others have fallen? And what is the source of the power that courses through your veins every time you claim a new ability?
                      <br /><br />
                      The corrupted fear you. You can see it in the way they hesitate, in the way the Overlords' eyes flicker with something almost like recognition. They know something about you - something even you don't know.
                      <br /><br />
                      <span className="text-cyan-400 font-bold">Your destiny is not to merely survive. It is to end this nightmare once and for all.</span>
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
              <div className="w-80 border-r-4 border-white overflow-y-auto guide-sidebar" style={{ backgroundColor: 'rgba(26, 0, 0, 0.9)' }}>
                <div className="p-4">
                  <h2 className="text-gray-300 font-bold mb-4 pb-2 border-b-2 border-gray-700" style={{ fontSize: '16px' }}>SELECT ABILITY</h2>
                  {ACTIVE_ABILITIES.map((ability) => (
                    <button
                      key={ability.type}
                      onClick={() => setSelectedAbility(ability.type)}
                      className={`w-full flex items-center gap-4 p-4 mb-2 border-4 transition-all list-item ${selectedAbility === ability.type ? 'selected' : ''}`}
                      style={{ borderColor: selectedAbility === ability.type ? '#ffaa00' : '#5a0000' }}
                    >
                      <div className="w-12 h-12 border-2 border-gray-600 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <PixelIcon name={ability.icon} size={28} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white" style={{ fontSize: '16px' }}>{ability.name}</div>
                        <div className="text-gray-400" style={{ fontSize: '13px' }}>{ability.duration / 1000}s duration</div>
                      </div>
                    </button>
                  ))}
                  
                  {/* Coming Soon Message */}
                  <div className="border-4 border-yellow-900/50 p-4 mt-4" style={{ backgroundColor: 'rgba(90, 60, 0, 0.2)' }}>
                    <p className="text-yellow-300 text-center font-bold" style={{ fontSize: '14px' }}>
                      EXPECT MORE ABILITIES SOON
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Content */}
              <div className="flex-1 overflow-y-auto p-6 guide-content flex justify-center" style={{ backgroundColor: 'rgba(26, 0, 0, 0.85)' }}>
                {selectedAbilityData && (
                  <div className="max-w-4xl w-full">
                    <div className="flex gap-6 mb-6 pb-5 border-b-4 border-yellow-700">
                      <div className="w-28 h-28 shrink-0 border-4 border-yellow-500 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <PixelIcon name={selectedAbilityData.icon} size={64} />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-yellow-400 font-bold mb-2" style={{ fontSize: '32px' }}>{selectedAbilityData.name.toUpperCase()}</h2>
                        <p className="text-gray-300 mb-4" style={{ fontSize: '16px' }}>{selectedAbilityData.description}</p>
                        
                        <div className="flex gap-4">
                          <div className="border-2 border-green-700 px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <span className="text-green-400" style={{ fontSize: '12px' }}>DURATION</span>
                            <span className="text-white font-bold ml-2" style={{ fontSize: '18px' }}>{selectedAbilityData.duration / 1000}s</span>
                          </div>
                          <div className="border-2 border-red-700 px-4 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                            <span className="text-red-400" style={{ fontSize: '12px' }}>COOLDOWN</span>
                            <span className="text-white font-bold ml-2" style={{ fontSize: '18px' }}>{selectedAbilityData.cooldown / 1000}s</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* How It Works */}
                    <div className="border-4 border-gray-700 p-5 mb-5" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                      <h3 className="text-white font-bold mb-3" style={{ fontSize: '20px' }}>HOW IT WORKS</h3>
                      <p className="text-gray-300" style={{ fontSize: '15px', lineHeight: '1.6' }}>
                        {selectedAbilityData.type === 'shield' && 
                          `The Shield ability creates an impenetrable barrier around you that absorbs ALL incoming damage. Enemy projectiles, explosions, and melee attacks are completely nullified while the shield is active. A cyan glow surrounds you, pulsing rhythmically to indicate the shield's presence. This ability is perfect for escaping overwhelming situations or pushing through enemy lines.`
                        }
                        {selectedAbilityData.type === 'fire_ring' && 
                          `The Fire Ring summons a blazing circle of flame around you. Any enemy that enters this zone takes continuous damage and is marked with a burning effect. The ring rotates visually and emits fire particles along its perimeter. Enemies caught in the fire glow orange, making them easy to track. This ability excels at crowd control and area denial.`
                        }
                        {selectedAbilityData.type === 'speed_boost' && 
                          `Speed Boost doubles your movement speed, allowing you to outrun any enemy in the arena. Cyan speed lines appear around your character to indicate the boost is active. This ability is invaluable for repositioning, escaping dangerous situations, or kiting enemies while your weapons are on cooldown.`
                        }
                        {selectedAbilityData.type === 'damage_boost' && 
                          `Damage Boost triples ALL damage you deal for its duration. Your character gains a red glow to indicate the power surge. This ability transforms even basic weapons into devastating tools of destruction. Best used when you have clear shots at high-value targets.`
                        }
                        {selectedAbilityData.type === 'freeze' && 
                          `Freeze slows ALL enemies on the screen significantly, giving you a tactical advantage. Ice particles orbit around you while this ability is active, and affected enemies move visibly slower. This ability affects everything - movement speed, attack speed, and projectile speed.`
                        }
                      </p>
                    </div>

                    {/* Tips */}
                    <div className="border-4 border-yellow-900 p-5" style={{ backgroundColor: 'rgba(90, 60, 0, 0.3)' }}>
                      <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2" style={{ fontSize: '20px' }}>
                        <PixelIcon name="bolt" size={20} /> PRO TIPS
                      </h3>
                      <ul className="text-gray-300 space-y-2" style={{ fontSize: '15px' }}>
                        {selectedAbilityData.type === 'shield' && (
                          <>
                            <li>• Use Shield to safely collect health pickups in dangerous areas</li>
                            <li>• Activate when an Overlord begins charging to nullify their attack</li>
                            <li>• Don't waste it on small groups - save it for emergencies</li>
                          </>
                        )}
                        {selectedAbilityData.type === 'fire_ring' && (
                          <>
                            <li>• Stand still to maximize damage - enemies walking through take repeated hits</li>
                            <li>• Combine with Freeze to trap enemies in the fire longer</li>
                            <li>• Great for clearing Swarmer waves before they can detonate</li>
                          </>
                        )}
                        {selectedAbilityData.type === 'speed_boost' && (
                          <>
                            <li>• Use to kite Overlords while their shield protects other enemies</li>
                            <li>• Perfect for repositioning when surrounded</li>
                            <li>• Can outrun even Berserker-mode Overlords</li>
                          </>
                        )}
                        {selectedAbilityData.type === 'damage_boost' && (
                          <>
                            <li>• Focus fire on Overlords to eliminate their shield aura quickly</li>
                            <li>• Devastating with shotgun or assault rifle weapons</li>
                            <li>• Time it when enemies are clustered for maximum impact</li>
                          </>
                        )}
                        {selectedAbilityData.type === 'freeze' && (
                          <>
                            <li>• Use to create distance when overwhelmed</li>
                            <li>• Slowed enemies are easier to hit with slow projectiles</li>
                            <li>• Combine with Fire Ring for a deadly combo</li>
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
            <div className="flex-1 overflow-y-auto p-6 guide-content flex justify-center" style={{ backgroundColor: 'rgba(26, 0, 0, 0.85)' }}>
              <div className="max-w-4xl w-full space-y-6">
                {loreEntries.map((entry) => (
                  <div key={entry.id} className="border-4 border-purple-900 p-6" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <h2 className="text-purple-400 font-bold mb-4 flex items-center gap-3" style={{ fontSize: '26px' }}>
                      <PixelIcon name="heart" size={28} /> {entry.title}
                    </h2>
                    <p className="text-gray-300 whitespace-pre-line" style={{ fontSize: '15px', lineHeight: '1.7' }}>{entry.content}</p>
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
