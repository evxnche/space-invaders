export class Audio {
  constructor() {
    this.ctx = null;
    this.initialized = false;
    this.marchIndex = 0;
    this.marchNotes = [55, 49.5, 46.25, 41.2]; // 4-note march
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

  playTone(freq, duration, type, volume) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type || 'square';
    osc.frequency.value = freq;
    gain.gain.value = volume || 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  playNoise(duration, volume) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    source.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.value = volume || 0.1;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.start();
  }

  shoot() {
    this.playTone(880, 0.1, 'square', 0.08);
    setTimeout(() => this.playTone(440, 0.05, 'square', 0.05), 50);
  }

  enemyExplosion() {
    this.playNoise(0.15, 0.12);
    this.playTone(200, 0.15, 'sawtooth', 0.08);
  }

  playerExplosion() {
    this.playNoise(0.4, 0.15);
    this.playTone(100, 0.3, 'sawtooth', 0.1);
    setTimeout(() => this.playTone(80, 0.3, 'sawtooth', 0.08), 150);
  }

  march() {
    const note = this.marchNotes[this.marchIndex];
    this.playTone(note, 0.1, 'square', 0.08);
    this.marchIndex = (this.marchIndex + 1) % this.marchNotes.length;
  }

  ufoSound() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = 400;
    osc.frequency.linearRampToValueAtTime(600, this.ctx.currentTime + 0.1);
    osc.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + 0.2);
    gain.gain.value = 0.06;
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  shieldHit() {
    this.playTone(150, 0.08, 'square', 0.05);
  }

  ufoExplosion() {
    this.playNoise(0.3, 0.15);
    this.playTone(600, 0.15, 'sine', 0.1);
    setTimeout(() => this.playTone(400, 0.15, 'sine', 0.08), 100);
  }

  levelComplete() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.15, 'square', 0.08), i * 120);
    });
  }

  gameOver() {
    const notes = [392, 330, 262, 196];
    notes.forEach((n, i) => {
      setTimeout(() => this.playTone(n, 0.3, 'square', 0.08), i * 250);
    });
  }
}
