import { SPRITES, COLORS } from './sprites.js';

export class Screens {
  constructor(renderer) {
    this.renderer = renderer;
    this.blinkTimer = 0;
    this.showText = true;
  }

  update(dt) {
    this.blinkTimer += dt;
    if (this.blinkTimer >= 0.6) {
      this.blinkTimer = 0;
      this.showText = !this.showText;
    }
  }

  drawMenu(highScore) {
    const cx = this.renderer.width / 2;

    this.renderer.drawText('SPACE', cx, 100, '#00ff00', 36, 'center');
    this.renderer.drawText('INVADERS', cx, 150, '#00ff00', 36, 'center');

    // Score table
    const tableY = 230;
    this.renderer.drawText('*SCORE ADVANCE TABLE*', cx, tableY, '#fff', 10, 'center');

    this.renderer.drawSprite(SPRITES.ufo, cx - 80, tableY + 30, COLORS.ufo, 0.7);
    this.renderer.drawText('= ? MYSTERY', cx - 40, tableY + 35, '#fff', 10);

    this.renderer.drawSprite(SPRITES.enemy1a, cx - 76, tableY + 60, COLORS.enemy1, 0.7);
    this.renderer.drawText('= 30 POINTS', cx - 40, tableY + 65, '#fff', 10);

    this.renderer.drawSprite(SPRITES.enemy2a, cx - 80, tableY + 90, COLORS.enemy2, 0.7);
    this.renderer.drawText('= 20 POINTS', cx - 40, tableY + 95, '#fff', 10);

    this.renderer.drawSprite(SPRITES.enemy3a, cx - 82, tableY + 120, COLORS.enemy3, 0.7);
    this.renderer.drawText('= 10 POINTS', cx - 40, tableY + 125, '#fff', 10);

    if (this.showText) {
      this.renderer.drawText('PRESS ENTER TO PLAY', cx, 480, '#fff', 12, 'center');
    }

    this.renderer.drawText('ARROWS = MOVE   SPACE = FIRE', cx, 530, '#666', 8, 'center');

    if (highScore > 0) {
      this.renderer.drawText(
        `HI-SCORE: ${highScore.toString().padStart(6, '0')}`,
        cx, 560, '#ffff00', 10, 'center'
      );
    }
  }

  drawGameOver(score, highScore, isNewHigh) {
    const cx = this.renderer.width / 2;

    this.renderer.drawText('GAME OVER', cx, 180, '#ff0000', 28, 'center');

    this.renderer.drawText(
      `SCORE: ${score.toString().padStart(6, '0')}`,
      cx, 280, '#fff', 14, 'center'
    );

    if (isNewHigh) {
      this.renderer.drawText('NEW HIGH SCORE!', cx, 330, '#ffff00', 12, 'center');
    }

    this.renderer.drawText(
      `HI-SCORE: ${highScore.toString().padStart(6, '0')}`,
      cx, 370, '#aaa', 10, 'center'
    );

    if (this.showText) {
      this.renderer.drawText('PRESS ENTER TO CONTINUE', cx, 450, '#fff', 12, 'center');
    }
  }

  drawLevelClear(level) {
    const cx = this.renderer.width / 2;
    this.renderer.drawText(`LEVEL ${level} CLEAR!`, cx, 260, '#00ff00', 20, 'center');
    if (this.showText) {
      this.renderer.drawText('GET READY...', cx, 320, '#fff', 12, 'center');
    }
  }
}
