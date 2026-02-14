import { theme } from './theme.js';

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
