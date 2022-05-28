import { Input } from "./Input";

const STATIC_DELAY = 3;
const ROLLBACK_FRAMES = 17;

export class InputBuffer {
  static SIZE = STATIC_DELAY + ROLLBACK_FRAMES;

  inputs: Input[];

  constructor() {
    this.inputs = Array.from({ length: STATIC_DELAY + ROLLBACK_FRAMES }, () => ({
      frame: 0,
      up: false,
      down: false,
      left: false,
      right: false,
      jump: false,
    }));
  }

  setInput(frame: number, other: Input) {
    const input = this.getInput(frame);
    input.frame = frame;
    input.up = other.up;
    input.down = other.down;
    input.left = other.left;
    input.right = other.right;
    input.jump = other.jump;
  }

  getInput(frame: number): Input {
    return this.inputs[frame % this.inputs.length];
  }
}