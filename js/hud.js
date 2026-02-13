import { SPRITES, COLORS } from './sprites.js';

export class HUD {
  constructor(renderer) {
    this.renderer = renderer;
  }

  draw(score, highScore, lives, level) {
    // Score
    this.renderer.drawText('SCORE', 20, 8, COLORS.hud, 10);
    this.renderer.drawText(score.toString().padStart(6, '0'), 20, 22, COLORS.hudScore, 12);

    // High score
    this.renderer.drawText('HI-SCORE', this.renderer.width / 2, 8, COLORS.hud, 10, 'center');
    this.renderer.drawText(
      highScore.toString().padStart(6, '0'),
      this.renderer.width / 2, 22,
      COLORS.hudScore, 12, 'center'
    );

    // Level
    this.renderer.drawText(`LVL ${level}`, this.renderer.width - 20, 8, COLORS.hud, 10, 'right');

    // Lives (draw small player sprites)
    const lifeSprite = SPRITES.player;
    const lifeSize = this.renderer.getSpriteSize(lifeSprite, 0.6);
    this.renderer.drawText(`${lives}`, 20, this.renderer.height - 20, COLORS.hudLives, 10);
    for (let i = 0; i < lives - 1; i++) {
      this.renderer.drawSprite(
        lifeSprite,
        50 + i * (lifeSize.w + 8),
        this.renderer.height - 22,
        COLORS.hudLives,
        0.6
      );
    }

    // Bottom line
    this.renderer.drawRect(0, this.renderer.height - 4, this.renderer.width, 2, COLORS.hud);
  }
}
