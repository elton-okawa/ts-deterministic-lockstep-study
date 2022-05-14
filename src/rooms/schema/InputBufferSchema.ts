import { Schema, ArraySchema, type } from "@colyseus/schema";
import { InputSchema } from "./InputSchema";

const STATIC_DELAY = 3;
const ROLLBACK_FRAMES = 7;

export interface RawInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

export class InputBufferSchema extends Schema {
  @type([ InputSchema ]) inputs;

  constructor() {
    super();
    this.inputs = new ArraySchema<InputSchema>(...Array.from(
      { length: STATIC_DELAY + ROLLBACK_FRAMES },
      () => new InputSchema(),
    ));
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

  getInput(frame: number): InputSchema {
    return this.inputs[frame % this.inputs.length];
  }
}
