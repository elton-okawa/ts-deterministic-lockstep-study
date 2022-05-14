import { Schema, type } from "@colyseus/schema";
import { InputBufferSchema, RawInput } from "./InputBufferSchema";
import { InputSchema } from "./InputSchema";

export interface InputMessage extends RawInput {
  frame: number;
}

export class PlayerSchema extends Schema {
  @type('string') id;
  @type(InputBufferSchema) inputBuffer;

  constructor(id: string) {
    super();
    this.id = id;
    this.inputBuffer = new InputBufferSchema();
  }

  setInput(inputMessage: InputMessage) {
    this.inputBuffer.setInput(inputMessage.frame, inputMessage);
  }

  getInput(frame: number): InputSchema {
    return this.inputBuffer.getInput(frame);
  }
}
