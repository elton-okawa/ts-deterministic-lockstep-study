import { Schema, type } from "@colyseus/schema";
import { InputBufferSchema, RawInput } from "./InputBufferSchema";
import { InputSchema } from "./InputSchema";

export interface InputMessage extends RawInput {
  frame: number;
}

export class PlayerSchema extends Schema {
  @type('string') id;
  @type(InputBufferSchema) inputBuffer;

  constructor(id: string, staticDelay: number, window: number) {
    super();
    this.id = id;
    this.inputBuffer = new InputBufferSchema(staticDelay, window);
  }

  setInput(inputMessage: InputMessage) {
    this.inputBuffer.setInput(inputMessage.frame, inputMessage);
  }

  getInput(frame: number): InputSchema {
    return this.inputBuffer.getInput(frame);
  }

  copyInputFromTo(sourceFrame: number, targetFrame: number) {
    const confirmedInput = this.inputBuffer.getInput(sourceFrame);
    this.inputBuffer.setInput(targetFrame, confirmedInput);
  }
}
