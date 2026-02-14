import { SPRITES } from './sprites.js';
import { theme } from './theme.js';

// PNG image keys per enemy type (o1=weakest…o3=strongest, o4=UFO)
const ENEMY_IMG = ['o3', 'o2', 'o1'];
const ENEMY_W = 34;
const ENEMY_H = 32;

const ENEMY_TYPES = [
  { points: 30 },
  { points: 20 },
  { points: 10 },
];

const ROW_TYPE = [0, 1, 1, 2, 2];

export class EnemyGrid {
  constructor(renderer) {
    this.renderer = renderer;
    this.cols = 11;
    this.rows = 5;
    this.enemies = [];
    this.direction = 1;
    this.baseSpeed = 30;
    this.speed = this.baseSpeed;
    this.moveTimer = 0;
    this.moveInterval = 0.6;
    this.animFrame = 0;
    this.descendAmount = 20;
    this.needsDescent = false;
    this.fireTimer = 0;
    this.fireInterval = 1.5;
    this.totalEnemies = this.rows * this.cols;
    this.aliveCount = this.totalEnemies;
    this.levelOffset = 0;
  }

  init(level) {
    this.enemies = [];
    this.direction = 1;
    this.animFrame = 0;
    this.moveTimer = 0;
    this.needsDescent = false;
    this.fireTimer = 0;
    this.aliveCount = this.rows * this.cols;
    this.levelOffset = Math.min((level - 1) * 15, 120);

    const spacing = 52;
    const rowHeight = 42;
    const startX = 50;
    const startY = 80 + this.levelOffset;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const typeIdx = ROW_TYPE[row];
        this.enemies.push({
          x: startX + col * spacing,
          y: startY + row * rowHeight,
          w: ENEMY_W,
          h: ENEMY_H,
          type: typeIdx,
          alive: true,
          exploding: false,
          explodeTimer: 0,
        });
      }
    }

    this.moveInterval = Math.max(0.1, 0.6 - (level - 1) * 0.05);
    this.fireInterval = Math.max(0.3, 1.5 - (level - 1) * 0.1);
  }

  update(dt, bulletManager) {
    for (const e of this.enemies) {
      if (e.exploding) {
        e.explodeTimer -= dt;
        if (e.explodeTimer <= 0) e.exploding = false;
      }
    }

    this.moveTimer += dt;
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;
      this.animFrame = 1 - this.animFrame;

      if (this.needsDescent) {
        for (const e of this.enemies) {
          if (e.alive) e.y += this.descendAmount;
        }
        this.direction *= -1;
        this.needsDescent = false;
      } else {
        const step = 10 * this.direction;
        let hitEdge = false;

        for (const e of this.enemies) {
          if (!e.alive) continue;
          e.x += step;
          if (e.x + e.w > this.renderer.width - 10 || e.x < 10) hitEdge = true;
        }

        if (hitEdge) this.needsDescent = true;
      }

      const ratio = this.aliveCount / this.totalEnemies;
      this.moveInterval = Math.max(0.05, this.moveInterval * (ratio < 0.2 ? 0.95 : 1));
    }

    this.fireTimer += dt;
    const adjustedFireInterval = this.fireInterval * (this.aliveCount / this.totalEnemies + 0.3);
    if (this.fireTimer >= adjustedFireInterval) {
      this.fireTimer = 0;
      this.fireFromBottomRow(bulletManager);
    }
  }

  fireFromBottomRow(bulletManager) {
    const bottomEnemies = [];
    for (let col = 0; col < this.cols; col++) {
      for (let row = this.rows - 1; row >= 0; row--) {
        const idx = row * this.cols + col;
        if (this.enemies[idx].alive) {
          bottomEnemies.push(this.enemies[idx]);
          break;
        }
      }
    }
    if (bottomEnemies.length === 0) return;
    const shooter = bottomEnemies[Math.floor(Math.random() * bottomEnemies.length)];
    bulletManager.addEnemyBullet(shooter.x + shooter.w / 2, shooter.y + shooter.h);
  }

  killEnemy(index) {
    this.enemies[index].alive = false;
    this.enemies[index].exploding = true;
    this.enemies[index].explodeTimer = 0.2;
    this.aliveCount--;

    if (this.aliveCount > 0) {
      const ratio = this.aliveCount / this.totalEnemies;
      if (ratio < 0.1) this.moveInterval = 0.05;
      else if (ratio < 0.25) this.moveInterval = 0.1;
      else if (ratio < 0.5) this.moveInterval = 0.2;
    }
  }

  getLowestY() {
    let lowest = 0;
    for (const e of this.enemies) {
      if (e.alive && e.y + e.h > lowest) lowest = e.y + e.h;
    }
    return lowest;
  }

  draw() {
    const c = theme.colors;
    // animFrame toggles 0/1 on each move tick — use it for a classic squish/stretch anim
    const scale = this.animFrame === 0 ? 1 : 1.12;
    for (const e of this.enemies) {
      if (e.exploding) {
        this.renderer.drawSprite(SPRITES.explosion, e.x, e.y, c.explosion);
        continue;
      }
      if (!e.alive) continue;
      const dw = e.w * scale;
      const dh = e.h * scale;
      const dx = e.x - (dw - e.w) / 2;
      const dy = e.y - (dh - e.h) / 2;
      this.renderer.drawImg(ENEMY_IMG[e.type], dx, dy, dw, dh);
    }
  }
}
