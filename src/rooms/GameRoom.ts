import { Room, Client } from "colyseus";
import { PhysicsWorld } from "./PhysicsWorld";
import { GameObjectSchema } from "./schema/GameObjectSchema";
import { GameRoomState } from "./schema/GameRoomState";

const TICK = 33.33; // ~30fps physics

// TODO physics depend on game object
export class GameRoom extends Room<GameRoomState> {

  world: PhysicsWorld;
  timeSinceLastUpdate: number = 0;

  onCreate (options: any) {
    this.world = new PhysicsWorld();
    this.setState(new GameRoomState());
    this.setSimulationInterval((delta) => this.update(delta), TICK);
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
    // const staticBodies = this.world.staticInfo;
    // const bodies = this.world.bodies;
    // [...staticBodies, ...bodies].forEach(body => this.state.addGameObject(new GameObjectSchema(body.id.toString(), body.position)));
  }

  update(delta: number) {
    while (this.timeSinceLastUpdate >= delta) {
      this.world.update();

      this.timeSinceLastUpdate -= delta;
    }

    this.timeSinceLastUpdate += delta;
  }
}
