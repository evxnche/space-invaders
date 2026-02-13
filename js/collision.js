const ENEMY_POINTS = [30, 20, 10];

export class CollisionDetector {
  constructor() {}

  checkPlayerBulletVsEnemies(player, enemyGrid) {
    const b = player.bullet;
    if (!b) return null;

    for (let i = 0; i < enemyGrid.enemies.length; i++) {
      const e = enemyGrid.enemies[i];
      if (!e.alive) continue;

      if (this.aabb(b, e)) {
        player.bullet = null;
        enemyGrid.killEnemy(i);
        return { index: i, points: ENEMY_POINTS[e.type], x: e.x, y: e.y, w: e.w, h: e.h };
      }
    }
    return null;
  }

  checkPlayerBulletVsUFO(player, ufo) {
    if (!player.bullet || !ufo.active) return null;
    const b = player.bullet;

    if (this.aabb(b, { x: ufo.x, y: ufo.y, w: ufo.w, h: ufo.h })) {
      player.bullet = null;
      return ufo.hit();
    }
    return null;
  }

  checkEnemyBulletsVsPlayer(bulletManager, player) {
    if (player.dead || player.blinkTimer > 0) return false;

    for (let i = bulletManager.enemyBullets.length - 1; i >= 0; i--) {
      const b = bulletManager.enemyBullets[i];
      if (this.aabb(b, { x: player.x, y: player.y, w: player.w, h: player.h })) {
        bulletManager.removeEnemyBullet(i);
        return true;
      }
    }
    return false;
  }

  checkPlayerBulletVsShields(player, shieldManager) {
    if (!player.bullet) return false;
    const b = player.bullet;
    if (shieldManager.checkBulletCollision(b.x, b.y, b.w, b.h)) {
      player.bullet = null;
      return true;
    }
    return false;
  }

  checkEnemyBulletsVsShields(bulletManager, shieldManager) {
    for (let i = bulletManager.enemyBullets.length - 1; i >= 0; i--) {
      const b = bulletManager.enemyBullets[i];
      if (shieldManager.checkBulletCollision(b.x, b.y, b.w, b.h)) {
        bulletManager.removeEnemyBullet(i);
      }
    }
  }

  checkEnemiesReachBottom(enemyGrid, player) {
    return enemyGrid.getLowestY() >= player.y;
  }

  aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
  }
}
