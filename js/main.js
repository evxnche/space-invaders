import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { Game } from './game.js';
import { theme } from './theme.js';
import * as sb from './supabase.js';
import { preloadImages } from './images.js';

// --- Init ---
theme.applyToDOM();
await preloadImages();

const canvas = document.getElementById('gameCanvas');
const renderer = new Renderer(canvas);
const input = new Input();
const game = new Game(renderer, input);

// --- HTML UI References ---
const gameWrapper   = document.getElementById('game-wrapper');
const menuUI        = document.getElementById('menu-ui');
const gameoverUI    = document.getElementById('gameover-ui');
const themeToggle   = document.getElementById('theme-toggle');
const muteToggle    = document.getElementById('mute-toggle');
const btnPlay       = document.getElementById('btn-play');
const btnMultiplayer= document.getElementById('btn-multiplayer');
const btnLeaderboard= document.getElementById('btn-leaderboard');
const btnRestart    = document.getElementById('btn-restart');
const btnMainMenu   = document.getElementById('btn-mainmenu');
const btnQuit       = document.getElementById('btn-quit');
const msgInput      = document.getElementById('msg-input');
const msgSend       = document.getElementById('msg-send');
const msgConfirm    = document.getElementById('msg-confirm');

// Multiplayer modal
const mpModal       = document.getElementById('mp-modal');
const mpCreate      = document.getElementById('mp-create');
const mpJoin        = document.getElementById('mp-join');
const mpCodeInput   = document.getElementById('mp-code-input');
const mpCodeDisplay = document.getElementById('mp-code-display');
const mpStatus      = document.getElementById('mp-status');
const mpClose       = document.getElementById('mp-close');
const mpStart       = document.getElementById('mp-start');
const mpCountBtns   = document.querySelectorAll('.mp-count');

game.setUI({ menuUI, gameoverUI, themeToggle, mpModal, mpStatus, btnQuit });

// --- Wrapper Scaling ---
function resizeWrapper() {
  const scale = Math.min(window.innerWidth / 800, window.innerHeight / 600);
  gameWrapper.style.transform = `translate(-50%, -50%) scale(${scale})`;
}
window.addEventListener('resize', resizeWrapper);
resizeWrapper();

// --- Background Music ---
const bgMusic = new Audio('gg.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.18;

let musicStarted = false;
let muted = localStorage.getItem('siMuted') === 'true';

function updateMuteIcon() {
  muteToggle.textContent = '';
  muteToggle.classList.toggle('muted', muted);
  bgMusic.muted = muted;
}
updateMuteIcon();

function startMusic() {
  if (!musicStarted) {
    musicStarted = true;
    bgMusic.play().catch(() => {});
  }
}

muteToggle.addEventListener('click', () => {
  muted = !muted;
  localStorage.setItem('siMuted', muted);
  updateMuteIcon();
  if (!musicStarted && !muted) startMusic();
});

// Start music on first user interaction
document.addEventListener('click', startMusic, { once: true });
document.addEventListener('keydown', startMusic, { once: true });

// --- Theme Toggle ---
const themeIcon = () => theme.mode === 'dark' ? '☽' : '☀';
themeToggle.textContent = themeIcon();

themeToggle.addEventListener('click', () => {
  theme.toggle();
  themeToggle.textContent = themeIcon();
});

// --- Play Button ---
btnPlay.addEventListener('click', () => {
  startMusic();
  game.startSoloGame();
});

// --- Game-over UI: Restart / Main Menu ---
btnRestart.addEventListener('click', () => {
  startMusic();
  game.startSoloGame();
});
btnMainMenu.addEventListener('click', () => {
  game.returnToMenu();
});
btnQuit.addEventListener('click', () => {
  game.returnToMenu();
});

// --- Leaderboard Button ---
if (btnLeaderboard) {
  if (!sb.isConfigured()) btnLeaderboard.style.opacity = '0.3';
  btnLeaderboard.addEventListener('click', () => game.openLeaderboard());
}

// --- Multiplayer Modal ---
let selectedPlayerCount = 2;

btnMultiplayer.addEventListener('click', () => {
  if (!sb.isConfigured()) return;
  mpModal.classList.remove('hidden');
  mpCodeDisplay.textContent = '';
  mpStatus.classList.add('hidden');
  mpStart.classList.add('hidden');
  game.openMultiplayerLobby();
});

mpCountBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    mpCountBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedPlayerCount = parseInt(btn.dataset.count);
  });
});

mpCreate.addEventListener('click', () => {
  const code = game.createMultiplayerRoom(selectedPlayerCount);
  mpCodeDisplay.textContent = `Room: ${code}`;
  mpStart.classList.remove('hidden');
});

mpJoin.addEventListener('click', () => {
  const code = mpCodeInput.value.trim();
  if (code.length !== 6) return;
  game.joinMultiplayerRoom(code);
  mpCodeDisplay.textContent = `Joined: ${code}`;
  mpStatus.textContent = 'Waiting for host to start...';
  mpStatus.classList.remove('hidden');
});

mpStart.addEventListener('click', () => {
  startMusic();
  game.startMultiplayerGame();
});

mpClose.addEventListener('click', () => {
  mpModal.classList.add('hidden');
  game.state = 'MENU';
  game.showMenuUI();
});

// --- Message Input ("say hi to the dev") ---
function sendHiMessage() {
  const content = msgInput.value.trim();
  if (!content) return;

  if (sb.isConfigured()) sb.sendMessage(content);
  msgInput.value = '';
  msgConfirm.classList.remove('hidden');
  msgConfirm.style.opacity = '1';

  // Easter egg: blushing notification
  sendHiEasterEgg();

  setTimeout(() => {
    msgConfirm.style.transition = 'opacity 0.5s';
    msgConfirm.style.opacity = '0';
    setTimeout(() => msgConfirm.classList.add('hidden'), 500);
  }, 2000);
}

msgSend.addEventListener('click', sendHiMessage);
msgInput.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') sendHiMessage();
});

// Prevent game keys while typing in any input
document.querySelectorAll('input').forEach(el => {
  el.addEventListener('keydown', (e) => e.stopPropagation());
  el.addEventListener('keyup', (e) => e.stopPropagation());
});

// --- "say hi to evan" message → blushing easter egg ---
function sendHiEasterEgg() {
  game.audio.init();
  game.audio.secretJingle();
  game.pushNotification("i'm blushing already, stop :))", 2);
}

// --- Game Loop ---
let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  game.update(dt);
  game.draw();
  input.clearFrame();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame((ts) => {
  lastTime = ts;
  gameLoop(ts);
});
