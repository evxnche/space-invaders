export class Input {
  constructor() {
    this.keys = {};
    this.justPressed = {};
    window.addEventListener('keydown', (e) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Escape'].includes(e.key)) {
        e.preventDefault();
      }
      if (!this.keys[e.key]) {
        this.justPressed[e.key] = true;
      }
      this.keys[e.key] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key] = false;
    });
  }

  isDown(key) {
    return !!this.keys[key];
  }

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
}
