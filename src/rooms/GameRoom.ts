import { Room, Client } from "colyseus";
import { PhysicsWorld } from "./PhysicsWorld";
import { GameObjectSchema } from "./schema/GameObjectSchema";
import { GameRoomState } from "./schema/GameRoomState";

// TODO physics depend on game object
export class GameRoom extends Room<GameRoomState> {

  world: PhysicsWorld;

  onCreate (options: any) {
    this.world = new PhysicsWorld();
    this.setState(new GameRoomState());
    this.setSimulationInterval((delta) => this.update(delta));
    this.setPatchRate(50);
    this.onMessage("type", (client, message) => {
      //
      // handle "type" message
      //
    });
    this.start();
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

  start() {
    this.world.start();
    const staticBodies = this.world.staticBodiesInfo;
    const bodies = this.world.bodies;
    [...staticBodies, ...bodies].forEach(body => this.state.addGameObject(new GameObjectSchema(body.id.toString(), body.position)));
  }

  update(delta: number) {
    this.world.update(delta);
    const staticBodies = this.world.staticBodiesInfo;
    const bodies = this.world.bodies;
    [...staticBodies, ...bodies].forEach(body => this.state.updateGameObject(body.id.toString(), body.position));
  }
}
