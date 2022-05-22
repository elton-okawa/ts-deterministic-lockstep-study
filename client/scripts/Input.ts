export class Input {
  frame: number;
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;

  constructor() {
    this.frame = 0;
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.jump = false;
  }

  equals(other: Input) {
    if (this.frame !== other.frame) {
      console.warn(`Comparing inputs from different frames (current: ${this.frame}, other: ${this.frame})`);
    }

    return this.up === other.up &&
      this.down === other.down &&
      this.left === other.left &&
      this.right === other.right &&
      this.jump === other.jump;
  }
}