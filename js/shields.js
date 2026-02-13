import { SPRITES } from './sprites.js';

export class ShieldManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.shields = [];
    this.pixelSize = renderer.pixelSize;
  }

  init() {
    this.shields = [];
    const shieldTemplate = SPRITES.shield;
    const shieldW = shieldTemplate[0].length * this.pixelSize;
    const totalW = 4 * shieldW;
    const gap = (this.renderer.width - totalW - 120) / 3;
    const startX = 60;
    const y = this.renderer.height - 140;

    for (let i = 0; i < 4; i++) {
      this.shields.push({
        x: startX + i * (shieldW + gap),
        y,
        data: shieldTemplate.map(row => [...row]),
      });
    }
  }

  checkBulletCollision(bx, by, bw, bh) {
    for (const shield of this.shields) {
      const sw = shield.data[0].length * this.pixelSize;
      const sh = shield.data.length * this.pixelSize;

      // Quick AABB check
      if (bx + bw < shield.x || bx > shield.x + sw) continue;
      if (by + bh < shield.y || by > shield.y + sh) continue;

      // Pixel-level check and erosion
      let hit = false;
      const erodeRadius = 2;

      for (let row = 0; row < shield.data.length; row++) {
        for (let col = 0; col < shield.data[row].length; col++) {
          if (!shield.data[row][col]) continue;

          const px = shield.x + col * this.pixelSize;
          const py = shield.y + row * this.pixelSize;

          if (bx < px + this.pixelSize && bx + bw > px &&
              by < py + this.pixelSize && by + bh > py) {
            hit = true;
            // Erode nearby pixels
            for (let dr = -erodeRadius; dr <= erodeRadius; dr++) {
              for (let dc = -erodeRadius; dc <= erodeRadius; dc++) {
                const nr = row + dr;
                const nc = col + dc;
                if (nr >= 0 && nr < shield.data.length &&
                    nc >= 0 && nc < shield.data[nr].length) {
                  if (Math.random() < 0.7) {
                    shield.data[nr][nc] = 0;
                  }
                }
              }
            }
          }
        }
      }

      if (hit) return true;
    }
    return false;
  }

  checkEnemyOverlap(enemies) {
    for (const shield of this.shields) {
      const sw = shield.data[0].length * this.pixelSize;
      const sh = shield.data.length * this.pixelSize;

      for (const e of enemies) {
        if (!e.alive) continue;
        if (e.x + e.w < shield.x || e.x > shield.x + sw) continue;
        if (e.y + e.h < shield.y || e.y > shield.y + sh) continue;

        // Enemy overlaps shield — erase overlapping pixels
        for (let row = 0; row < shield.data.length; row++) {
          for (let col = 0; col < shield.data[row].length; col++) {
            if (!shield.data[row][col]) continue;
            const px = shield.x + col * this.pixelSize;
            const py = shield.y + row * this.pixelSize;
            if (e.x < px + this.pixelSize && e.x + e.w > px &&
                e.y < py + this.pixelSize && e.y + e.h > py) {
              shield.data[row][col] = 0;
            }
          }
        }
      }
    }
  }

  draw() {
    for (const shield of this.shields) {
      this.renderer.drawShield(shield);
    }
  }
}
