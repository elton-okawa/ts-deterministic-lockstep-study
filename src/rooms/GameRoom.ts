import { Room, Client } from "colyseus";
import { GameRoomState } from "./schema/GameRoomState";

export class GameRoom extends Room<GameRoomState> {

  onCreate (options: any) {
    this.setState(new GameRoomState());

    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });

  }

  onJoin (client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
