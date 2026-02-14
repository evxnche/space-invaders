import { SPRITES } from './sprites.js';
import { theme } from './theme.js';

export class HUD {
  constructor(renderer) {
    this.renderer = renderer;
  }

  draw(score, highScore, lives, level) {
    const c = theme.colors;

    // Left: SCORE + level below it
    this.renderer.drawText('SCORE', 20, 6, c.hud, 12);
    this.renderer.drawText(score.toString().padStart(6, '0'), 20, 20, c.hudScore, 16);
    this.renderer.drawText(`LVL ${level}`, 20, 38, c.hud, 11);

    // Center: HI-SCORE
    this.renderer.drawText('HI-SCORE', this.renderer.width / 2, 6, c.hud, 12, 'center');
    this.renderer.drawText(
      highScore.toString().padStart(6, '0'),
      this.renderer.width / 2, 20, c.hudScore, 16, 'center'
    );

    // Bottom: lives
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
