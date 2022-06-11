import { Schema, MapSchema, type } from "@colyseus/schema";
import { PlayerSchema } from "./PlayerSchema";

export class GameRoomState extends Schema {
  @type({ map: PlayerSchema }) players = new MapSchema<PlayerSchema>();
  @type('number') frame;
  @type('string') env;

  constructor(frame: number, env: string) {
    super();
    this.frame = frame;
    this.env = env;
  }

  addPlayer(id: string, window: number) {
    this.players.set(id, new PlayerSchema(id, window));
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }
}
