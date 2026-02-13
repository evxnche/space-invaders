import { SPRITES, COLORS } from './sprites.js';

export class UFO {
  constructor(renderer) {
    this.renderer = renderer;
    const size = renderer.getSpriteSize(SPRITES.ufo);
    this.w = size.w;
    this.h = size.h;
    this.active = false;
    this.x = 0;
    this.y = 40;
    this.direction = 1;
    this.speed = 120;
    this.spawnTimer = 0;
    this.spawnInterval = 20; // seconds between spawns
    this.scoreValues = [50, 100, 150, 200, 300];
    this.showScore = false;
    this.scoreX = 0;
    this.scoreValue = 0;
    this.scoreTimer = 0;
  }

  reset() {
    this.active = false;
    this.showScore = false;
    this.spawnTimer = 0;
  }

  update(dt) {
    if (this.showScore) {
      this.scoreTimer -= dt;
      if (this.scoreTimer <= 0) this.showScore = false;
    }

    if (!this.active) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawn();
      }
      return;
    }

    this.x += this.speed * this.direction * dt;

    if ((this.direction === 1 && this.x > this.renderer.width + 20) ||
        (this.direction === -1 && this.x + this.w < -20)) {
      this.active = false;
    }
  }

  spawn() {
    this.active = true;
    this.spawnTimer = 0;
    this.direction = Math.random() < 0.5 ? 1 : -1;
    this.x = this.direction === 1 ? -this.w - 10 : this.renderer.width + 10;
    this.spawnInterval = 15 + Math.random() * 15;
  }

  hit() {
    this.active = false;
    this.scoreValue = this.scoreValues[Math.floor(Math.random() * this.scoreValues.length)];
    this.showScore = true;
    this.scoreX = this.x;
    this.scoreTimer = 1;
    return {
      points: this.scoreValue,
      x: this.x,
      y: this.y,
      w: this.w,
      h: this.h,
    };
  }

  draw() {
    if (this.showScore) {
      this.renderer.drawText(
        this.scoreValue.toString(),
        this.scoreX + this.w / 2, this.y + 2,
        COLORS.ufo, 10, 'center'
      );
    }

    if (!this.active) return;
    this.renderer.drawSprite(SPRITES.ufo, this.x, this.y, COLORS.ufo);
  }
}
