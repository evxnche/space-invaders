import { SPRITES, COLORS } from './sprites.js';

export class Player {
  constructor(renderer) {
    this.renderer = renderer;
    const size = renderer.getSpriteSize(SPRITES.player);
    this.w = size.w;
    this.h = size.h;
    this.x = (renderer.width - this.w) / 2;
    this.y = renderer.height - this.h - 30;
    this.speed = 300; // pixels per second
    this.lives = 3;
    this.bullet = null;
    this.dead = false;
    this.respawnTimer = 0;
    this.blinkTimer = 0;
  }

  reset(full) {
    const size = this.renderer.getSpriteSize(SPRITES.player);
    this.x = (this.renderer.width - size.w) / 2;
    this.y = this.renderer.height - this.h - 30;
    this.bullet = null;
    this.dead = false;
    this.respawnTimer = 0;
    this.blinkTimer = 0;
    if (full) {
      this.lives = 3;
    }
  }

  update(dt, input) {
    if (this.dead) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.dead = false;
        this.blinkTimer = 1.5; // blink for 1.5s after respawn
        this.x = (this.renderer.width - this.w) / 2;
      }
      return;
    }

    if (this.blinkTimer > 0) {
      this.blinkTimer -= dt;
    }

    if (input.isDown('ArrowLeft') || input.isDown('a')) {
      this.x -= this.speed * dt;
    }
    if (input.isDown('ArrowRight') || input.isDown('d')) {
      this.x += this.speed * dt;
    }

    // Clamp to canvas bounds
    this.x = Math.max(10, Math.min(this.renderer.width - this.w - 10, this.x));

    // Update bullet
    if (this.bullet) {
      this.bullet.y -= this.bullet.speed * dt;
      if (this.bullet.y + this.bullet.h < 0) {
        this.bullet = null;
      }
    }
  }

  fire() {
    if (this.dead || this.bullet) return null;
    this.bullet = {
      x: this.x + this.w / 2 - 1.5,
      y: this.y - 12,
      w: 3,
      h: 12,
      speed: 600,
    };
    return this.bullet;
  }

  hit() {
    this.dead = true;
    this.respawnTimer = 1.5;
    this.lives--;
    this.bullet = null;
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }

  draw() {
    // Draw bullet
    if (this.bullet) {
      this.renderer.drawRect(
        this.bullet.x, this.bullet.y,
        this.bullet.w, this.bullet.h,
        COLORS.bullet
      );
    }

    if (this.dead) return;

    // Blink effect after respawn
    if (this.blinkTimer > 0 && Math.floor(this.blinkTimer * 10) % 2 === 0) {
      return;
    }

    this.renderer.drawSprite(SPRITES.player, this.x, this.y, COLORS.player);
  }
}
