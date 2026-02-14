// Player uses head.png (Mario) as sprite, cball.png as bullets, fries.png as protected item

const PLAYER_W = 64;
const PLAYER_H = 64;
const BULLET_SIZE = 18; // cball.png rendered as square
const FRIES_W = 46;
const FRIES_H = 60;

export class Player {
  constructor(renderer) {
    this.renderer = renderer;
    this.w = PLAYER_W;
    this.h = PLAYER_H;
    this.x = (renderer.width - this.w) / 2;
    this.y = renderer.height - this.h - 28;
    this.speed = 300;
    this.lives = 3;
    this.bullets = [];
    this.maxBullets = 3;
    this.dead = false;
    this.respawnTimer = 0;
    this.blinkTimer = 0;
    this.lastFireTime = 0;
    this.fireCooldown = 500;
  }

  reset(full) {
    this.x = (this.renderer.width - this.w) / 2;
    this.y = this.renderer.height - this.h - 28;
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
      x: this.x + this.w / 2 - BULLET_SIZE / 2,
      y: this.y - BULLET_SIZE,
      w: BULLET_SIZE,
      h: BULLET_SIZE,
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
    // Draw player bullets as cball.png
    for (const b of this.bullets) {
      this.renderer.drawImg('cball', b.x, b.y, b.w, b.h);
    }

    if (this.dead) return;
    if (this.blinkTimer > 0 && Math.floor(this.blinkTimer * 10) % 2 === 0) return;

    // Draw fries behind (to the right of) Mario
    this.renderer.drawImg('fries', this.x + this.w + 4, this.y + this.h - FRIES_H, FRIES_W, FRIES_H);

    // Draw Mario (head.png)
    this.renderer.drawImg('head', this.x, this.y, this.w, this.h);
  }
}
