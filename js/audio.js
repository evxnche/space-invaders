export class Audio {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.marchIndex = 0;
    // Tabla-like pitches — A2, G2, E2, D2
    this.marchNotes = [110, 98, 82, 73];
    this.wrongKeyOnCooldown = false;
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not available');
    }
  }

  playTone(freq, duration, type, volume, startOffset) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (startOffset || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume || 0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.start(t);
    osc.stop(t + duration);
  }

  playNoise(duration, volume, startOffset) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (startOffset || 0);
    const bufferSize = Math.ceil(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    source.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.setValueAtTime(volume || 0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    source.start(t);
  }

  // Auto-rickshaw honk — "PA-PAAAA" rising horn
  honk(volume, startOffset) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + (startOffset || 0);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, t);
    osc.frequency.linearRampToValueAtTime(380, t + 0.04);
    osc.frequency.setValueAtTime(280, t + 0.06);
    osc.frequency.linearRampToValueAtTime(420, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.18);
    gain.gain.setValueAtTime(volume || 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Shoot — quick double-honk, lighter
  shoot() {
    this.honk(0.09, 0);
  }

  // Enemy explosion — dhol/tabla thump
  enemyExplosion() {
    if (!this.ctx) return;
    // Low thump
    this.playTone(120, 0.12, 'sine', 0.15);
    // Noise burst
    this.playNoise(0.08, 0.1);
    // Pitch drop
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t); osc.stop(t + 0.16);
  }

  // Player death — deflating shehnai / sad trombone
  playerExplosion() {
    if (!this.ctx) return;
    this.playNoise(0.4, 0.12);
    // Descending wail
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.6);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.start(t); osc.stop(t + 0.62);
  }

  // March — tabla-style 4-beat rhythm
  march() {
    if (!this.ctx) return;
    const note = this.marchNotes[this.marchIndex];
    // Main tabla hit
    this.playTone(note, 0.08, 'sine', 0.12);
    // Resonance
    this.playTone(note * 1.5, 0.04, 'sine', 0.05);
    this.marchIndex = (this.marchIndex + 1) % this.marchNotes.length;
  }

  // UFO / Ambassador car — classic car horn
  ufoSound() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.setValueAtTime(280, t + 0.1);
    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    osc.start(t); osc.stop(t + 0.24);
  }

  shieldHit() {
    this.playTone(180, 0.06, 'square', 0.05);
    this.playNoise(0.05, 0.06);
  }

  ufoExplosion() {
    this.playNoise(0.3, 0.15);
    // Descending car horn
    this.playTone(500, 0.15, 'sawtooth', 0.1);
    this.playTone(350, 0.2, 'sawtooth', 0.08, 0.1);
  }

  // Level clear — celebratory dhol roll + ascending notes (shehnai flavour)
  levelComplete() {
    if (!this.ctx) return;
    // Drum roll
    for (let i = 0; i < 6; i++) {
      this.playNoise(0.04, 0.06, i * 0.05);
    }
    // Ascending melody
    const notes = [261, 329, 392, 523, 659];
    notes.forEach((n, i) => this.playTone(n, 0.18, 'sawtooth', 0.08, 0.3 + i * 0.12));
  }

  gameOver() {
    // Sad descending — deflating mood
    const notes = [392, 330, 262, 196];
    notes.forEach((n, i) => this.playTone(n, 0.3, 'sawtooth', 0.08, i * 0.25));
  }

  // Sustained Indian truck horn for wrong key easter egg
  autoRickshawHonk() {
    if (!this.ctx || this.wrongKeyOnCooldown) return;
    this.wrongKeyOnCooldown = true;
    setTimeout(() => { this.wrongKeyOnCooldown = false; }, 5000);

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain); gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    // PA-PA-PAAAN pattern
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(420, t + 0.06);
    osc.frequency.setValueAtTime(300, t + 0.1);
    osc.frequency.linearRampToValueAtTime(420, t + 0.16);
    osc.frequency.setValueAtTime(300, t + 0.2);
    osc.frequency.linearRampToValueAtTime(460, t + 0.25);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.55);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.setValueAtTime(0.18, t + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc.start(t);
    osc.stop(t + 0.62);
  }

  // Uncon easter egg — magic jingle
  unconJingle() {
    if (!this.ctx) return;
    const notes = [523, 659, 784, 659, 880];
    notes.forEach((n, i) => this.playTone(n, 0.15, 'square', 0.09, i * 0.1));
  }

  // Evan footer 7-click secret
  secretJingle() {
    if (!this.ctx) return;
    const notes = [262, 330, 392, 523, 392, 330, 523, 659, 784];
    notes.forEach((n, i) => this.playTone(n, 0.12, 'sawtooth', 0.07, i * 0.08));
  }
}
