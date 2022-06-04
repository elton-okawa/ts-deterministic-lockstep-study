import { Input } from "./Input";

export class InputBuffer {
  inputs: Input[];

  constructor(window: number) {
    this.inputs = Array.from({ length: window }, (_, i) => ({
      frame: i,
      up: false,
      down: false,
      left: false,
      right: false,
      jump: false,
    }));
  }

  setInput(frame: number, other: Input): Input {
    const input = this.getInput(frame);
    input.frame = frame;
    input.up = other.up;
    input.down = other.down;
    input.left = other.left;
    input.right = other.right;
    input.jump = other.jump;

    return input;
  }

  getInput(frame: number): Input {
    return this.inputs[frame % this.inputs.length];
  }
}