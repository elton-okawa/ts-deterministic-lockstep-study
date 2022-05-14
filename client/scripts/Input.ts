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
}