import { Schema, MapSchema, type } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";

export class GameRoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type('number') frame = 0;

  addPlayer(id: string, staticDelay: number, window: number) {
    this.players.set(id, new PlayerSchema(id, staticDelay, window));
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }
}
