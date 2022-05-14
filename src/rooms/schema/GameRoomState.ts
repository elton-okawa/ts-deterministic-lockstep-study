import { Schema, MapSchema, type } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";

export class GameRoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();

  addPlayer(id: string) {
    this.players.set(id, new PlayerSchema(id));
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }
}
