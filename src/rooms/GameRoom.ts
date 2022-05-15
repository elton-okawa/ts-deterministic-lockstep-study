import { Room, Client } from "colyseus";
import { PhysicsWorld } from "./PhysicsWorld";
import { GameRoomState } from "./schema/GameRoomState";
import { InputMessage } from "./schema/PlayerSchema";

const TICK = 33.33; // ~30fps physics

interface ClientOptions {
  localClientId: number;
}

interface CheckOwnershipMessage {
  localClientId: number;
}

interface StartGameMessage {
  localClientId: number;
}

// TODO physics depend on game object
export class GameRoom extends Room<GameRoomState> {

  world: PhysicsWorld;
  timeSinceLastUpdate: number = 0;
  ownerId: number;

  onCreate (options: ClientOptions) {
    this.world = new PhysicsWorld();
    this.setState(new GameRoomState());
    this.setSimulationInterval((delta) => this.update(delta), TICK);
    this.setPatchRate(50);
    this.setupMessageHandlers();
    this.ownerId = options.localClientId;
    this.start();
    console.log(`Room '${this.roomId}' created with owner '${this.ownerId}'`);
  }

  onJoin (client: Client, options: ClientOptions) {
    console.log(client.sessionId, "joined!");
    this.state.addPlayer(client.id);
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.removePlayer(client.id);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  start() {
    this.world.start();
  }

  update(delta: number) {
    while (this.timeSinceLastUpdate >= delta) {
      this.world.update();

      this.timeSinceLastUpdate -= delta;
    }

    this.timeSinceLastUpdate += delta;
  }

  private setupMessageHandlers() {
    this.onMessage('input', (client: Client, input: InputMessage) => {
      // TODO block input with old frame, client send real frame instead of delayed
      this.state.players.get(client.id).setInput(input);
    });

    this.onMessage('checkOwnership', (client: Client, input: CheckOwnershipMessage) => {
      const isOwner = input.localClientId === this.ownerId;
      client.send('checkOwnership', { isOwner });
    });

    this.onMessage('startGame', async (client: Client, input: StartGameMessage) => {
      const isOwner = input.localClientId === this.ownerId;
      if (isOwner) {
        // TODO send player position
        await this.lock();
        this.broadcast('startGame');
      } else {
        console.log('Only owner can start the game');
      }
    });
  }
}
