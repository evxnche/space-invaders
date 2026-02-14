const DARK = {
  bg: '#0a0a0a',
  primary: '#FF9933',
  secondary: '#FFD700',
  player: '#FF9933',
  enemy1: '#FFD700',
  enemy2: '#FF9933',
  enemy3: '#FFD700',
  ufo: '#FF9933',
  bullet: '#FFD700',
  enemyBullet: '#FF9933',
  shield: '#FF9933',
  explosion: '#FFD700',
  hud: '#FFD700',
  hudScore: '#FF9933',
  hudLives: '#FFD700',
  text: '#FFD700',
  textDim: 'rgba(255,215,0,0.4)',
  title: '#FF9933',
  menuBtn: '#FFD700',
  menuBtnBg: 'rgba(255,215,0,0.1)',
  menuBtnBorder: '#FFD700',
  inputBg: 'rgba(255,255,255,0.05)',
  inputBorder: 'rgba(255,215,0,0.3)',
  inputText: '#FFD700',
  inputPlaceholder: 'rgba(255,215,0,0.3)',
  confirm: '#FF9933',
  modalBg: 'rgba(10,10,10,0.95)',
};

const LIGHT = {
  bg: '#FFF8F0',
  primary: '#C0170F',
  secondary: '#FFD700',
  player: '#C0170F',
  enemy1: '#C0170F',
  enemy2: '#FFD700',
  enemy3: '#C0170F',
  ufo: '#FFD700',
  bullet: '#C0170F',
  enemyBullet: '#B8860B',
  shield: '#C0170F',
  explosion: '#FFD700',
  hud: '#C0170F',
  hudScore: '#C0170F',
  hudLives: '#C0170F',
  text: '#C0170F',
  textDim: 'rgba(192,23,15,0.4)',
  title: '#C0170F',
  menuBtn: '#C0170F',
  menuBtnBg: 'rgba(192,23,15,0.08)',
  menuBtnBorder: '#C0170F',
  inputBg: 'rgba(0,0,0,0.04)',
  inputBorder: 'rgba(192,23,15,0.25)',
  inputText: '#C0170F',
  inputPlaceholder: 'rgba(192,23,15,0.3)',
  confirm: '#C0170F',
  modalBg: 'rgba(255,248,240,0.95)',
};

class Theme {
  constructor() {
    this.mode = localStorage.getItem('siTheme') || 'dark';
  }

  get colors() {
    return this.mode === 'dark' ? DARK : LIGHT;
  }

  toggle() {
    this.mode = this.mode === 'dark' ? 'light' : 'dark';
    localStorage.setItem('siTheme', this.mode);
    this.applyToDOM();
  }

  applyToDOM() {
    document.body.setAttribute('data-theme', this.mode);
  }
}

export const theme = new Theme();
