import { Schema, MapSchema, type } from "@colyseus/schema";
import { Vector } from "../PhysicsWorld";
import { GameObjectSchema } from "./GameObjectSchema";

export class GameRoomState extends Schema {
  @type({ map: GameObjectSchema }) gameObjects = new MapSchema<GameObjectSchema>();

  addGameObject(obj: GameObjectSchema) {
    this.gameObjects.set(obj.id, obj);
  }

  // TODO think more about depending on Vector
  updateGameObject(id: string, position: Vector) {
    this.gameObjects.get(id).setPosition(position);
  }
}
