// Sprite Manager for loading and managing game sprites

export class SpriteManager {
  private sprites: Map<string, HTMLImageElement> = new Map();
  private loaded: boolean = false;
  private loadPromises: Promise<void>[] = [];

  async loadSprites(): Promise<void> {
    const spritePaths = {
      player: '/assets/sprites/player.png',
      gun: '/assets/sprites/gun.png', // Fallback for old code
      weapon_pistol: '/assets/sprites/weapon_pistol.png',
      weapon_shotgun: '/assets/sprites/weapon_shotgun.png',
      weapon_sword: '/assets/sprites/weapon_sword.png',
      weapon_assault_rifle: '/assets/sprites/weapon_assault_rifle.png',
      weapon_rifle: '/assets/sprites/weapon_rifle.png',
      enemy: '/assets/sprites/enemy.png',
      enemy_weak: '/assets/sprites/enemy_weak.png',
      enemy_normal: '/assets/sprites/enemy_normal.png',
      enemy_strong: '/assets/sprites/enemy_strong.png',
      projectile: '/assets/sprites/projectile.png',
      background: '/assets/sprites/background.png',
      slash_effect: '/assets/sprites/slash.png',
      chest_closed: '/assets/sprites/chest_closed.png',
      chest_open: '/assets/sprites/chest_open.png',
      health_pickup: '/assets/health.png',
      ammo_pickup: '/assets/ammo.png',
      vest_pickup: '/assets/vest.png',
    };

    // Background should be loaded first and can fail silently (use fallback)
    const backgroundPath = spritePaths.background;
    const loadBackground = (): Promise<void> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          this.sprites.set('background', img);
          resolve();
        };
        img.onerror = () => {
          // Background can fail, we'll use fallback grid
          resolve();
        };
        img.src = backgroundPath;
      });
    };

    const loadImage = (name: string, path: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          this.sprites.set(name, img);
          resolve();
        };
        img.onerror = () => {
          // If image fails to load, create a fallback canvas sprite
          console.warn(`Failed to load sprite: ${path}, using fallback`);
          this.sprites.set(name, this.createFallbackSprite(name));
          resolve();
        };
        img.src = path;
      });
    };

    // Load background first, then other sprites
    this.loadPromises = [
      loadBackground(),
      ...Object.entries(spritePaths)
        .filter(([name]) => name !== 'background')
        .map(([name, path]) => loadImage(name, path))
    ];

    await Promise.all(this.loadPromises);
    this.loaded = true;
  }

  private createFallbackSprite(name: string): HTMLImageElement {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const img = new Image();
      return img;
    }

    canvas.width = 64;
    canvas.height = 64;

    switch (name) {
      case 'player':
        // Create a blue circle sprite (player body, no rotation)
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Add simple face/features
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(24, 24, 4, 0, Math.PI * 2); // Left eye
        ctx.arc(40, 24, 4, 0, Math.PI * 2); // Right eye
        ctx.fill();
        break;

      case 'gun':
        // Create a simple gun sprite (fallback)
        ctx.fillStyle = '#654321';
        // Gun body
        ctx.fillRect(20, 28, 24, 8);
        // Gun barrel
        ctx.fillRect(44, 30, 12, 4);
        // Gun handle
        ctx.fillRect(22, 36, 6, 10);
        // Gun details
        ctx.fillStyle = '#333333';
        ctx.fillRect(20, 28, 24, 2);
        break;
      case 'weapon_pistol':
        // Create a pistol shape
        ctx.fillStyle = '#654321';
        ctx.fillRect(20, 28, 20, 6);
        // Barrel
        ctx.fillRect(40, 30, 8, 2);
        // Handle
        ctx.fillRect(22, 34, 5, 8);
        break;
      case 'weapon_shotgun':
        // Create a shotgun shape (wider barrel)
        ctx.fillStyle = '#654321';
        ctx.fillRect(20, 26, 24, 10);
        // Wide barrel
        ctx.fillRect(44, 28, 10, 6);
        // Handle
        ctx.fillRect(22, 36, 6, 10);
        break;
      case 'weapon_sword':
        // Create a sword shape
        ctx.fillStyle = '#C0C0C0';
        // Blade
        ctx.fillRect(30, 10, 4, 30);
        // Hilt
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(28, 8, 8, 6);
        // Handle
        ctx.fillRect(30, 40, 4, 8);
        break;
      case 'weapon_assault_rifle':
        // Create an assault rifle shape
        ctx.fillStyle = '#654321';
        ctx.fillRect(18, 28, 28, 6);
        // Barrel
        ctx.fillRect(46, 29, 8, 4);
        // Stock
        ctx.fillRect(18, 34, 10, 6);
        // Handle
        ctx.fillRect(22, 34, 4, 8);
        break;
      case 'weapon_rifle':
        // Create a rifle shape (longer)
        ctx.fillStyle = '#654321';
        ctx.fillRect(16, 28, 32, 6);
        // Long barrel
        ctx.fillRect(48, 29, 12, 4);
        // Stock
        ctx.fillRect(16, 34, 12, 6);
        // Handle
        ctx.fillRect(22, 34, 4, 8);
        break;

      case 'enemy':
      case 'enemy_normal':
        // Create a red circle with spikes (normal enemy)
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(32, 32, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Add spikes
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const x1 = 32 + Math.cos(angle) * 24;
          const y1 = 32 + Math.sin(angle) * 24;
          const x2 = 32 + Math.cos(angle) * 30;
          const y2 = 32 + Math.sin(angle) * 30;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        break;

      case 'enemy_weak':
        // Create a smaller orange circle (weak enemy)
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(32, 32, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Simpler design - just a circle
        break;

      case 'enemy_strong':
        // Create a larger dark red circle with more spikes (strong enemy)
        ctx.fillStyle = '#8b0000';
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5a0000';
        ctx.lineWidth = 4;
        ctx.stroke();
        // Add more spikes
        for (let i = 0; i < 12; i++) {
          const angle = (i / 12) * Math.PI * 2;
          const x1 = 32 + Math.cos(angle) * 28;
          const y1 = 32 + Math.sin(angle) * 28;
          const x2 = 32 + Math.cos(angle) * 36;
          const y2 = 32 + Math.sin(angle) * 36;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
        // Add inner circle for extra detail
        ctx.fillStyle = '#a00000';
        ctx.beginPath();
        ctx.arc(32, 32, 16, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'projectile':
        // Create an orange bullet sprite
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(32, 32, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#e67e22';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#f39c12';
        ctx.fill();
        break;

      default:
        // Default gray square
        ctx.fillStyle = '#95a5a6';
        ctx.fillRect(0, 0, 64, 64);
    }

    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }

  getSprite(name: string): HTMLImageElement | null {
    return this.sprites.get(name) || null;
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  // Draw sprite with rotation and scaling, maintaining aspect ratio
  drawSprite(
    ctx: CanvasRenderingContext2D,
    spriteName: string,
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number = 0
  ): void {
    const sprite = this.getSprite(spriteName);
    if (!sprite) return;

    // Calculate aspect ratio
    const spriteAspect = sprite.width / sprite.height;
    const targetAspect = width / height;

    let drawWidth = width;
    let drawHeight = height;

    // Maintain aspect ratio - fit within the target size
    if (spriteAspect > targetAspect) {
      // Sprite is wider - fit to width
      drawHeight = width / spriteAspect;
    } else {
      // Sprite is taller - fit to height
      drawWidth = height * spriteAspect;
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.drawImage(sprite, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    ctx.restore();
  }
}

export const spriteManager = new SpriteManager();

