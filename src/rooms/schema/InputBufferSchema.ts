import { Schema, ArraySchema, type } from "@colyseus/schema";
import { InputSchema } from "./InputSchema";

export interface RawInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

export class InputBufferSchema extends Schema {
  @type([ InputSchema ]) inputs;

  private window: number;

  constructor(window: number) {
    super();
    this.window = window;
    this.inputs = new ArraySchema<InputSchema>(...Array.from(
      { length: this.window },
      (_, i) => new InputSchema(i),
    ));
  }

  setInput(frame: number, rawInput: RawInput) {
    const input = this.getInput(frame);
    input.frame = frame;
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
