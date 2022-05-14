import { Input } from "./Input";

const STATIC_DELAY = 3;
const ROLLBACK_FRAMES = 7;

export interface RawInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

export class InputBuffer {

  inputs: Input[];

  constructor() {
    this.inputs = Array.from({ length: STATIC_DELAY + ROLLBACK_FRAMES }, () => new Input());
  }

  setInput(frame: number, rawInput: RawInput) {
    const targetFrame = frame + STATIC_DELAY;
    const input = this.getInput(targetFrame);
    input.frame = targetFrame;
    input.up = rawInput.up;
    input.down = rawInput.down;
    input.left = rawInput.left;
    input.right = rawInput.right;
    input.jump = rawInput.jump;
  }

  getInput(frame: number): Input {
    return this.inputs[frame % this.inputs.length];
  }
}