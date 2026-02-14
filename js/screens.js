import { SPRITES } from './sprites.js';
import { theme } from './theme.js';

const MARIO_W = 130;
const MARIO_H = 130;

export class Screens {
  constructor(renderer) {
    this.renderer = renderer;
    this.blinkTimer = 0;
    this.showText = true;

    // Name entry state
    this.nameChars = ['A', 'A', 'A'];
    this.namePos = 0;

    // Leaderboard state
    this.lbTab = 0;
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
      this.renderer.height - 38,
      c.textDim, 11, 'center'
    );
  }

  drawMenu(highScore, idleTriggered) {
    const c = theme.colors;
    const cx = this.renderer.width / 2;

    // Title — McInvaders
    this.renderer.drawTitleText('McInvaders', cx, 22, c.title, 28, 'center');

    // Tighter horizontal scoring table
    const tableY = 75;
    this.renderer.drawText('SCORING', cx, tableY, c.textDim, 13, 'center');

    const spriteScale = 0.6;
    const colWidth = 150;               // tighter than 185
    const startX = cx - 2 * colWidth;
    const rowY = tableY + 18;

    const items = [
      { sprite: SPRITES.ufo,     color: c.ufo,    label: '? PTS' },
      { sprite: SPRITES.enemy1a, color: c.enemy1, label: '30 PTS' },
      { sprite: SPRITES.enemy2a, color: c.enemy2, label: '20 PTS' },
      { sprite: SPRITES.enemy3a, color: c.enemy3, label: '10 PTS' },
    ];

    items.forEach((item, i) => {
      const colCx = startX + i * colWidth + colWidth / 2;
      const sw = item.sprite[0].length * 3 * spriteScale;
      const sh = item.sprite.length * 3 * spriteScale;
      const labelW = item.label.length * 6.5;
      const groupW = sw + 5 + labelW;
      const groupX = colCx - groupW / 2;
      this.renderer.drawSprite(item.sprite, groupX, rowY, item.color, spriteScale);
      this.renderer.drawText(item.label, groupX + sw + 5, rowY + sh / 2 - 6, c.text, 11);
    });

    // Controls line right under scoring
    const controlsY = rowY + 20;
    this.renderer.drawText(
      '\u2190\u2192 MOVE    SPACE FIRE    T THEME',
      cx, controlsY, c.textDim, 11, 'center'
    );

    // Hi-score
    if (highScore > 0) {
      this.renderer.drawText(
        `HI-SCORE: ${highScore.toString().padStart(6, '0')}`,
        cx, controlsY + 20, c.secondary, 13, 'center'
      );
    }

    // Mario graphic — large, in the open space below
    const marioX = cx - MARIO_W / 2;
    const marioY = controlsY + 46;
    this.renderer.drawImg('mario', marioX, marioY, MARIO_W, MARIO_H);

    // Mario idle — "Start already" speech bubble after 8s
    if (idleTriggered) {
      this.drawMarioSpeechBubble(marioX + MARIO_W, marioY + 18, c);
    }

    this.drawFooter();
  }

  drawMarioSpeechBubble(tailX, tailY, c) {
    const bw = 148;
    const bh = 28;
    const bx = tailX + 10;
    const by = tailY;

    this.renderer.ctx.save();
    this.renderer.ctx.fillStyle = c.primary;
    this.renderer.ctx.beginPath();
    if (this.renderer.ctx.roundRect) {
      this.renderer.ctx.roundRect(bx, by, bw, bh, 6);
    } else {
      this.renderer.ctx.rect(bx, by, bw, bh);
    }
    this.renderer.ctx.fill();

    // Tail pointing left toward Mario
    this.renderer.ctx.beginPath();
    this.renderer.ctx.moveTo(bx, by + bh / 2 - 5);
    this.renderer.ctx.lineTo(bx - 10, by + bh / 2);
    this.renderer.ctx.lineTo(bx, by + bh / 2 + 5);
    this.renderer.ctx.fill();
    this.renderer.ctx.restore();

    this.renderer.drawText('Start already!', bx + bw / 2, by + bh / 2 - 6, c.bg || '#0a0a0a', 11, 'center');
  }

  drawGameOver(score, highScore, isNewHigh) {
    const c = theme.colors;
    const cx = this.renderer.width / 2;

    this.renderer.drawText('GAME OVER', cx, 180, c.primary, 36, 'center');
    this.renderer.drawText(
      `SCORE: ${score.toString().padStart(6, '0')}`,
      cx, 268, c.text, 20, 'center'
    );

    if (isNewHigh) {
      this.renderer.drawText('NEW HIGH SCORE!', cx, 306, c.secondary, 16, 'center');
    }

    this.renderer.drawText(
      `HI-SCORE: ${highScore.toString().padStart(6, '0')}`,
      cx, 348, c.textDim, 14, 'center'
    );

    if (this.showText) {
      this.renderer.drawText('ENTER = SUBMIT SCORE    R = RESTART', cx, 418, c.text, 14, 'center');
    }

    this.drawFooter();
  }

  drawNameEntry(score) {
    const c = theme.colors;
    const cx = this.renderer.width / 2;

    this.renderer.drawText('ENTER YOUR INITIALS', cx, 190, c.text, 20, 'center');
    this.renderer.drawText(
      `SCORE: ${score.toString().padStart(6, '0')}`,
      cx, 228, c.secondary, 16, 'center'
    );

    const slotW = 40;
    const startX = cx - (slotW * 1.5);
    for (let i = 0; i < 3; i++) {
      const sx = startX + i * slotW;
      const isActive = i === this.namePos;
      this.renderer.drawRect(sx + 4, 318, slotW - 8, 3, isActive ? c.primary : c.textDim);
      const charColor = isActive && this.showText ? c.primary : c.text;
      this.renderer.drawText(this.nameChars[i], sx + slotW / 2, 278, charColor, 32, 'center');
    }

    const activeX = startX + this.namePos * slotW + slotW / 2;
    this.renderer.drawText('\u25B2', activeX, 256, c.primary, 14, 'center');
    this.renderer.drawText('\u25BC', activeX, 326, c.primary, 14, 'center');

    this.renderer.drawText('TYPE / UP-DOWN = CHAR    LEFT-RIGHT = MOVE    ENTER = DONE', cx, 388, c.textDim, 10, 'center');

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
    if (input.wasPressed('ArrowLeft')) this.namePos = Math.max(0, this.namePos - 1);
    if (input.wasPressed('ArrowRight')) this.namePos = Math.min(2, this.namePos + 1);

    for (let code = 65; code <= 90; code++) {
      const ch = String.fromCharCode(code);
      if (input.wasPressed(ch) || input.wasPressed(ch.toLowerCase())) {
        this.nameChars[this.namePos] = ch;
        if (this.namePos < 2) this.namePos++;
        break;
      }
    }

    if (input.wasPressed('Enter')) return this.nameChars.join('');
    return null;
  }

  drawLeaderboard(data, tab) {
    const c = theme.colors;
    const cx = this.renderer.width / 2;

    this.renderer.drawText('LEADERBOARD', cx, 40, c.title, 24, 'center');

    const tabs = ['SOLO', '2-PLAYER', '3-PLAYER'];
    const tabW = 160;
    const tabStart = cx - tabW * 1.5;
    for (let i = 0; i < 3; i++) {
      const tx = tabStart + i * tabW + tabW / 2;
      const isActive = i === tab;
      this.renderer.drawText(tabs[i], tx, 80, isActive ? c.primary : c.textDim, 16, 'center');
      if (isActive) {
        this.renderer.drawRect(tabStart + i * tabW + 10, 102, tabW - 20, 2, c.primary);
      }
    }

    this.renderer.drawText('RANK', 100, 122, c.textDim, 12);
    this.renderer.drawText('NAME', 200, 122, c.textDim, 12);
    this.renderer.drawText('SCORE', 350, 122, c.textDim, 12);
    this.renderer.drawText('LVL', 500, 122, c.textDim, 12);

    if (this.lbLoading) {
      this.renderer.drawText('LOADING...', cx, 210, c.text, 16, 'center');
      this.drawFooter();
      return;
    }

    if (!data || data.length === 0) {
      this.renderer.drawText('NO SCORES YET', cx, 210, c.textDim, 16, 'center');
    } else {
      for (let i = 0; i < data.length && i < 20; i++) {
        const y = 144 + i * 22;
        const rowColor = i < 3 ? c.secondary : c.text;
        this.renderer.drawText(`${i + 1}.`, 100, y, rowColor, 14);
        this.renderer.drawText(data[i].name, 200, y, rowColor, 14);
        this.renderer.drawText(data[i].score.toString().padStart(6, '0'), 350, y, rowColor, 14);
        this.renderer.drawText(`${data[i].level}`, 500, y, rowColor, 14);
      }
    }

    this.renderer.drawText('LEFT/RIGHT = TAB    ENTER/ESC = BACK TO MENU', cx, this.renderer.height - 52, c.textDim, 11, 'center');
    this.drawFooter();
  }

  drawLevelClear(level) {
    const c = theme.colors;
    const cx = this.renderer.width / 2;
    this.renderer.drawText(`LEVEL ${level} CLEAR!`, cx, 260, c.primary, 28, 'center');
    if (this.showText) {
      this.renderer.drawText('GET READY...', cx, 300, c.text, 16, 'center');
    }
  }
}
