import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas);
const input = new Input();
const game = new Game(renderer, input);

let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05); // cap delta to avoid spiral
  lastTime = timestamp;

  game.update(dt);
  game.draw();
  input.clearFrame();

  requestAnimationFrame(gameLoop);
}

// Scale canvas to fit viewport while maintaining aspect ratio
function resizeCanvas() {
  const ratio = canvas.width / canvas.height;
  const windowRatio = window.innerWidth / window.innerHeight;

  if (windowRatio > ratio) {
    canvas.style.height = '100vh';
    canvas.style.width = 'auto';
  } else {
    canvas.style.width = '100vw';
    canvas.style.height = 'auto';
  }
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

requestAnimationFrame((ts) => {
  lastTime = ts;
  gameLoop(ts);
});
