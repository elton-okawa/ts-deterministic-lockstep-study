import { InputBuffer } from "./InputBuffer";
import { Vector } from "./Vector";

export class GameObject {
  id: number;
  position: Vector;
  rotation: number;
  size: Vector;
  sprite: string;

  constructor() {
    this.id = 0;
    this.position = { x: 0, y: 0 };
    this.rotation = 0;
    this.size = { x: 0, y: 0 };
    this.sprite = null;
  }

  set radius(arg: number) {
    this.size.x = arg * 2;
    this.size.y = arg * 2;
  }
}

export interface PlayerObject extends GameObject {
  inputs: InputBuffer;
}
