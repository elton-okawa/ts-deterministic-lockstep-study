import { Schema, type } from "@colyseus/schema";
import { InputBufferSchema, RawInput } from "./InputBufferSchema";
import { InputSchema } from "./InputSchema";

export class PlayerSchema extends Schema {
  @type('string') id;
  @type(InputBufferSchema) inputBuffer;

  constructor(id: string, window: number) {
    super();
    this.id = id;
    this.inputBuffer = new InputBufferSchema(window);
  }

  setInput(frame: number, input: RawInput) {
    this.inputBuffer.setInput(frame, input);
  }

  getInput(frame: number): InputSchema {
    return this.inputBuffer.getInput(frame);
  }

  copyInputFromTo(sourceFrame: number, targetFrame: number) {
    const confirmedInput = this.inputBuffer.getInput(sourceFrame);
    this.inputBuffer.setInput(targetFrame, confirmedInput);
  }
}
