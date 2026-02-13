import { COLORS } from './sprites.js';

export class BulletManager {
  constructor(renderer) {
    this.renderer = renderer;
    this.enemyBullets = [];
  }

  addEnemyBullet(x, y) {
    this.enemyBullets.push({
      x: x - 1.5,
      y,
      w: 3,
      h: 12,
      speed: 250,
    });
  }

  update(dt) {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      this.enemyBullets[i].y += this.enemyBullets[i].speed * dt;
      if (this.enemyBullets[i].y > this.renderer.height) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  removeEnemyBullet(index) {
    this.enemyBullets.splice(index, 1);
  }

  reset() {
    this.enemyBullets = [];
  }

  draw() {
    for (const b of this.enemyBullets) {
      this.renderer.drawRect(b.x, b.y, b.w, b.h, COLORS.enemyBullet);
    }
  }
}
