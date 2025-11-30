import { Enemy, Position, EnemyType, Projectile, LaserBeam, LightningBeam, EnergyBeam } from '../types/game';
import { generateId, normalize, distance } from '../utils/gameUtils';
import { GAME_BALANCE } from '../data/gameBalance';

export class EnemyManager {
  private enemies: Enemy[] = [];
  private enemyProjectiles: Projectile[] = [];
  private laserBeams: LaserBeam[] = [];
  private lightningBeams: LightningBeam[] = [];
  private energyBeams: EnergyBeam[] = [];
  private canvasWidth: number;
  private canvasHeight: number;
  private spawnedEnemiesThisWave: number = 0;
  private spawnedLazerEnemiesThisWave: number = 0; // Track lazer enemies spawned this wave
  private lastGlobalMajorAttackTime: number = 0; // Global cooldown for LAZER major attacks
  private targetEnemyCount: number = 0;
  private currentWave: number = 0;
  private lastSpawnTime: number = 0;
  private waveBaseHealth: number = 0;
  private waveBaseSpeed: number = 0;
  private waveBaseDamage: number = 0;
  private onProjectileFired?: () => void;
  private onBerserkerActivated?: () => void;
  private onChargingStarted?: () => void;
  private onChargingStopped?: () => void;
  private onChargedShotFired?: () => void;
  private onWeakEnemyExploded?: () => void;
  private onNormalEnemyDied?: () => void;
  private onShieldBlocked?: () => void;
  private onEnemySplit?: () => void;

  constructor(canvasWidth: number, canvasHeight: number, onProjectileFired?: () => void, onBerserkerActivated?: () => void, onChargingStarted?: () => void, onChargingStopped?: () => void, onChargedShotFired?: () => void, onWeakEnemyExploded?: () => void, onNormalEnemyDied?: () => void, onShieldBlocked?: () => void, onEnemySplit?: () => void) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.onProjectileFired = onProjectileFired;
    this.onBerserkerActivated = onBerserkerActivated;
    this.onChargingStarted = onChargingStarted;
    this.onChargingStopped = onChargingStopped;
    this.onChargedShotFired = onChargedShotFired;
    this.onWeakEnemyExploded = onWeakEnemyExploded;
    this.onNormalEnemyDied = onNormalEnemyDied;
    this.onShieldBlocked = onShieldBlocked;
    this.onEnemySplit = onEnemySplit;
  }

  spawnWave(wave: number, playerPos?: Position, mousePos?: Position): void {
    // Reset counter for new wave
    this.spawnedEnemiesThisWave = 0;
    this.spawnedLazerEnemiesThisWave = 0; // Reset lazer enemy counter
    this.currentWave = wave;
    this.lastSpawnTime = Date.now();
    
    // Calculate enemy stats based on wave and balance config
    this.targetEnemyCount = Math.min(
      GAME_BALANCE.waves.enemyCountStart + wave * GAME_BALANCE.waves.enemyCountPerWave,
      GAME_BALANCE.waves.enemyCountMax
    );
    this.waveBaseHealth = GAME_BALANCE.enemies.baseHealthStart + wave * GAME_BALANCE.enemies.baseHealthPerWave;
    this.waveBaseSpeed = GAME_BALANCE.enemies.baseSpeedStart + wave * GAME_BALANCE.enemies.baseSpeedPerWave;
    this.waveBaseDamage = GAME_BALANCE.enemies.baseDamageStart + wave * GAME_BALANCE.enemies.baseDamagePerWave;

    // Spawn first few enemies immediately to start the wave
    const initialSpawn = Math.min(3, this.targetEnemyCount);
    for (let i = 0; i < initialSpawn; i++) {
      this.spawnEnemy(this.waveBaseHealth, this.waveBaseSpeed, this.waveBaseDamage, playerPos, mousePos);
    }
  }

  private getEnemyType(wave: number): EnemyType {
    // Distribute enemy types based on wave
    // Early waves: more weak enemies
    // Later waves: more strong enemies
    // LAZER enemies spawn starting from wave 3
    // BUT: Limit active LAZER enemies to prevent unplayable situations
    const rand = Math.random();
    
    // Count currently active LAZER enemies
    const activeLazerCount = this.enemies.filter(e => e.type === EnemyType.LAZER).length;
    const maxLazerEnemies = GAME_BALANCE.enemies.attack.maxActiveLazerEnemies;
    const canSpawnLazer = activeLazerCount < maxLazerEnemies;
    
    const dist = GAME_BALANCE.waves.distribution;
    if (wave <= 3) {
      // Waves 1-3 - small chance of LAZER starting wave 3
      if (wave >= 3 && rand < 0.05 && canSpawnLazer) return EnemyType.LAZER; // 5% chance in wave 3
      if (rand < dist.waves1to3.weak) return EnemyType.WEAK;
      if (rand < dist.waves1to3.weak + dist.waves1to3.normal) return EnemyType.NORMAL;
      return EnemyType.STRONG;
    } else if (wave <= 6) {
      // Waves 4-6 - more LAZER enemies (only if under limit)
      if (rand < 0.1 && canSpawnLazer) return EnemyType.LAZER; // 10% chance
      if (rand < 0.1 + dist.waves4to6.weak) return EnemyType.WEAK;
      if (rand < 0.1 + dist.waves4to6.weak + dist.waves4to6.normal) return EnemyType.NORMAL;
      return EnemyType.STRONG;
    } else {
      // Waves 7+ - even more LAZER enemies (only if under limit)
      if (rand < 0.15 && canSpawnLazer) return EnemyType.LAZER; // 15% chance
      if (rand < 0.15 + dist.waves7Plus.weak) return EnemyType.WEAK;
      if (rand < 0.15 + dist.waves7Plus.weak + dist.waves7Plus.normal) return EnemyType.NORMAL;
      return EnemyType.STRONG;
    }
  }

  private getEnemyStats(type: EnemyType, baseHealth: number, baseSpeed: number, baseDamage: number) {
    const config = GAME_BALANCE.enemies;
    switch (type) {
      case EnemyType.WEAK:
        return {
          health: Math.floor(baseHealth * config.weak.healthMultiplier),
          speed: baseSpeed * config.weak.speedMultiplier,
          damage: Math.floor(baseDamage * config.weak.damageMultiplier),
          size: config.weak.size,
        };
      case EnemyType.NORMAL:
        return {
          health: baseHealth,
          speed: baseSpeed,
          damage: baseDamage,
          size: config.normal.size,
        };
      case EnemyType.STRONG:
        return {
          health: Math.floor(baseHealth * config.strong.healthMultiplier),
          speed: baseSpeed * config.strong.speedMultiplier,
          damage: Math.floor(baseDamage * config.strong.damageMultiplier),
          size: config.strong.size,
        };
      case EnemyType.LAZER:
        return {
          health: Math.max(4, Math.floor(baseHealth * config.lazer.healthMultiplier)), // Minimum 4 health
          speed: baseSpeed * config.lazer.speedMultiplier,
          damage: Math.floor(baseDamage * config.lazer.damageMultiplier),
          size: config.lazer.size,
        };
      default:
        return {
          health: baseHealth,
          speed: baseSpeed,
          damage: baseDamage,
          size: config.normal.size,
        };
    }
  }

  updateSpawning(playerPos?: Position, isWaveInProgress?: boolean, mousePos?: Position): void {
    // Only spawn if wave is in progress
    if (!isWaveInProgress) return;

    // Don't spawn if we've already spawned all enemies
    if (this.spawnedEnemiesThisWave >= this.targetEnemyCount) return;

    // Spawn enemies gradually - only spawn more when there are fewer alive enemies
    // This creates a dynamic wave where enemies spawn as you kill them
    const maxAliveEnemies = Math.max(8, Math.floor(this.targetEnemyCount * 0.4)); // Max 40% of target alive at once, minimum 8
    const currentAlive = this.enemies.length;
    
    // Only spawn if we have room for more enemies (player has killed some)
    if (currentAlive >= maxAliveEnemies) return;

    const currentTime = Date.now();
    const spawnInterval = 800; // Spawn one enemy every 800ms when conditions are met

    if (currentTime - this.lastSpawnTime >= spawnInterval) {
      this.spawnEnemy(this.waveBaseHealth, this.waveBaseSpeed, this.waveBaseDamage, playerPos, mousePos);
      this.lastSpawnTime = currentTime;
    }
  }

  private spawnEnemy(baseHealth: number, baseSpeed: number, baseDamage: number, playerPos?: Position, mouseDirection?: Position): void {
    // Determine enemy type and stats first
    const enemyType = this.getEnemyType(this.currentWave);
    const stats = this.getEnemyStats(enemyType, baseHealth, baseSpeed, baseDamage);

    // Spawn enemies outside visible frame from all directions around the player
    // Prioritize spawning behind the player (opposite of mouse direction)
    const spawnDistance = 700; // Distance outside visible area
    let x: number, y: number;

    if (playerPos) {
      // Calculate visible area bounds (camera view) with extra margin to ensure enemies are completely off-screen
      const margin = 100; // Extra margin to ensure enemies are fully off-screen
      const viewLeft = playerPos.x - this.canvasWidth / 2 - margin;
      const viewRight = playerPos.x + this.canvasWidth / 2 + margin;
      const viewTop = playerPos.y - this.canvasHeight / 2 - margin;
      const viewBottom = playerPos.y + this.canvasHeight / 2 + margin;

      // Determine spawn direction - 70% chance to spawn behind player if mouse direction is known
      let direction: number;
      if (mouseDirection && Math.random() < 0.7) {
        // Spawn behind player (opposite of where player is facing)
        // Mouse direction indicates where player is facing
        const angle = Math.atan2(mouseDirection.y - playerPos.y, mouseDirection.x - playerPos.x);
        const behindAngle = angle + Math.PI; // 180 degrees opposite
        
        // Convert angle to one of 8 directions, prioritizing the one closest to behind
        const normalizedAngle = ((behindAngle % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        const directionAngle = normalizedAngle / (Math.PI * 2) * 8;
        direction = Math.floor(directionAngle) % 8;
      } else {
        // Spawn from random direction (30% chance, or if no mouse direction)
        direction = Math.floor(Math.random() * 8);
      }

      const randomOffset = Math.random() * 200;
      
      switch (direction) {
        case 0: // North (top) - spawn above visible area
          // X must be outside visible bounds - spawn to left or right of visible area
          if (Math.random() < 0.5) {
            // Spawn to the left of visible area
            x = viewLeft - spawnDistance - randomOffset - Math.random() * 200;
          } else {
            // Spawn to the right of visible area
            x = viewRight + spawnDistance + randomOffset + Math.random() * 200;
          }
          y = viewTop - spawnDistance - randomOffset;
          break;
        case 1: // South (bottom) - spawn below visible area
          // X must be outside visible bounds - spawn to left or right of visible area
          if (Math.random() < 0.5) {
            // Spawn to the left of visible area
            x = viewLeft - spawnDistance - randomOffset - Math.random() * 200;
          } else {
            // Spawn to the right of visible area
            x = viewRight + spawnDistance + randomOffset + Math.random() * 200;
          }
          y = viewBottom + spawnDistance + randomOffset;
          break;
        case 2: // East (right) - spawn to the right of visible area
          x = viewRight + spawnDistance + randomOffset;
          // Y must be outside visible bounds - spawn above or below visible area
          if (Math.random() < 0.5) {
            // Spawn above visible area
            y = viewTop - spawnDistance - randomOffset - Math.random() * 200;
          } else {
            // Spawn below visible area
            y = viewBottom + spawnDistance + randomOffset + Math.random() * 200;
          }
          break;
        case 3: // West (left) - spawn to the left of visible area
          x = viewLeft - spawnDistance - randomOffset;
          // Y must be outside visible bounds - spawn above or below visible area
          if (Math.random() < 0.5) {
            // Spawn above visible area
            y = viewTop - spawnDistance - randomOffset - Math.random() * 200;
          } else {
            // Spawn below visible area
            y = viewBottom + spawnDistance + randomOffset + Math.random() * 200;
          }
          break;
        case 4: // Northeast (top-right corner)
          x = viewRight + spawnDistance + randomOffset;
          y = viewTop - spawnDistance - randomOffset;
          break;
        case 5: // Northwest (top-left corner)
          x = viewLeft - spawnDistance - randomOffset;
          y = viewTop - spawnDistance - randomOffset;
          break;
        case 6: // Southeast (bottom-right corner)
          x = viewRight + spawnDistance + randomOffset;
          y = viewBottom + spawnDistance + randomOffset;
          break;
        default: // Southwest (bottom-left corner)
          x = viewLeft - spawnDistance - randomOffset;
          y = viewBottom + spawnDistance + randomOffset;
          break;
      }
    } else {
      // Fallback to old method if no player position (shouldn't happen)
      const side = Math.floor(Math.random() * 4);
      switch (side) {
        case 0:
          x = Math.random() * this.canvasWidth;
          y = -50;
          break;
        case 1:
          x = this.canvasWidth + 50;
          y = Math.random() * this.canvasHeight;
          break;
        case 2:
          x = Math.random() * this.canvasWidth;
          y = this.canvasHeight + 50;
          break;
        default:
          x = -50;
          y = Math.random() * this.canvasHeight;
      }
    }

    this.spawnedEnemiesThisWave++;
    
    // Track lazer enemies spawned this wave (for testing in wave 1)
    if (enemyType === EnemyType.LAZER) {
      this.spawnedLazerEnemiesThisWave++;
    }

    this.enemies.push({
      id: generateId(),
      position: { x, y },
      health: stats.health,
      maxHealth: stats.health,
      speed: stats.speed,
      damage: stats.damage,
      size: stats.size,
      type: enemyType,
      lastAttackTime: 0, // Initialize attack timer
      level: this.currentWave, // Set enemy level to current wave
    });
  }

  updateEnemies(playerPos: Position, deltaTime: number, isWaveInProgress?: boolean, mousePos?: Position, freezeActive: boolean = false): void {
    // Spawn new enemies during the wave
    this.updateSpawning(playerPos, isWaveInProgress, mousePos);

    const currentTime = Date.now();
    const attackConfig = GAME_BALANCE.enemies.attack;
    const attackRange = attackConfig.range;
    const attackCooldown = attackConfig.cooldown;
    const shieldRange = GAME_BALANCE.enemies.shieldRange;
    // Charge time decreases as waves progress
    const strongChargeTime = Math.max(
      attackConfig.chargeTimeMin,
      attackConfig.chargeTimeStart - (this.currentWave * attackConfig.chargeTimeReductionPerWave)
    );
    const strongChargeCooldown = attackConfig.chargeCooldown;

    // Apply freeze effect
    const speedMultiplier = freezeActive ? GAME_BALANCE.enemies.freezeSpeedMultiplier : 1.0;

    // First, reset all shield states
    this.enemies.forEach((enemy) => {
      enemy.shielded = false;
    });

    // STRONG enemies shield nearby enemies
    this.enemies.forEach((strongEnemy) => {
      if (strongEnemy.type === EnemyType.STRONG) {
        this.enemies.forEach((otherEnemy) => {
          if (otherEnemy.id !== strongEnemy.id && otherEnemy.type !== EnemyType.STRONG) {
            const dist = distance(strongEnemy.position, otherEnemy.position);
            if (dist <= shieldRange) {
              otherEnemy.shielded = true;
            }
          }
        });
      }
    });

    // Check for enemies that are too far from player and respawn them behind player
    const maxDistanceFromPlayer = Math.max(this.canvasWidth, this.canvasHeight) * 1.5; // 1.5x viewport size
    const enemiesToRespawn: Enemy[] = [];
    
    this.enemies.forEach((enemy) => {
      const distToPlayer = distance(enemy.position, playerPos);
      
      // If enemy is too far from player, mark for respawn
      if (distToPlayer > maxDistanceFromPlayer) {
        enemiesToRespawn.push(enemy);
        return; // Skip processing this enemy, will be respawned
      }
      
      // Check for berserker mode for STRONG enemies (< 70% health)
      if (enemy.type === EnemyType.STRONG && !enemy.isBerserker) {
        const healthPercentage = (enemy.health / enemy.maxHealth) * 100;
        if (healthPercentage < 70) {
          enemy.isBerserker = true;
          enemy.baseSize = enemy.size; // Store original size
          const berserkerConfig = attackConfig;
          enemy.size = enemy.size * berserkerConfig.berserkerSizeMultiplier;
          enemy.speed = enemy.speed * berserkerConfig.berserkerSpeedMultiplier;
          
          // Play berserker sound effect
          if (this.onBerserkerActivated) {
            this.onBerserkerActivated();
          }
        }
      }

      // LAZER enemies don't move while charging major attack or firing energy beam
      if (enemy.type === EnemyType.LAZER && 
          ((enemy.majorAttackChargeStartTime && !enemy.majorAttackTeleportTime) || 
           (enemy.majorAttackBeamStartTime && currentTime < enemy.majorAttackBeamEndTime!))) {
        // Enemy stands still while charging major attack or firing energy beam - skip movement
      } else {
        const direction = normalize({
          x: playerPos.x - enemy.position.x,
          y: playerPos.y - enemy.position.y,
        });

        // Apply berserker speed multiplier
        const berserkerSpeedMultiplier = enemy.isBerserker ? 1.0 : 1.0; // Already applied above
        const moveSpeed = enemy.speed * speedMultiplier * berserkerSpeedMultiplier * (deltaTime / 16);
        enemy.position.x += direction.x * moveSpeed;
        enemy.position.y += direction.y * moveSpeed;
      }

      // Normal enemies shoot projectiles at the player
      if (enemy.type === EnemyType.NORMAL) {
        const distToPlayer = distance(enemy.position, playerPos);
        
        // Attack if within range and cooldown is ready
        if (distToPlayer <= attackRange && 
            (!enemy.lastAttackTime || currentTime - enemy.lastAttackTime >= attackCooldown)) {
          this.shootAtPlayer(enemy, playerPos, this.currentWave);
          enemy.lastAttackTime = currentTime;
        }
      }

      // STRONG enemies use charged shots
      if (enemy.type === EnemyType.STRONG) {
        // Berserker mode: reduced charge time and cooldown
        const berserkerChargeTime = enemy.isBerserker 
          ? strongChargeTime * attackConfig.berserkerChargeTimeMultiplier 
          : strongChargeTime;
        const berserkerChargeCooldown = enemy.isBerserker 
          ? strongChargeCooldown * attackConfig.berserkerCooldownMultiplier 
          : strongChargeCooldown;
        
        const distToPlayer = distance(enemy.position, playerPos);
        
        // Start charging if within range and not already charging
        if (distToPlayer <= attackRange) {
          // If not charging and cooldown is ready, start charging and lock target position
          if (!enemy.chargeStartTime && 
              (!enemy.lastAttackTime || currentTime - enemy.lastAttackTime >= berserkerChargeCooldown)) {
            enemy.chargeStartTime = currentTime;
            enemy.chargeTargetPos = { ...playerPos }; // Lock target position when charging starts
            
            // Play charging sound effect
            if (this.onChargingStarted) {
              this.onChargingStarted();
            }
          }
          
          // If charging and charge time is complete, fire charged shot at locked target
          if (enemy.chargeStartTime && currentTime - enemy.chargeStartTime >= berserkerChargeTime) {
            // Use locked target position, not current player position
            const targetPos = enemy.chargeTargetPos || playerPos;
            this.shootChargedShot(enemy, targetPos);
            enemy.lastAttackTime = currentTime;
            enemy.chargeStartTime = undefined; // Reset charge
            enemy.chargeTargetPos = undefined; // Reset target
          }
        } else {
          // Out of range, cancel charge
          if (enemy.chargeStartTime) {
            // Only stop sound if charging was actually in progress
            if (this.onChargingStopped) {
              this.onChargingStopped();
            }
          }
          enemy.chargeStartTime = undefined;
          enemy.chargeTargetPos = undefined;
        }
      }

      // LAZER enemies fire lightning that bounces between nearby enemies
      if (enemy.type === EnemyType.LAZER) {
        // Clean up expired lightning state
        if (enemy.lightningBeamEndTime && currentTime >= enemy.lightningBeamEndTime) {
          enemy.lightningBeamStartTime = undefined;
          enemy.lightningBeamPath = undefined;
          enemy.lightningBeamEndTime = undefined;
        }
        
        const distToPlayer = distance(enemy.position, playerPos);
        const lightningCooldown = attackConfig.lightningCooldown;
        
        // Clean up expired major attack state
        if (enemy.majorAttackBeamEndTime && currentTime >= enemy.majorAttackBeamEndTime) {
          // Store when attack ended for cooldown tracking (persistent, don't clear)
          enemy.lastMajorAttackEndTime = currentTime;
          
          enemy.majorAttackChargeStartTime = undefined;
          enemy.majorAttackTeleportTime = undefined;
          enemy.majorAttackBeamStartTime = undefined;
          enemy.majorAttackBeamEndTime = undefined;
          enemy.majorAttackBeamAngle = undefined;
        }
        
        const majorAttackCooldown = attackConfig.majorAttackCooldown;
        const majorAttackChargeTime = attackConfig.majorAttackChargeTime;
        const majorAttackBeamDuration = attackConfig.majorAttackBeamDuration;
        
        // Major attack: charge -> teleport -> energy beam
        // Check if major attack is ready (separate cooldown from lightning)
        // Use persistent lastMajorAttackEndTime for proper cooldown tracking
        const lastMajorAttackTime = enemy.lastMajorAttackEndTime || 0;
        
        // Check if enemy is visible on screen (within player's viewport)
        const halfWidth = this.canvasWidth / 2;
        const halfHeight = this.canvasHeight / 2;
        const isEnemyVisible = enemy.position.x >= playerPos.x - halfWidth &&
                               enemy.position.x <= playerPos.x + halfWidth &&
                               enemy.position.y >= playerPos.y - halfHeight &&
                               enemy.position.y <= playerPos.y + halfHeight;
        
        // Check if any other LAZER enemy is currently using major attack (charging, teleporting, or firing)
        const anyLazerUsingMajorAttack = this.enemies.some(e => 
          e.type === EnemyType.LAZER && 
          e.id !== enemy.id && 
          (e.majorAttackChargeStartTime || e.majorAttackTeleportTime || e.majorAttackBeamStartTime)
        );
        
        // Global cooldown between major attacks (3 seconds between different LAZER enemies)
        const globalMajorAttackCooldown = 3000;
        const globalCooldownReady = currentTime - this.lastGlobalMajorAttackTime >= globalMajorAttackCooldown;
        
        const canUseMajorAttack = !enemy.majorAttackChargeStartTime && 
                                  !enemy.majorAttackTeleportTime && 
                                  !enemy.majorAttackBeamStartTime &&
                                  (currentTime - lastMajorAttackTime >= majorAttackCooldown) &&
                                  isEnemyVisible && // Only use major attack if visible to player
                                  !anyLazerUsingMajorAttack && // Only one LAZER can use major attack at a time
                                  globalCooldownReady; // Global cooldown between major attacks
        
        if (canUseMajorAttack && distToPlayer <= attackRange * 1.5) {
          // Start charging for major attack
          enemy.majorAttackChargeStartTime = currentTime;
          this.lastGlobalMajorAttackTime = currentTime; // Update global cooldown
        }
        
        // If charging, check if charge is complete
        if (enemy.majorAttackChargeStartTime && !enemy.majorAttackTeleportTime) {
          if (currentTime - enemy.majorAttackChargeStartTime >= majorAttackChargeTime) {
            // Charge complete - teleport behind player
            const teleportDistance = 400; // Distance behind player
            const angle = Math.atan2(mousePos.y - playerPos.y, mousePos.x - playerPos.x);
            const behindAngle = angle + Math.PI; // 180 degrees opposite
            
            // Teleport behind player
            enemy.position.x = playerPos.x + Math.cos(behindAngle) * teleportDistance;
            enemy.position.y = playerPos.y + Math.sin(behindAngle) * teleportDistance;
            
            enemy.majorAttackTeleportTime = currentTime;
            // Beam will start after delay (see below)
          }
        }
        
        // After teleport, wait 500ms before firing beam (gives player time to react)
        const beamWindupDelay = 500; // Half second delay after teleport
        if (enemy.majorAttackTeleportTime && !enemy.majorAttackBeamStartTime) {
          if (currentTime - enemy.majorAttackTeleportTime >= beamWindupDelay) {
            // Calculate beam angle towards current player position
            const beamAngle = Math.atan2(
              playerPos.y - enemy.position.y,
              playerPos.x - enemy.position.x
            );
            
            enemy.majorAttackBeamStartTime = currentTime;
            enemy.majorAttackBeamAngle = beamAngle;
            enemy.majorAttackBeamEndTime = currentTime + majorAttackBeamDuration;
            
            // Create energy beam
            this.createEnergyBeam(enemy, beamAngle, currentTime);
          }
        }
        
        // Regular lightning attack (only if not using major attack)
        if (!enemy.majorAttackChargeStartTime && !enemy.majorAttackBeamStartTime) {
          // Attack if within range and not already firing (no charge time, only cooldown)
          if (distToPlayer <= attackRange && !enemy.lightningBeamStartTime) {
            // Check cooldown and fire immediately
            if (!enemy.lastAttackTime || currentTime - enemy.lastAttackTime >= lightningCooldown) {
              // Create lightning path: enemy -> nearby enemies -> player
              const lightningPath = this.createLightningPath(enemy, playerPos);
              
              enemy.lightningBeamStartTime = currentTime;
              enemy.lightningBeamPath = lightningPath;
              enemy.lightningBeamEndTime = currentTime + attackConfig.lightningDuration;
              enemy.lastAttackTime = currentTime;
              
              // Create lightning beam
              this.createLightningBeam(enemy, lightningPath, currentTime);
            }
          }
        }
      }
    });

    // Respawn enemies that are too far from player (behind the player)
    enemiesToRespawn.forEach((enemy) => {
      // Respawn behind player
      if (mousePos) {
        const spawnDistance = 700;
        const angle = Math.atan2(mousePos.y - playerPos.y, mousePos.x - playerPos.x);
        const behindAngle = angle + Math.PI; // 180 degrees opposite
        
        // Spawn behind player with some random offset
        const randomOffset = (Math.random() - 0.5) * 400; // Random offset up to 200 units
        enemy.position.x = playerPos.x + Math.cos(behindAngle) * spawnDistance + Math.cos(behindAngle + Math.PI / 2) * randomOffset;
        enemy.position.y = playerPos.y + Math.sin(behindAngle) * spawnDistance + Math.sin(behindAngle + Math.PI / 2) * randomOffset;
        
        // Reset enemy state
        if (enemy.chargeStartTime) {
          // Only stop sound if charging was actually in progress
          if (this.onChargingStopped) {
            this.onChargingStopped();
          }
        }
        enemy.chargeStartTime = undefined;
        enemy.chargeTargetPos = undefined;
        enemy.lastAttackTime = 0;
      } else {
        // Fallback: spawn at a random position behind player (opposite of player's last known direction)
        const spawnDistance = 700;
        const randomAngle = Math.random() * Math.PI * 2;
        // Spawn in a semi-circle behind player (180 degrees)
        const behindAngle = randomAngle + Math.PI;
        enemy.position.x = playerPos.x + Math.cos(behindAngle) * spawnDistance;
        enemy.position.y = playerPos.y + Math.sin(behindAngle) * spawnDistance;
        
        // Reset enemy state
        if (enemy.chargeStartTime) {
          // Only stop sound if charging was actually in progress
          if (this.onChargingStopped) {
            this.onChargingStopped();
          }
        }
        enemy.chargeStartTime = undefined;
        enemy.chargeTargetPos = undefined;
        enemy.lastAttackTime = 0;
      }
    });

    // Update enemy projectiles
    this.updateEnemyProjectiles(deltaTime, playerPos);
    
    // Update laser beams (remove expired ones)
    this.updateLaserBeams(currentTime);
    
    // Update lightning beams (remove expired ones)
    this.updateLightningBeams(currentTime);
    
    // Update energy beams (remove expired ones)
    this.updateEnergyBeams(currentTime);
  }

  private createLaserBeam(enemy: Enemy, angle: number, startTime: number): void {
    const attackConfig = GAME_BALANCE.enemies.attack;
    const beam: LaserBeam = {
      id: generateId(),
      startPosition: { ...enemy.position },
      angle: angle,
      startTime: startTime,
      endTime: startTime + attackConfig.laserBeamDuration,
      damage: attackConfig.laserBeamDamage,
      enemyId: enemy.id,
    };
    this.laserBeams.push(beam);
  }

  private updateLaserBeams(currentTime: number): void {
    // Remove expired laser beams
    this.laserBeams = this.laserBeams.filter(beam => currentTime < beam.endTime);
  }

  getLaserBeams(): LaserBeam[] {
    return this.laserBeams;
  }

  private createLightningPath(enemy: Enemy, playerPos: Position): Position[] {
    const path: Position[] = [enemy.position]; // Start from enemy
    
    // Find nearby enemies (excluding self and other lazer enemies)
    const lightningRange = GAME_BALANCE.enemies.attack.lightningBounceRange || 300;
    const nearbyEnemies = this.enemies.filter(e => 
      e.id !== enemy.id && 
      e.type !== EnemyType.LAZER &&
      distance(enemy.position, e.position) <= lightningRange
    );
    
    // Sort by distance and take up to 3 nearby enemies for bouncing
    nearbyEnemies.sort((a, b) => 
      distance(enemy.position, a.position) - distance(enemy.position, b.position)
    );
    const bounceEnemies = nearbyEnemies.slice(0, 3);
    
    // Create zigzag path through nearby enemies
    let currentPos = enemy.position;
    const usedEnemies = new Set<string>();
    
    for (const bounceEnemy of bounceEnemies) {
      if (!usedEnemies.has(bounceEnemy.id)) {
        path.push(bounceEnemy.position);
        currentPos = bounceEnemy.position;
        usedEnemies.add(bounceEnemy.id);
      }
    }
    
    // Always end at player
    path.push(playerPos);
    
    return path;
  }

  private createLightningBeam(enemy: Enemy, path: Position[], startTime: number): void {
    const attackConfig = GAME_BALANCE.enemies.attack;
    const beam: LightningBeam = {
      id: generateId(),
      path: path,
      startTime: startTime,
      endTime: startTime + attackConfig.lightningDuration,
      damage: attackConfig.lightningDamage,
      enemyId: enemy.id,
    };
    this.lightningBeams.push(beam);
  }

  private updateLightningBeams(currentTime: number): void {
    // Remove expired lightning beams
    this.lightningBeams = this.lightningBeams.filter(beam => currentTime < beam.endTime);
  }

  getLightningBeams(): LightningBeam[] {
    return this.lightningBeams;
  }

  private createEnergyBeam(enemy: Enemy, angle: number, startTime: number): void {
    const attackConfig = GAME_BALANCE.enemies.attack;
    const beam: EnergyBeam = {
      id: generateId(),
      startPosition: { ...enemy.position }, // Use current enemy position (after teleport)
      angle: angle,
      startTime: startTime,
      endTime: startTime + attackConfig.majorAttackBeamDuration,
      damage: attackConfig.majorAttackBeamDamage,
      enemyId: enemy.id,
    };
    this.energyBeams.push(beam);
  }

  private updateEnergyBeams(currentTime: number): void {
    // Remove expired energy beams
    this.energyBeams = this.energyBeams.filter(beam => currentTime < beam.endTime);
  }

  getEnergyBeams(): EnergyBeam[] {
    return this.energyBeams;
  }

  private shootChargedShot(enemy: Enemy, playerPos: Position): void {
    const angle = Math.atan2(
      playerPos.y - enemy.position.y,
      playerPos.x - enemy.position.x
    );
    
    // Charged shot: single powerful, extremely fast projectile in straight line
    const attackConfig = GAME_BALANCE.enemies.attack;
    const speed = attackConfig.chargedProjectileSpeed;
    const chargedDamage = enemy.damage * attackConfig.chargedDamageMultiplier;
    
    this.enemyProjectiles.push({
      id: generateId(),
      position: { ...enemy.position },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      damage: chargedDamage,
      size: attackConfig.chargedProjectileSize,
      isHoming: false,
      indestructible: true, // Charged shots cannot be destroyed by player weapons
    });
    
    // Play charged shot firing sound effect
    if (this.onChargedShotFired) {
      this.onChargedShotFired();
    }
  }

  private shootAtPlayer(enemy: Enemy, playerPos: Position, wave: number): void {
    const attackConfig = GAME_BALANCE.enemies.attack;
    const projCount = attackConfig.projectileCount;
    
    // Reduce projectile count for early waves
    let projectileCount: number;
    if (wave <= 1) {
      projectileCount = projCount.wave1;
    } else if (wave <= 3) {
      projectileCount = projCount.wave2to3.min + Math.floor(Math.random() * (projCount.wave2to3.max - projCount.wave2to3.min + 1));
    } else {
      projectileCount = projCount.wave4Plus.min + Math.floor(Math.random() * (projCount.wave4Plus.max - projCount.wave4Plus.min + 1));
    }
    
    const spreadAngle = Math.PI / 6; // 30 degree spread
    
    const baseAngle = Math.atan2(
      playerPos.y - enemy.position.y,
      playerPos.x - enemy.position.x
    );

    // Determine if we should shoot homing blue balls
    const homingChances = attackConfig.homingChance;
    let homingChance: number = homingChances.wave1to2;
    if (wave >= 3 && wave <= 4) {
      homingChance = homingChances.wave3to4;
    } else if (wave >= 5 && wave <= 7) {
      homingChance = homingChances.wave5to7;
    } else if (wave >= 8) {
      homingChance = homingChances.wave8Plus;
    }
    const shouldShootHoming = Math.random() < homingChance;
    
    // Determine how many homing projectiles to shoot (1-2, same as regular projectiles)
    let homingCount = 0;
    if (shouldShootHoming) {
      homingCount = 1 + Math.floor(Math.random() * 2); // 1 or 2 homing projectiles
    }

    for (let i = 0; i < projectileCount; i++) {
      // For single projectile, no spread
      const angleOffset = projectileCount > 1 
        ? (i - (projectileCount - 1) / 2) * spreadAngle / (projectileCount - 1)
        : 0;
      const angle = baseAngle + angleOffset;
      const speed = attackConfig.projectileSpeed;
      
      // Check if this projectile should be homing (last N projectiles where N = homingCount)
      const isHoming = shouldShootHoming && i >= projectileCount - homingCount;
      
      this.enemyProjectiles.push({
        id: generateId(),
        position: { ...enemy.position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed,
        },
        damage: enemy.damage * 0.6, // Projectiles do 60% of melee damage
        size: isHoming ? 24 : attackConfig.projectileSize,
        isHoming: isHoming,
      });
    }
    
    // Play sound effect when projectiles are fired (only once per attack, not per projectile)
    if (this.onProjectileFired && projectileCount > 0) {
      this.onProjectileFired();
    }
  }

  private updateEnemyProjectiles(deltaTime: number, playerPos: Position): void {
    // Move projectiles
    const attackConfig = GAME_BALANCE.enemies.attack;
    this.enemyProjectiles.forEach((proj) => {
      // Homing projectiles follow the player
      if (proj.isHoming) {
        const direction = normalize({
          x: playerPos.x - proj.position.x,
          y: playerPos.y - proj.position.y,
        });
        const homingSpeed = attackConfig.homingProjectileSpeed;
        const turnRate = 0.2; // Turn rate (can be added to config if needed)
        
        // Gradually turn toward player
        proj.velocity.x += direction.x * homingSpeed * turnRate;
        proj.velocity.y += direction.y * homingSpeed * turnRate;
        
        // Normalize velocity to maintain consistent speed
        const currentSpeed = Math.sqrt(proj.velocity.x * proj.velocity.x + proj.velocity.y * proj.velocity.y);
        if (currentSpeed > 0) {
          proj.velocity.x = (proj.velocity.x / currentSpeed) * homingSpeed;
          proj.velocity.y = (proj.velocity.y / currentSpeed) * homingSpeed;
        }
      }
      
      proj.position.x += proj.velocity.x * (deltaTime / 16);
      proj.position.y += proj.velocity.y * (deltaTime / 16);
    });

    // Remove projectiles that are too far from player
    const maxDistance = 800;
    this.enemyProjectiles = this.enemyProjectiles.filter((proj) => {
      const dist = distance(proj.position, playerPos);
      return dist < maxDistance;
    });
  }

  getEnemyProjectiles(): Projectile[] {
    return this.enemyProjectiles;
  }

  removeEnemyProjectile(projectileId: string): void {
    this.enemyProjectiles = this.enemyProjectiles.filter((p) => p.id !== projectileId);
  }

  damageEnemy(enemyId: string, damage: number, knockback: number, playerPos: Position): { killed: boolean; position?: Position; shouldSplit?: boolean; exploded?: boolean; explosionDamage?: number } {
    const enemy = this.enemies.find((e) => e.id === enemyId);
    if (!enemy) return { killed: false };

    // Check if enemy is currently shielded by a nearby STRONG enemy
    // Only non-STRONG enemies can be shielded
    let isShielded = false;
    const shieldRange = 200;
    
    if (enemy.type !== EnemyType.STRONG) {
      for (const strongEnemy of this.enemies) {
        if (strongEnemy.type === EnemyType.STRONG && strongEnemy.id !== enemy.id) {
          const dist = distance(strongEnemy.position, enemy.position);
          if (dist <= shieldRange) {
            isShielded = true;
            break; // Found a shield, no need to check others
          }
        }
      }
    }

    // Shielded enemies take 0 damage (complete immunity)
    const effectiveDamage = isShielded ? 0 : damage;
    
    // Play shield block sound if enemy is shielded
    if (isShielded && this.onShieldBlocked) {
      this.onShieldBlocked();
    }
    
    enemy.health -= effectiveDamage;

    const direction = normalize({
      x: enemy.position.x - playerPos.x,
      y: enemy.position.y - playerPos.y,
    });

    enemy.position.x += direction.x * knockback;
    enemy.position.y += direction.y * knockback;

    if (enemy.health <= 0) {
      const deathPosition = { ...enemy.position };
      const shouldSplit = enemy.type === EnemyType.STRONG;
      const isWeakEnemy = enemy.type === EnemyType.WEAK;
      
      // Stop charging sound if enemy was charging when it died
      if (enemy.chargeStartTime && this.onChargingStopped) {
        this.onChargingStopped();
      }
      
      // Remove the enemy
      this.enemies = this.enemies.filter((e) => e.id !== enemyId);
      
      // If it's a STRONG enemy, spawn split enemies
      if (shouldSplit) {
        this.splitEnemy(deathPosition);
      }
      
      // If it's a WEAK enemy, it always explodes on death (except split enemies)
      if (isWeakEnemy && !enemy.isSplitEnemy) {
        const explosionDamage = GAME_BALANCE.enemies.weak.explosionDamageOnDeath;
        const distToPlayer = distance(deathPosition, playerPos);
        const explosionRadius = GAME_BALANCE.enemies.weak.explosionRadius;
        
        // Play explosion sound effect
        if (this.onWeakEnemyExploded) {
          this.onWeakEnemyExploded();
        }
        
        // Always return explosion info (visual effect always happens)
        // Damage is only applied if player is in range
        return { 
          killed: true, 
          position: deathPosition, 
          shouldSplit: false,
          exploded: true,
          explosionDamage: distToPlayer <= explosionRadius ? explosionDamage : 0
        };
      }
      
      // If it's a NORMAL enemy, play death sound
      if (enemy.type === EnemyType.NORMAL) {
        if (this.onNormalEnemyDied) {
          this.onNormalEnemyDied();
        }
      }
      
      return { killed: true, position: deathPosition, shouldSplit };
    }

    return { killed: false };
  }

  private splitEnemy(position: Position): void {
    // Play split sound effect
    if (this.onEnemySplit) {
      this.onEnemySplit();
    }
    
    // Spawn 2-3 smaller enemies (WEAK type) when STRONG enemy dies
    const splitCount = 2 + Math.floor(Math.random() * 2); // 2 or 3 enemies
    
    for (let i = 0; i < splitCount; i++) {
      // Spawn split enemies in a circle around the death position
      const angle = (Math.PI * 2 * i) / splitCount;
      const spawnDistance = 40;
      const splitPosition: Position = {
        x: position.x + Math.cos(angle) * spawnDistance,
        y: position.y + Math.sin(angle) * spawnDistance,
      };

      // Create a WEAK enemy with reduced stats
      const splitHealth = Math.floor(this.waveBaseHealth * 0.4); // 40% of base health
      const splitSpeed = this.waveBaseSpeed * 1.2; // 20% faster
      const splitDamage = Math.floor(this.waveBaseDamage * 0.5); // 50% of base damage

      this.enemies.push({
        id: generateId(),
        position: splitPosition,
        health: splitHealth,
        maxHealth: splitHealth,
        speed: splitSpeed,
        damage: splitDamage,
        size: 60, // Smaller than normal weak enemies
        type: EnemyType.WEAK,
        lastAttackTime: 0,
        isSplitEnemy: true, // Mark as split enemy to use STRONG sprite
        level: this.currentWave, // Set enemy level to current wave
      });
    }
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  checkPlayerCollision(playerPos: Position, playerSize: number): { damage: number; explodedEnemies: Array<{ position: Position; damage: number }> } {
    let totalDamage = 0;
    const explodedEnemies: Array<{ position: Position; damage: number }> = [];

    this.enemies.forEach((enemy) => {
      const dist = distance(playerPos, enemy.position);
      if (dist < (playerSize + enemy.size) / 2) {
        // WEAK enemies explode on contact, dealing massive damage (except split enemies)
        if (enemy.type === EnemyType.WEAK && !enemy.isSplitEnemy) {
          const explosionDamage = GAME_BALANCE.enemies.weak.explosionDamageOnContact;
          explodedEnemies.push({
            position: { ...enemy.position },
            damage: explosionDamage
          });
          totalDamage += explosionDamage;
          
          // Play explosion sound effect
          if (this.onWeakEnemyExploded) {
            this.onWeakEnemyExploded();
          }
          
          // Remove the weak enemy after explosion
          this.enemies = this.enemies.filter((e) => e.id !== enemy.id);
        } else {
          // Other enemies (including split enemies) deal normal damage
          totalDamage += enemy.damage;
        }
      }
    });

    return { damage: totalDamage, explodedEnemies };
  }

  clear(): void {
    this.enemies = [];
    this.enemyProjectiles = [];
    this.laserBeams = [];
    this.lightningBeams = [];
    this.energyBeams = [];
    this.spawnedEnemiesThisWave = 0;
    this.spawnedLazerEnemiesThisWave = 0;
    this.lastGlobalMajorAttackTime = 0;
    this.targetEnemyCount = 0;
    this.currentWave = 0;
    this.lastSpawnTime = 0;
  }

  isEmpty(): boolean {
    // Wave is complete only if all enemies are spawned AND all are defeated
    return this.enemies.length === 0 && this.spawnedEnemiesThisWave >= this.targetEnemyCount;
  }

  hasFinishedSpawning(): boolean {
    return this.spawnedEnemiesThisWave >= this.targetEnemyCount;
  }

  getCount(): number {
    return this.enemies.length;
  }

  getTargetCount(): number {
    return this.targetEnemyCount;
  }

  getKilledCount(): number {
    // Ensure we never return negative (safety check)
    const killed = this.spawnedEnemiesThisWave - this.enemies.length;
    return Math.max(0, killed);
  }
}
