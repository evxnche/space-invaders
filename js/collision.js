const ENEMY_POINTS = [30, 20, 10];

export class CollisionDetector {
  constructor() {}

  checkPlayerBulletsVsEnemies(player, enemyGrid) {
    const hits = [];
    for (let bi = player.bullets.length - 1; bi >= 0; bi--) {
      const b = player.bullets[bi];
      for (let i = 0; i < enemyGrid.enemies.length; i++) {
        const e = enemyGrid.enemies[i];
        if (!e.alive) continue;
        if (this.aabb(b, e)) {
          player.removeBullet(bi);
          enemyGrid.killEnemy(i);
          hits.push({ index: i, points: ENEMY_POINTS[e.type], x: e.x, y: e.y, w: e.w, h: e.h });
          break;
        }
      }
    }
    return hits;
  }

  checkPlayerBulletsVsUFO(player, ufo) {
    if (!ufo.active) return null;
    for (let bi = player.bullets.length - 1; bi >= 0; bi--) {
      const b = player.bullets[bi];
      if (this.aabb(b, { x: ufo.x, y: ufo.y, w: ufo.w, h: ufo.h })) {
        player.removeBullet(bi);
        return ufo.hit();
      }
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

  checkPlayerBulletsVsShields(player, shieldManager) {
    let hit = false;
    for (let bi = player.bullets.length - 1; bi >= 0; bi--) {
      const b = player.bullets[bi];
      if (shieldManager.checkBulletCollision(b.x, b.y, b.w, b.h)) {
        player.removeBullet(bi);
        hit = true;
      }
    }
    return hit;
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
