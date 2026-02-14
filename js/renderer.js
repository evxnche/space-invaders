import { theme } from './theme.js';
import { IMGS } from './images.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = canvas.width;
    this.height = canvas.height;
    this.pixelSize = 3;
  }

  clear() {
    this.ctx.fillStyle = theme.colors.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawSprite(spriteData, x, y, color, scale) {
    const ps = (scale || 1) * this.pixelSize;
    this.ctx.fillStyle = color;
    for (let row = 0; row < spriteData.length; row++) {
      for (let col = 0; col < spriteData[row].length; col++) {
        if (spriteData[row][col]) {
          this.ctx.fillRect(x + col * ps, y + row * ps, ps, ps);
        }
      }
    }
  }

  getSpriteSize(spriteData, scale) {
    const ps = (scale || 1) * this.pixelSize;
    return {
      w: spriteData[0].length * ps,
      h: spriteData.length * ps,
    };
  }

  // Draw a loaded PNG image
  drawImg(key, x, y, w, h, alpha) {
    const img = IMGS[key];
    if (!img) return;
    if (alpha !== undefined && alpha !== 1) {
      this.ctx.save();
      this.ctx.globalAlpha = alpha;
    }
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(img, x, y, w, h);
    if (alpha !== undefined && alpha !== 1) {
      this.ctx.restore();
    }
  }

  // Draw a shield PNG with pixel-level erosion mask
  drawShieldPNG(shield, imgKey) {
    const img = IMGS[imgKey];
    if (!img) {
      this.drawShield(shield);
      return;
    }
    const rows = shield.data.length;
    const cols = shield.data[0].length;
    const ps = shield.pixelSize || this.pixelSize;
    // Draw each surviving pixel as its corresponding sub-region of the PNG
    this.ctx.imageSmoothingEnabled = false;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (shield.data[row][col]) {
          const srcX = Math.floor((col / cols) * img.width);
          const srcY = Math.floor((row / rows) * img.height);
          const srcW = Math.max(1, Math.floor(img.width / cols));
          const srcH = Math.max(1, Math.floor(img.height / rows));
          this.ctx.drawImage(
            img, srcX, srcY, srcW, srcH,
            shield.x + col * ps, shield.y + row * ps, ps, ps
          );
        }
      }
    }
  }

  drawRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  drawText(text, x, y, color, size, align, font) {
    this.ctx.fillStyle = color || theme.colors.text;
    const family = font || '"Barlow Condensed", "Oswald", sans-serif';
    this.ctx.font = `700 ${size || 16}px ${family}`;
    this.ctx.textAlign = align || 'left';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(text, x, y);
  }

  drawTitleText(text, x, y, color, size, align) {
    this.drawText(text, x, y, color, size, align, '"Press Start 2P", monospace');
  }

  drawShield(shield) {
    const ps = this.pixelSize;
    this.ctx.fillStyle = theme.colors.shield;
    for (let row = 0; row < shield.data.length; row++) {
      for (let col = 0; col < shield.data[row].length; col++) {
        if (shield.data[row][col]) {
          this.ctx.fillRect(shield.x + col * ps, shield.y + row * ps, ps, ps);
        }
      }
    }
  }

  drawParticles(particles) {
    for (const p of particles) {
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    this.ctx.globalAlpha = 1;
  }
}
