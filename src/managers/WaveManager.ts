import { PowerUp } from '../types/game';
import { POWER_UPS } from '../data/powerups';

export class WaveManager {
  private currentWave: number = 4; // TESTING: Start from wave 4
  private waveInProgress: boolean = false;
  private waveCompleted: boolean = false; // Wave cleared, waiting for E press
  private showingPowerUpSelection: boolean = false;

  startWave(): void {
    this.waveInProgress = true;
    this.waveCompleted = false;
    this.showingPowerUpSelection = false;
  }

  completeWave(): void {
    this.waveInProgress = false;
    this.waveCompleted = true; // Show "Press E" screen
    this.showingPowerUpSelection = false;
  }

  showPowerUpSelection(): void {
    this.waveCompleted = false;
    this.showingPowerUpSelection = true;
  }

  nextWave(): void {
    this.currentWave++;
    this.startWave();
  }

  getCurrentWave(): number {
    return this.currentWave;
  }

  isWaveInProgress(): boolean {
    return this.waveInProgress;
  }

  isShowingPowerUpSelection(): boolean {
    return this.showingPowerUpSelection;
  }

  isWaveCompleted(): boolean {
    return this.waveCompleted;
  }

  getRandomPowerUps(count: number = 3): PowerUp[] {
    const shuffled = [...POWER_UPS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  reset(): void {
    this.currentWave = 4; // TESTING: Start from wave 4
    this.waveInProgress = false;
    this.waveCompleted = false;
    this.showingPowerUpSelection = false;
  }
}
