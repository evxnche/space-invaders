import { SPRITES } from './sprites.js';
import { theme } from './theme.js';

export class Player {
  constructor(renderer) {
    this.renderer = renderer;
    const size = renderer.getSpriteSize(SPRITES.player);
    this.w = size.w;
    this.h = size.h;
    this.x = (renderer.width - this.w) / 2;
    this.y = renderer.height - this.h - 30;
    this.speed = 300;
    this.lives = 3;
    this.bullets = [];
    this.maxBullets = 3;
    this.dead = false;
    this.respawnTimer = 0;
    this.blinkTimer = 0;
    this.lastFireTime = 0;
    this.fireCooldown = 300;
  }

  reset(full) {
    const size = this.renderer.getSpriteSize(SPRITES.player);
    this.x = (this.renderer.width - size.w) / 2;
    this.y = this.renderer.height - this.h - 30;
    this.bullets = [];
    this.dead = false;
    this.respawnTimer = 0;
    this.blinkTimer = 0;
    this.lastFireTime = 0;
    if (full) this.lives = 3;
  }

  update(dt, input) {
    if (this.dead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.dead = false;
        this.blinkTimer = 1.5;
        this.x = (this.renderer.width - this.w) / 2;
      }
      return;
    }

    if (this.blinkTimer > 0) this.blinkTimer -= dt;

    if (input.isDown('ArrowLeft') || input.isDown('a')) this.x -= this.speed * dt;
    if (input.isDown('ArrowRight') || input.isDown('d')) this.x += this.speed * dt;

    this.x = Math.max(10, Math.min(this.renderer.width - this.w - 10, this.x));

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].y -= this.bullets[i].speed * dt;
      if (this.bullets[i].y + this.bullets[i].h < 0) this.bullets.splice(i, 1);
    }
  }

  fire() {
    if (this.dead || this.bullets.length >= this.maxBullets) return null;
    const now = performance.now();
    if (now - this.lastFireTime < this.fireCooldown) return null;
    this.lastFireTime = now;
    const bullet = {
      x: this.x + this.w / 2 - 1.5,
      y: this.y - 12,
      w: 3,
      h: 12,
      speed: 600,
    };
    this.bullets.push(bullet);
    return bullet;
  }

  removeBullet(index) {
    this.bullets.splice(index, 1);
  }

  hit() {
    this.dead = true;
    this.respawnTimer = 1.5;
    this.lives--;
    this.bullets = [];
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  draw() {
    const c = theme.colors;
    for (const b of this.bullets) {
      this.renderer.drawRect(b.x, b.y, b.w, b.h, c.bullet);
    }

    if (this.dead) return;
    if (this.blinkTimer > 0 && Math.floor(this.blinkTimer * 10) % 2 === 0) return;

    this.renderer.drawSprite(SPRITES.player, this.x, this.y, c.player);
  }
}
