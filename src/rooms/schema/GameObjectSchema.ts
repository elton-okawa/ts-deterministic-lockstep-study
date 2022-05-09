import { Schema, Context, type } from "@colyseus/schema";
import { Vector } from "../PhysicsWorld";
import { VectorSchema } from "./VectorSchema";

export class GameObjectSchema extends Schema {
  @type("string") id: string;
  @type(VectorSchema) position: VectorSchema;

  constructor(id: string, position: Vector) {
    super();
    this.id = id;
    this.position = new VectorSchema(position.x, position.y);
  }

  setPosition(position: Vector) {
    this.position.x = position.x;
    this.position.y = position.y;
  }
}
