import { Player } from './player.js';
import { EnemyGrid } from './enemies.js';
import { BulletManager } from './bullet.js';
import { ShieldManager } from './shields.js';
import { UFO } from './ufo.js';
import { CollisionDetector } from './collision.js';
import { HUD } from './hud.js';
import { Screens } from './screens.js';
import { Audio } from './audio.js';
import { theme } from './theme.js';
import { Multiplayer } from './multiplayer.js';
import * as sb from './supabase.js';

const State = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  LEVEL_CLEAR: 'LEVEL_CLEAR',
  GAME_OVER: 'GAME_OVER',
  NAME_ENTRY: 'NAME_ENTRY',
  LEADERBOARD: 'LEADERBOARD',
  MP_LOBBY: 'MP_LOBBY',
  MP_PLAYING: 'MP_PLAYING',
};

const MODE_NAMES = ['solo', '2-player', '3-player'];

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
    this.mp = new Multiplayer();

    this.score = 0;
    this.level = 1;
    this.highScore = parseInt(localStorage.getItem('siHighScore') || '0', 10);
    this.isNewHigh = false;
    this.gameMode = 'solo';

    this.particles = [];
    this.levelClearTimer = 0;
    this.marchSoundTimer = 0;
    this.ufoSoundTimer = 0;

    // Multiplayer additional players
    this.extraPlayers = [];

    // UI element references (set by main.js)
    this.ui = {};

    // Notifications (canvas overlay)
    this.notifications = []; // [{text, timer, maxTimer}]

    // Menu idle: show speech bubble 1s after first interaction
    this.menuHadInteraction = false;
    this.menuInteractionTimer = 0;
    this.menuIdleTriggered = false;

    // Mario gameplay dialogue
    this.marioDialogTimer = 0;
    this.marioDialogVisible = false;
    this.marioDialogIdx = 0;
    this.marioDialogVisibleTimer = 0;
    this.marioDialogMessages = [
      'one happy meal coming up',
      'McDelivery? More like McDestroy',
      "nobody touches my fries",
    ];

    // Easter egg: wrong key held timer
    this.wrongKeyTimer = 0;

    // Easter egg: evan footer click counter
    this.footerClicks = 0;
    this.footerClickTimer = 0;
  }

  setUI(ui) {
    this.ui = ui;
  }

  update(dt) {
    this.screens.update(dt);
    this.updateNotifications(dt);

    switch (this.state) {
      case State.MENU:       this.updateMenu(dt); break;
      case State.PLAYING:    this.updatePlaying(dt); break;
      case State.LEVEL_CLEAR:this.updateLevelClear(dt); break;
      case State.GAME_OVER:  this.updateGameOver(); break;
      case State.NAME_ENTRY: this.updateNameEntry(); break;
      case State.LEADERBOARD:this.updateLeaderboard(); break;
      case State.MP_LOBBY:   break;
      case State.MP_PLAYING: this.updatePlaying(dt); break;
    }
  }

  draw() {
    this.renderer.clear();

    switch (this.state) {
      case State.MENU:
        this.screens.drawMenu(this.highScore, this.menuIdleTriggered);
        break;
      case State.PLAYING:
      case State.MP_PLAYING:
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
      case State.NAME_ENTRY:
        this.screens.drawNameEntry(this.score);
        break;
      case State.LEADERBOARD:
        this.screens.drawLeaderboard(this.screens.lbData, this.screens.lbTab);
        break;
      case State.MP_LOBBY:
        this.screens.drawMenu(this.highScore, false);
        break;
    }

    // Notifications drawn on top of everything
    this.drawNotifications();
  }

  // --- State handlers ---

  updateMenu(dt) {
    // Show speech bubble 1s after first interaction
    if (!this.menuHadInteraction && (this.input.anyKeyPressed() || this.input.isDown(' '))) {
      this.menuHadInteraction = true;
      this.menuInteractionTimer = 0;
    }
    if (this.menuHadInteraction && !this.menuIdleTriggered) {
      this.menuInteractionTimer += dt;
      if (this.menuInteractionTimer >= 1) {
        this.menuIdleTriggered = true;
      }
    }

    // Footer click timer reset
    if (this.footerClickTimer > 0) {
      this.footerClickTimer -= dt;
      if (this.footerClickTimer <= 0) {
        this.footerClicks = 0;
      }
    }
  }

  updateGameOver() {
    // Navigation via keyboard — HTML buttons handle the rest
    if (this.input.wasPressed('Enter')) {
      if (sb.isConfigured()) {
        this.screens.resetNameEntry();
        this.state = State.NAME_ENTRY;
        this.hideGameoverUI();
      } else {
        this.returnToMenu();
      }
    }
    if (this.input.wasPressed('Escape') || this.input.wasPressed('r') || this.input.wasPressed('R')) {
      this.startSoloGame();
    }
  }

  updateNameEntry() {
    const name = this.screens.handleNameInput(this.input);
    if (name) {
      sb.submitScore(name, this.score, this.level, this.gameMode);
      this.loadLeaderboard(this.gameMode);
      this.state = State.LEADERBOARD;
    }
  }

  updateLeaderboard() {
    if (this.input.wasPressed('ArrowLeft')) {
      this.screens.lbTab = Math.max(0, this.screens.lbTab - 1);
      this.loadLeaderboard(MODE_NAMES[this.screens.lbTab]);
    }
    if (this.input.wasPressed('ArrowRight')) {
      this.screens.lbTab = Math.min(2, this.screens.lbTab + 1);
      this.loadLeaderboard(MODE_NAMES[this.screens.lbTab]);
    }
    if (this.input.wasPressed('Enter') || this.input.wasPressed('Escape')) {
      this.returnToMenu();
    }
  }

  async loadLeaderboard(mode) {
    this.screens.lbLoading = true;
    this.screens.lbData = await sb.getLeaderboard(mode);
    this.screens.lbLoading = false;
  }

  updateLevelClear(dt) {
    this.levelClearTimer -= dt;
    this.updateParticles(dt);
    if (this.levelClearTimer <= 0) {
      this.level++;
      this.startLevel();
      this.state = this.mp.active ? State.MP_PLAYING : State.PLAYING;
    }
  }

  updatePlaying(dt) {
    // Hold-to-fire
    if (this.input.isDown(' ') || this.input.isDown('ArrowUp')) {
      if (this.player.fire()) this.audio.shoot();
    }

    // Theme toggle (T key during gameplay)
    if (this.input.wasPressed('t') || this.input.wasPressed('T')) {
      theme.toggle();
    }

    // Easter egg: "uncon" sequence → +2 lives
    if (this.input.checkSequence('uncon')) {
      this.input.clearSequence();
      this.player.lives = Math.min(this.player.lives + 2, 9);
      this.audio.unconJingle();
      this.pushNotification('+2 LIVES! UNCON CHEAT!');
    }

    // Easter egg: wrong key held 1.5s → autorickshaw honk
    if (this.input.hasWrongKeyHeld()) {
      this.wrongKeyTimer += dt;
      if (this.wrongKeyTimer >= 1.5) {
        this.wrongKeyTimer = 0;
        this.audio.autoRickshawHonk();
      }
    } else {
      this.wrongKeyTimer = 0;
    }

    // Mario gameplay dialogue — cycle every 7s, show for 2s
    this.marioDialogTimer += dt;
    if (!this.marioDialogVisible && this.marioDialogTimer >= 7) {
      this.marioDialogTimer = 0;
      this.marioDialogVisible = true;
      this.marioDialogVisibleTimer = 2;
    }
    if (this.marioDialogVisible) {
      this.marioDialogVisibleTimer -= dt;
      if (this.marioDialogVisibleTimer <= 0) {
        this.marioDialogVisible = false;
        this.marioDialogIdx = (this.marioDialogIdx + 1) % this.marioDialogMessages.length;
      }
    }

    this.player.update(dt, this.input);

    // Update extra multiplayer players
    if (this.mp.active && this.mp.isHost) {
      const remoteInputs = this.mp.getRemoteInputs();
      for (const ep of this.extraPlayers) {
        const ri = remoteInputs[ep.id] || {};
        ep.player.update(dt, {
          isDown: (k) => {
            if (k === 'ArrowLeft' || k === 'a') return ri.left;
            if (k === 'ArrowRight' || k === 'd') return ri.right;
            return false;
          },
        });
        if (ri.fire) {
          if (ep.player.fire()) { /* remote fire */ }
        }
      }
    }

    this.enemyGrid.update(dt, this.bulletManager);
    this.bulletManager.update(dt);
    this.ufo.update(dt);
    this.updateParticles(dt);

    // March sound
    this.marchSoundTimer += dt;
    if (this.marchSoundTimer >= this.enemyGrid.moveInterval) {
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
    const c = theme.colors;

    // Player bullets vs enemies
    const allPlayers = [this.player, ...this.extraPlayers.map(ep => ep.player)];
    for (const p of allPlayers) {
      const enemyHits = this.collision.checkPlayerBulletsVsEnemies(p, this.enemyGrid);
      for (const hit of enemyHits) {
        this.score += hit.points;
        this.updateHighScore();
        this.audio.enemyExplosion();
        this.spawnParticles(hit.x + hit.w / 2, hit.y + hit.h / 2, c.explosion, 8);
      }

      const ufoHit = this.collision.checkPlayerBulletsVsUFO(p, this.ufo);
      if (ufoHit) {
        this.score += ufoHit.points;
        this.updateHighScore();
        this.audio.ufoExplosion();
        this.spawnParticles(ufoHit.x + ufoHit.w / 2, ufoHit.y + ufoHit.h / 2, c.ufo, 12);
      }

      if (this.collision.checkPlayerBulletsVsShields(p, this.shieldManager)) {
        this.audio.shieldHit();
      }
    }

    // Enemy bullets vs shields
    this.collision.checkEnemyBulletsVsShields(this.bulletManager, this.shieldManager);

    // Enemy bullets vs player(s)
    for (const p of allPlayers) {
      if (this.collision.checkEnemyBulletsVsPlayer(this.bulletManager, p)) {
        const hitInfo = p.hit();
        this.audio.playerExplosion();
        this.spawnParticles(hitInfo.x + hitInfo.w / 2, hitInfo.y + hitInfo.h / 2, c.player, 15);

        if (p.lives <= 0) {
          const anyAlive = allPlayers.some(pp => pp.lives > 0);
          if (!anyAlive) {
            this.gameOver();
            return;
          }
        }
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

    // Broadcast state for multiplayer host
    if (this.mp.active && this.mp.isHost) {
      this.mp.broadcastState(this.serializeState());
    }

    // Send input for multiplayer client
    if (this.mp.active && !this.mp.isHost) {
      this.mp.sendInput({
        left: this.input.isDown('ArrowLeft') || this.input.isDown('a'),
        right: this.input.isDown('ArrowRight') || this.input.isDown('d'),
        fire: this.input.isDown(' ') || this.input.isDown('ArrowUp'),
      });
    }
  }

  drawPlaying() {
    this.shieldManager.draw();
    this.enemyGrid.draw();
    this.player.draw();
    for (const ep of this.extraPlayers) ep.player.draw();
    this.bulletManager.draw();
    this.ufo.draw();
    this.renderer.drawParticles(this.particles);
    this.hud.draw(this.score, this.highScore, this.player.lives, this.level);
    if (this.marioDialogVisible && !this.player.dead) {
      const msg = this.marioDialogMessages[this.marioDialogIdx];
      this.screens.drawMarioSpeechBubble(
        this.player.x + this.player.w,
        this.player.y - 32,
        theme.colors,
        msg
      );
    }
    this.drawFooter();
  }

  drawFooter() {
    const c = theme.colors;
    this.renderer.drawText(
      'built by evan',
      this.renderer.width / 2,
      this.renderer.height - 50,
      c.textDim, 11, 'center'
    );
  }

  // --- Actions called from HTML UI ---

  startSoloGame() {
    this.audio.init();
    this.gameMode = 'solo';
    this.score = 0;
    this.level = 1;
    this.isNewHigh = false;
    this.player.reset(true);
    this.extraPlayers = [];
    this.particles = [];
    this.notifications = [];
    this.wrongKeyTimer = 0;
    this.marioDialogTimer = 0;
    this.marioDialogVisible = false;
    this.marioDialogIdx = 0;
    this.startLevel();
    this.state = State.PLAYING;
    this.hideMenuUI();
    this.hideGameoverUI();
  }

  returnToMenu() {
    if (this.mp.active) this.mp.leave();
    this.state = State.MENU;
    this.menuHadInteraction = false;
    this.menuInteractionTimer = 0;
    this.menuIdleTriggered = false;
    this.showMenuUI();
    this.hideGameoverUI();
  }

  openMultiplayerLobby() {
    this.state = State.MP_LOBBY;
  }

  openLeaderboard() {
    if (!sb.isConfigured()) return;
    this.screens.lbTab = 0;
    this.loadLeaderboard('solo');
    this.state = State.LEADERBOARD;
    this.hideMenuUI();
  }

  createMultiplayerRoom(maxPlayers) {
    const code = this.mp.createRoom(maxPlayers, {
      onPlayerJoined: (count) => {
        if (this.ui.mpStatus) {
          this.ui.mpStatus.textContent = `Players: ${count}/${maxPlayers}`;
          this.ui.mpStatus.classList.remove('hidden');
        }
      },
      onState: (state) => this.applyRemoteState(state),
    });
    this.gameMode = `${maxPlayers}-player`;
    return code;
  }

  joinMultiplayerRoom(code) {
    this.mp.joinRoom(code, {
      onPlayerJoined: (count) => {
        if (this.ui.mpStatus) {
          this.ui.mpStatus.textContent = `Players: ${count} joined`;
        }
      },
      onState: (state) => this.applyRemoteState(state),
      onGameStart: () => {
        this.hideMenuUI();
        this.hideMpModal();
        this.audio.init();
        this.score = 0;
        this.level = 1;
        this.isNewHigh = false;
        this.player.reset(true);
        this.extraPlayers = [];
        this.particles = [];
        this.notifications = [];
        this.wrongKeyTimer = 0;
        this.startLevel();
        this.state = State.MP_PLAYING;
      },
    });
    this.gameMode = '2-player';
  }

  startMultiplayerGame() {
    this.audio.init();
    this.score = 0;
    this.level = 1;
    this.isNewHigh = false;
    this.player.reset(true);
    this.particles = [];
    this.notifications = [];

    this.extraPlayers = [];
    const playerIds = Object.keys(this.mp.players).filter(id => id !== 'host');
    const totalPlayers = playerIds.length + 1;
    const spacing = this.renderer.width / (totalPlayers + 1);

    this.player.x = spacing - this.player.w / 2;

    for (let i = 0; i < playerIds.length; i++) {
      const p = new Player(this.renderer);
      p.x = spacing * (i + 2) - p.w / 2;
      this.extraPlayers.push({ id: playerIds[i], player: p });
    }

    this.gameMode = `${totalPlayers}-player`;
    this.startLevel();
    this.state = State.MP_PLAYING;
    this.mp.startGame();
    this.hideMenuUI();
    this.hideMpModal();
  }

  // --- Easter eggs ---

  onFooterClick() {
    this.footerClicks++;
    this.footerClickTimer = 3; // reset 3s window on each click

    if (this.footerClicks >= 7) {
      this.footerClicks = 0;
      this.footerClickTimer = 0;
      this.audio.init();
      this.audio.secretJingle();
      this.pushNotification("i'm blushing already, stop :))", 2);
    }
  }

  // --- Notifications ---

  pushNotification(text, duration = 2.5) {
    this.notifications.push({ text, timer: duration, maxTimer: duration });
  }

  updateNotifications(dt) {
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      this.notifications[i].timer -= dt;
      if (this.notifications[i].timer <= 0) this.notifications.splice(i, 1);
    }
  }

  drawNotifications() {
    const c = theme.colors;
    const cx = this.renderer.width / 2;
    const cy = this.renderer.height / 2;
    this.notifications.forEach((n, i) => {
      const alpha = Math.min(1, n.timer / 0.4);
      // Special blushing notification: center of screen, large
      const isBlushing = n.text.includes('blushing');
      const fontSize = isBlushing ? 18 : 14;
      const padding = isBlushing ? 32 : 24;
      const text = n.text;
      const w = text.length * (isBlushing ? 10.5 : 9) + padding;
      const h = isBlushing ? 38 : 22;
      const y = isBlushing ? cy - h / 2 : 80 + i * 30;
      this.renderer.ctx.save();
      this.renderer.ctx.globalAlpha = alpha * 0.92;
      this.renderer.ctx.fillStyle = isBlushing ? (c.primary || '#e63946') : (c.bg || '#0a0a0a');
      if (this.renderer.ctx.roundRect) {
        this.renderer.ctx.beginPath();
        this.renderer.ctx.roundRect(cx - w / 2, y, w, h, isBlushing ? 8 : 3);
        this.renderer.ctx.fill();
      } else {
        this.renderer.ctx.fillRect(cx - w / 2, y, w, h);
      }
      this.renderer.ctx.globalAlpha = alpha;
      this.renderer.drawText(text, cx, y + h / 2 - fontSize / 2, isBlushing ? (c.bg || '#fff') : c.secondary, fontSize, 'center');
      this.renderer.ctx.restore();
    });
  }

  // --- Helpers ---

  startLevel() {
    this.enemyGrid.init(this.level);
    this.bulletManager.reset();
    this.shieldManager.init();
    this.ufo.reset();
    this.player.bullets = [];
    this.marchSoundTimer = 0;
  }

  gameOver() {
    this.updateHighScore();
    this.audio.gameOver();
    if (this.mp.active) this.mp.leave();
    this.state = State.GAME_OVER;
    this.showGameoverUI();
  }

  updateHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      this.isNewHigh = true;
      localStorage.setItem('siHighScore', this.highScore.toString());
    }
  }

  showMenuUI() {
    if (this.ui.menuUI) this.ui.menuUI.classList.remove('hidden');
    if (this.ui.themeToggle) this.ui.themeToggle.classList.remove('hidden');
    if (this.ui.btnQuit) this.ui.btnQuit.classList.add('hidden');
  }

  hideMenuUI() {
    if (this.ui.menuUI) this.ui.menuUI.classList.add('hidden');
    if (this.ui.btnQuit) this.ui.btnQuit.classList.remove('hidden');
  }

  showGameoverUI() {
    if (this.ui.gameoverUI) this.ui.gameoverUI.classList.remove('hidden');
    if (this.ui.btnQuit) this.ui.btnQuit.classList.add('hidden');
  }

  hideGameoverUI() {
    if (this.ui.gameoverUI) this.ui.gameoverUI.classList.add('hidden');
  }

  hideMpModal() {
    if (this.ui.mpModal) this.ui.mpModal.classList.add('hidden');
  }

  serializeState() {
    return {
      score: this.score,
      level: this.level,
      player: { x: this.player.x, y: this.player.y, lives: this.player.lives, dead: this.player.dead },
      enemyAlive: this.enemyGrid.enemies.map(e => e.alive),
      enemyPositions: this.enemyGrid.enemies.map(e => ({ x: e.x, y: e.y })),
    };
  }

  applyRemoteState(state) {
    this.score = state.score;
    this.level = state.level;
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
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }
}
