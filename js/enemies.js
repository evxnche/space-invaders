import { SPRITES, COLORS } from './sprites.js';

const ENEMY_TYPES = [
  { spriteA: 'enemy1a', spriteB: 'enemy1b', color: COLORS.enemy1, points: 30 },
  { spriteA: 'enemy2a', spriteB: 'enemy2b', color: COLORS.enemy2, points: 20 },
  { spriteA: 'enemy3a', spriteB: 'enemy3b', color: COLORS.enemy3, points: 10 },
];

// Row-to-type mapping (5 rows): row 0 = squid, rows 1-2 = crab, rows 3-4 = octopus
const ROW_TYPE = [0, 1, 1, 2, 2];

export class EnemyGrid {
  constructor(renderer) {
    this.renderer = renderer;
    this.cols = 11;
    this.rows = 5;
    this.enemies = [];
    this.direction = 1; // 1 = right, -1 = left
    this.baseSpeed = 30;
    this.speed = this.baseSpeed;
    this.moveTimer = 0;
    this.moveInterval = 0.6; // seconds between steps
    this.animFrame = 0; // toggle 0/1
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
    this.levelOffset = Math.min((level - 1) * 15, 120); // enemies start lower each level

    const spacing = 48;
    const rowHeight = 36;
    const startX = 60;
    const startY = 80 + this.levelOffset;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const typeIdx = ROW_TYPE[row];
        const type = ENEMY_TYPES[typeIdx];
        const size = this.renderer.getSpriteSize(SPRITES[type.spriteA]);
        this.enemies.push({
          x: startX + col * spacing,
          y: startY + row * rowHeight,
          w: size.w,
          h: size.h,
          type: typeIdx,
          alive: true,
          exploding: false,
          explodeTimer: 0,
        });
      }
    }

    // Adjust speed based on level
    this.moveInterval = Math.max(0.1, 0.6 - (level - 1) * 0.05);
    this.fireInterval = Math.max(0.3, 1.5 - (level - 1) * 0.1);
  }

  update(dt, bulletManager) {
    // Update explosions
    for (const e of this.enemies) {
      if (e.exploding) {
        e.explodeTimer -= dt;
        if (e.explodeTimer <= 0) {
          e.exploding = false;
        }
      }
    }

    // Movement step
    this.moveTimer += dt;
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;
      this.animFrame = 1 - this.animFrame;

      if (this.needsDescent) {
        // Descend
        for (const e of this.enemies) {
          if (e.alive) e.y += this.descendAmount;
        }
        this.direction *= -1;
        this.needsDescent = false;
      } else {
        // Move horizontally
        const step = 10 * this.direction;
        let hitEdge = false;

        for (const e of this.enemies) {
          if (!e.alive) continue;
          e.x += step;
          if (e.x + e.w > this.renderer.width - 10 || e.x < 10) {
            hitEdge = true;
          }
        }

        if (hitEdge) {
          this.needsDescent = true;
        }
      }

      // Speed up as enemies die
      const ratio = this.aliveCount / this.totalEnemies;
      this.moveInterval = Math.max(0.05, this.moveInterval * (ratio < 0.2 ? 0.95 : 1));
    }

    // Enemy firing
    this.fireTimer += dt;
    const adjustedFireInterval = this.fireInterval * (this.aliveCount / this.totalEnemies + 0.3);
    if (this.fireTimer >= adjustedFireInterval) {
      this.fireTimer = 0;
      this.fireFromBottomRow(bulletManager);
    }
  }

  fireFromBottomRow(bulletManager) {
    // Find bottom-most alive enemy in each column
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

    // Speed up movement
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
      if (e.alive && e.y + e.h > lowest) {
        lowest = e.y + e.h;
      }
    }
    return lowest;
  }

  draw() {
    for (const e of this.enemies) {
      if (e.exploding) {
        this.renderer.drawSprite(SPRITES.explosion, e.x, e.y, COLORS.explosion);
        continue;
      }
      if (!e.alive) continue;

      const type = ENEMY_TYPES[e.type];
      const spriteName = this.animFrame === 0 ? type.spriteA : type.spriteB;
      this.renderer.drawSprite(SPRITES[spriteName], e.x, e.y, type.color);
    }
  }
}
