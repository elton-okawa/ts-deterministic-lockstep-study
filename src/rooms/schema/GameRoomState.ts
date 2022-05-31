import { Schema, MapSchema, type } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";

export class GameRoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type('number') frame;

  constructor(frame: number) {
    super();
    this.frame = frame;
  }

  addPlayer(id: string, window: number) {
    this.players.set(id, new PlayerSchema(id, window));
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }
}
