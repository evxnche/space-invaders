const GAME_KEYS = new Set([
  'ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' ','Enter','Escape',
  't','T','a','d','A','D','Shift','Control','Alt','Meta','Tab','CapsLock',
]);

export class Input {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    this.keySequence = []; // last 20 letter keystrokes for easter eggs

    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft','ArrowRight',' ','Enter','Escape'].includes(e.key)) e.preventDefault();
      if (!this.keys[e.key]) {
        this.justPressed[e.key] = true;
        // Track letter keys for sequence detection
        if (e.key.length === 1 && e.key.match(/[a-z]/i)) {
          this.keySequence.push(e.key.toLowerCase());
          if (this.keySequence.length > 20) this.keySequence.shift();
        }
      }
      this.keys[e.key] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  isDown(key) { return !!this.keys[key]; }

  wasPressed(key) {
    if (this.justPressed[key]) {
      this.justPressed[key] = false;
      return true;
    }
    return false;
  }

  clearFrame() {
    this.justPressed = {};
  }

  // Check if last N keystrokes match sequence string
  checkSequence(seq) {
    const buf = this.keySequence.slice(-seq.length).join('');
    return buf === seq;
  }

  clearSequence() {
    this.keySequence = [];
  }

  // Returns true if any non-game key is currently held
  hasWrongKeyHeld() {
    for (const [key, held] of Object.entries(this.keys)) {
      if (held && !GAME_KEYS.has(key) && key.length === 1) return true;
    }
    return false;
  }

  anyKeyPressed() {
    return Object.values(this.justPressed).some(v => v);
  }
}
