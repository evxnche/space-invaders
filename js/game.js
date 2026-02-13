import { Player } from './player.js';
import { EnemyGrid } from './enemies.js';
import { BulletManager } from './bullet.js';
import { ShieldManager } from './shields.js';
import { UFO } from './ufo.js';
import { CollisionDetector } from './collision.js';
import { HUD } from './hud.js';
import { Screens } from './screens.js';
import { Audio } from './audio.js';

const State = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
  GAME_OVER: 'GAME_OVER',
};

export class Game {
  constructor(renderer, input) {
    this.renderer = renderer;
    this.input = input;
    this.state = State.MENU;

    this.player = new Player(renderer);
    this.enemyGrid = new EnemyGrid(renderer);
    this.bulletManager = new BulletManager(renderer);
    this.shieldManager = new ShieldManager(renderer);
    this.ufo = new UFO(renderer);
    this.collision = new CollisionDetector();
    this.hud = new HUD(renderer);
    this.screens = new Screens(renderer);
    this.audio = new Audio();

    this.score = 0;
    this.level = 1;
    this.highScore = parseInt(localStorage.getItem('siHighScore') || '0', 10);
    this.isNewHigh = false;

    this.particles = [];
    this.levelClearTimer = 0;
    this.marchSoundTimer = 0;
    this.ufoSoundTimer = 0;
  }

  update(dt) {
    this.screens.update(dt);

    switch (this.state) {
      case State.MENU:
        this.updateMenu();
        break;
      case State.PLAYING:
        this.updatePlaying(dt);
        break;
      case State.LEVEL_CLEAR:
        this.updateLevelClear(dt);
        break;
      case State.GAME_OVER:
        this.updateGameOver();
        break;
    }
  }

  draw() {
    this.renderer.clear();

    switch (this.state) {
      case State.MENU:
        this.screens.drawMenu(this.highScore);
        break;
      case State.PLAYING:
        this.drawPlaying();
        break;
      case State.LEVEL_CLEAR:
        this.drawPlaying();
        this.screens.drawLevelClear(this.level);
        break;
      case State.GAME_OVER:
        this.drawPlaying();
        this.screens.drawGameOver(this.score, this.highScore, this.isNewHigh);
        break;
    }
  }

  // --- State handlers ---

  updateMenu() {
    if (this.input.wasPressed('Enter')) {
      this.audio.init();
      this.startGame();
    }
  }

  updateGameOver() {
    if (this.input.wasPressed('Enter')) {
      this.state = State.MENU;
    }
  }

  updateLevelClear(dt) {
    this.levelClearTimer -= dt;
    this.updateParticles(dt);
    if (this.levelClearTimer <= 0) {
      this.level++;
      this.startLevel();
      this.state = State.PLAYING;
    }
  }

  updatePlaying(dt) {
    // Player input
    if (this.input.wasPressed(' ') || this.input.wasPressed('ArrowUp')) {
      if (this.player.fire()) {
        this.audio.shoot();
      }
    }

    // Update entities
    this.player.update(dt, this.input);
    this.enemyGrid.update(dt, this.bulletManager);
    this.bulletManager.update(dt);
    this.ufo.update(dt);
    this.updateParticles(dt);

    // March sound
    this.marchSoundTimer += dt;
    const marchInterval = this.enemyGrid.moveInterval;
    if (this.marchSoundTimer >= marchInterval) {
      this.marchSoundTimer = 0;
      this.audio.march();
    }

    // UFO sound
    if (this.ufo.active) {
      this.ufoSoundTimer += dt;
      if (this.ufoSoundTimer >= 0.3) {
        this.ufoSoundTimer = 0;
        this.audio.ufoSound();
      }
    }

    // --- Collisions ---

    // Player bullet vs enemies
    const enemyHit = this.collision.checkPlayerBulletVsEnemies(this.player, this.enemyGrid);
    if (enemyHit) {
      this.score += enemyHit.points;
      this.updateHighScore();
      this.audio.enemyExplosion();
      this.spawnParticles(enemyHit.x + enemyHit.w / 2, enemyHit.y + enemyHit.h / 2, '#fff', 8);
    }

    // Player bullet vs UFO
    const ufoHit = this.collision.checkPlayerBulletVsUFO(this.player, this.ufo);
    if (ufoHit) {
      this.score += ufoHit.points;
      this.updateHighScore();
      this.audio.ufoExplosion();
      this.spawnParticles(ufoHit.x + ufoHit.w / 2, ufoHit.y + ufoHit.h / 2, '#ff0000', 12);
    }

    // Player bullet vs shields
    if (this.collision.checkPlayerBulletVsShields(this.player, this.shieldManager)) {
      this.audio.shieldHit();
    }

    // Enemy bullets vs shields
    this.collision.checkEnemyBulletsVsShields(this.bulletManager, this.shieldManager);

    // Enemy bullets vs player
    if (this.collision.checkEnemyBulletsVsPlayer(this.bulletManager, this.player)) {
      const hitInfo = this.player.hit();
      this.audio.playerExplosion();
      this.spawnParticles(hitInfo.x + hitInfo.w / 2, hitInfo.y + hitInfo.h / 2, '#00ff00', 15);

      if (this.player.lives <= 0) {
        this.gameOver();
        return;
      }
    }

    // Enemies overlapping shields
    this.shieldManager.checkEnemyOverlap(this.enemyGrid.enemies);

    // Enemies reach player
    if (this.collision.checkEnemiesReachBottom(this.enemyGrid, this.player)) {
      this.player.lives = 0;
      this.gameOver();
      return;
    }

    // Level clear
    if (this.enemyGrid.aliveCount <= 0) {
      this.audio.levelComplete();
      this.state = State.LEVEL_CLEAR;
      this.levelClearTimer = 2;
    }
  }

  drawPlaying() {
    this.shieldManager.draw();
    this.enemyGrid.draw();
    this.player.draw();
    this.bulletManager.draw();
    this.ufo.draw();
    this.renderer.drawParticles(this.particles);
    this.hud.draw(this.score, this.highScore, this.player.lives, this.level);
  }

  // --- Helpers ---

  startGame() {
    this.score = 0;
    this.level = 1;
    this.isNewHigh = false;
    this.player.reset(true);
    this.particles = [];
    this.startLevel();
    this.state = State.PLAYING;
  }

  startLevel() {
    this.enemyGrid.init(this.level);
    this.bulletManager.reset();
    this.shieldManager.init();
    this.ufo.reset();
    this.player.bullet = null;
    this.marchSoundTimer = 0;
  }

  gameOver() {
    this.updateHighScore();
    this.audio.gameOver();
    this.state = State.GAME_OVER;
  }

  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.isNewHigh = true;
      localStorage.setItem('siHighScore', this.highScore.toString());
    }
  }

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        decay: 1.5 + Math.random(),
        size: 2 + Math.random() * 2,
        color,
      });
    }
  }

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= p.decay * dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}
