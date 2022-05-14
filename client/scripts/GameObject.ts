import { InputBuffer } from "./InputBuffer";

export interface Vector {
  x: number;
  y: number;
}

export interface GameObject {
  id: number;
  position: Vector;
  size: Vector;
}

export interface PlayerObject extends GameObject {
  inputs: InputBuffer;
}
