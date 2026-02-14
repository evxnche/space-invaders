import { SPRITES } from './sprites.js';
import { theme } from './theme.js';

export class Screens {
  constructor(renderer) {
    this.renderer = renderer;
    this.blinkTimer = 0;
    this.showText = true;

    // Name entry state
    this.nameChars = ['A', 'A', 'A'];
    this.namePos = 0;

    // Leaderboard state
    this.lbTab = 0; // 0=solo, 1=2-player, 2=3-player
    this.lbData = [];
    this.lbLoading = false;
  }

  update(dt) {
    this.blinkTimer += dt;
    if (this.blinkTimer >= 0.6) {
      this.blinkTimer = 0;
      this.showText = !this.showText;
    }
  }

  resetNameEntry() {
    this.nameChars = ['A', 'A', 'A'];
    this.namePos = 0;
  }

  drawFooter() {
    const c = theme.colors;
    this.renderer.drawText(
      'built by evan',
      this.renderer.width / 2,
      this.renderer.height - 8,
      c.textDim, 11, 'center'
    );
  }

  drawMenu(highScore, idleTriggered) {
    const c = theme.colors;
    const cx = this.renderer.width / 2;

    // Title
    this.renderer.drawTitleText('SPACE', cx, 70, c.title, 32, 'center');
    this.renderer.drawTitleText('INVADERS', cx, 110, c.title, 32, 'center');

    // Score table
    const tableY = 175;
    this.renderer.drawText('SCORE ADVANCE TABLE', cx, tableY, c.text, 16, 'center');

    this.renderer.drawSprite(SPRITES.ufo,    cx - 85, tableY + 28,  c.ufo,    0.7);
    this.renderer.drawText('= ? MYSTERY',    cx - 40, tableY + 30,  c.text, 14);

    this.renderer.drawSprite(SPRITES.enemy1a, cx - 80, tableY + 56,  c.enemy1, 0.7);
    this.renderer.drawText('= 30 POINTS',    cx - 40, tableY + 58,  c.text, 14);

    this.renderer.drawSprite(SPRITES.enemy2a, cx - 85, tableY + 84,  c.enemy2, 0.7);
    this.renderer.drawText('= 20 POINTS',    cx - 40, tableY + 86,  c.text, 14);

    this.renderer.drawSprite(SPRITES.enemy3a, cx - 82, tableY + 112, c.enemy3, 0.7);
    this.renderer.drawText('= 10 POINTS',    cx - 40, tableY + 114, c.text, 14);

    // Controls hint
    this.renderer.drawText('ARROWS = MOVE     HOLD SPACE = FIRE', cx, 440, c.textDim, 12, 'center');

    if (highScore > 0) {
      this.renderer.drawText(
        `HI-SCORE: ${highScore.toString().padStart(6, '0')}`,
        cx, 462, c.secondary, 14, 'center'
      );
    }

    // Idle easter egg: invader speech bubble
    if (idleTriggered) {
      this.drawIdleSpeechBubble(cx, tableY + 56, c);
    }

    this.drawFooter();
  }

  drawIdleSpeechBubble(cx, invaderY, c) {
    const bx = cx + 60;
    const by = invaderY - 30;
    const bw = 140;
    const bh = 28;

    // Bubble background
    this.renderer.ctx.save();
    this.renderer.ctx.fillStyle = c.primary;
    this.renderer.ctx.beginPath();
    if (this.renderer.ctx.roundRect) {
      this.renderer.ctx.roundRect(bx, by, bw, bh, 6);
    } else {
      this.renderer.ctx.rect(bx, by, bw, bh);
    }
    this.renderer.ctx.fill();

    // Tail pointing left toward invader
    this.renderer.ctx.beginPath();
    this.renderer.ctx.moveTo(bx, by + bh / 2 - 5);
    this.renderer.ctx.lineTo(bx - 10, by + bh / 2);
    this.renderer.ctx.lineTo(bx, by + bh / 2 + 5);
    this.renderer.ctx.fill();
    this.renderer.ctx.restore();

    // Text
    this.renderer.drawText('PLAY ALREADY!', bx + bw / 2, by + bh / 2 + 5, c.bg || '#0a0a0a', 11, 'center');
  }

  drawGameOver(score, highScore, isNewHigh) {
    const c = theme.colors;
    const cx = this.renderer.width / 2;

    this.renderer.drawText('GAME OVER', cx, 180, c.primary, 36, 'center');
    this.renderer.drawText(
      `SCORE: ${score.toString().padStart(6, '0')}`,
      cx, 260, c.text, 20, 'center'
    );

    if (isNewHigh) {
      this.renderer.drawText('NEW HIGH SCORE!', cx, 300, c.secondary, 16, 'center');
    }

    this.renderer.drawText(
      `HI-SCORE: ${highScore.toString().padStart(6, '0')}`,
      cx, 340, c.textDim, 14, 'center'
    );

    if (this.showText) {
      this.renderer.drawText('ENTER = SUBMIT SCORE    R = RESTART', cx, 420, c.text, 14, 'center');
    }

    this.drawFooter();
  }

  drawNameEntry(score) {
    const c = theme.colors;
    const cx = this.renderer.width / 2;

    this.renderer.drawText('ENTER YOUR INITIALS', cx, 180, c.text, 20, 'center');
    this.renderer.drawText(
      `SCORE: ${score.toString().padStart(6, '0')}`,
      cx, 220, c.secondary, 16, 'center'
    );

    // Draw 3 character slots
    const slotW = 40;
    const startX = cx - (slotW * 1.5);
    for (let i = 0; i < 3; i++) {
      const sx = startX + i * slotW;
      const isActive = i === this.namePos;

      // Underline
      this.renderer.drawRect(sx + 4, 310, slotW - 8, 3, isActive ? c.primary : c.textDim);

      // Character
      const charColor = isActive && this.showText ? c.primary : c.text;
      this.renderer.drawText(this.nameChars[i], sx + slotW / 2, 270, charColor, 32, 'center');
    }

    // Arrows for active position
    const activeX = startX + this.namePos * slotW + slotW / 2;
    this.renderer.drawText('\u25B2', activeX, 248, c.primary, 14, 'center');
    this.renderer.drawText('\u25BC', activeX, 318, c.primary, 14, 'center');

    this.renderer.drawText('TYPE / UP-DOWN = CHAR    LEFT-RIGHT = MOVE    ENTER = DONE', cx, 380, c.textDim, 10, 'center');

    this.drawFooter();
  }

  handleNameInput(input) {
    if (input.wasPressed('ArrowUp')) {
      const code = this.nameChars[this.namePos].charCodeAt(0);
      this.nameChars[this.namePos] = String.fromCharCode(code >= 90 ? 65 : code + 1);
    }
    if (input.wasPressed('ArrowDown')) {
      const code = this.nameChars[this.namePos].charCodeAt(0);
      this.nameChars[this.namePos] = String.fromCharCode(code <= 65 ? 90 : code - 1);
    }
    if (input.wasPressed('ArrowLeft')) {
      this.namePos = Math.max(0, this.namePos - 1);
    }
    if (input.wasPressed('ArrowRight')) {
      this.namePos = Math.min(2, this.namePos + 1);
    }

    // Allow direct letter typing
    for (let code = 65; code <= 90; code++) {
      const ch = String.fromCharCode(code);
      const lower = ch.toLowerCase();
      if (input.wasPressed(ch) || input.wasPressed(lower)) {
        this.nameChars[this.namePos] = ch;
        // Auto-advance to next slot
        if (this.namePos < 2) this.namePos++;
        break;
      }
    }

    if (input.wasPressed('Enter')) {
      return this.nameChars.join('');
    }
    return null;
  }

  drawLeaderboard(data, tab) {
    const c = theme.colors;
    const cx = this.renderer.width / 2;

    this.renderer.drawText('LEADERBOARD', cx, 40, c.title, 24, 'center');

    // Tabs
    const tabs = ['SOLO', '2-PLAYER', '3-PLAYER'];
    const tabW = 160;
    const tabStart = cx - tabW * 1.5;
    for (let i = 0; i < 3; i++) {
      const tx = tabStart + i * tabW + tabW / 2;
      const isActive = i === tab;
      this.renderer.drawText(tabs[i], tx, 80, isActive ? c.primary : c.textDim, 16, 'center');
      if (isActive) {
        this.renderer.drawRect(tabStart + i * tabW + 10, 100, tabW - 20, 2, c.primary);
      }
    }

    // Header
    this.renderer.drawText('RANK', 100, 120, c.textDim, 12);
    this.renderer.drawText('NAME', 200, 120, c.textDim, 12);
    this.renderer.drawText('SCORE', 350, 120, c.textDim, 12);
    this.renderer.drawText('LVL', 500, 120, c.textDim, 12);

    if (this.lbLoading) {
      this.renderer.drawText('LOADING...', cx, 200, c.text, 16, 'center');
      this.drawFooter();
      return;
    }

    if (!data || data.length === 0) {
      this.renderer.drawText('NO SCORES YET', cx, 200, c.textDim, 16, 'center');
    } else {
      for (let i = 0; i < data.length && i < 20; i++) {
        const y = 140 + i * 22;
        const rowColor = i < 3 ? c.secondary : c.text;
        this.renderer.drawText(`${i + 1}.`, 100, y, rowColor, 14);
        this.renderer.drawText(data[i].name, 200, y, rowColor, 14);
        this.renderer.drawText(data[i].score.toString().padStart(6, '0'), 350, y, rowColor, 14);
        this.renderer.drawText(`${data[i].level}`, 500, y, rowColor, 14);
      }
    }

    this.renderer.drawText('LEFT/RIGHT = TAB    ENTER/ESC = BACK TO MENU', cx, this.renderer.height - 30, c.textDim, 11, 'center');
    this.drawFooter();
  }

  drawLevelClear(level) {
    const c = theme.colors;
    const cx = this.renderer.width / 2;
    this.renderer.drawText(`LEVEL ${level} CLEAR!`, cx, 260, c.primary, 28, 'center');
    if (this.showText) {
      this.renderer.drawText('GET READY...', cx, 310, c.text, 16, 'center');
    }
  }
}
