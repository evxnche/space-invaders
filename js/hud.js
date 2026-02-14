import { SPRITES } from './sprites.js';
import { theme } from './theme.js';

export class HUD {
  constructor(renderer) {
    this.renderer = renderer;
  }

  draw(score, highScore, lives, level) {
    const c = theme.colors;

    this.renderer.drawText('SCORE', 20, 8, c.hud, 14);
    this.renderer.drawText(score.toString().padStart(6, '0'), 20, 24, c.hudScore, 18);

    this.renderer.drawText('HI-SCORE', this.renderer.width / 2, 8, c.hud, 14, 'center');
    this.renderer.drawText(
      highScore.toString().padStart(6, '0'),
      this.renderer.width / 2, 24, c.hudScore, 18, 'center'
    );

    this.renderer.drawText(`LVL ${level}`, this.renderer.width - 20, 8, c.hud, 14, 'right');

    // Theme indicator
    const icon = theme.mode === 'dark' ? '\u263D' : '\u2600';
    this.renderer.drawText(icon, this.renderer.width - 20, 24, c.hud, 16, 'right');

    // Lives
    const lifeSprite = SPRITES.player;
    const lifeSize = this.renderer.getSpriteSize(lifeSprite, 0.6);
    this.renderer.drawText(`${lives}`, 20, this.renderer.height - 20, c.hudLives, 14);
    for (let i = 0; i < lives - 1; i++) {
      this.renderer.drawSprite(
        lifeSprite,
        50 + i * (lifeSize.w + 8),
        this.renderer.height - 22,
        c.hudLives, 0.6
      );
    }

    this.renderer.drawRect(0, this.renderer.height - 4, this.renderer.width, 2, c.hud);
  }
}
