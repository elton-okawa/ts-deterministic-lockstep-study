import { Schema, type } from "@colyseus/schema";

export class InputSchema extends Schema {
  @type('number') frame: number;
  @type('boolean') up: boolean;
  @type('boolean') down: boolean;
  @type('boolean') left: boolean;
  @type('boolean') right: boolean;
  @type('boolean') jump: boolean;
  
  constructor() {
    super();
    this.frame = 0;
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.jump = false;
  }
}
