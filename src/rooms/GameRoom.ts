import { Room, Client } from "colyseus";
import { PhysicsWorld } from "./PhysicsWorld";
import { GameRoomState } from "./schema/GameRoomState";
import { InputMessage } from "./schema/PlayerSchema";

const TICK = 33.33; // ~30fps physics
const STATIC_DELAY = 3;
const INPUT_WINDOW = 10;

interface ClientOptions {
  localClientId: number;
}

interface CheckOwnershipMessage {
  localClientId: number;
}

interface StartGameMessage {
  localClientId: number;
}

interface PlayerInfo {
  id: string;
  position: { x: number, y: number };
}

// TODO simulate physics on server and send state hash to verify desync
export class GameRoom extends Room<GameRoomState> {

  private world: PhysicsWorld;
  private timeSinceLastUpdate: number = 0;
  private ownerId: number;
  private started = false;
  private spawnPointX = 100;
  private spawnPoints: { [key: string]: PlayerInfo } = {};
  private frame = 0;

  onCreate (options: ClientOptions) {
    this.world = new PhysicsWorld();
    this.setState(new GameRoomState());
    this.setSimulationInterval((delta) => this.update(delta), TICK);
    this.setPatchRate(TICK);
    this.setupMessageHandlers();
    this.ownerId = options.localClientId;
    console.log(`Room '${this.roomId}' created with owner '${this.ownerId}'`);
  }

  onJoin (client: Client, options: ClientOptions) {
    console.log(client.sessionId, "joined!");
    this.state.addPlayer(client.id, STATIC_DELAY, INPUT_WINDOW);
    this.spawnPoints[client.id] = {
      id: client.id,
      position: { x: this.spawnPointX, y: 50 },
    }
    this.spawnPointX += 100;
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.removePlayer(client.id);
    delete this.spawnPoints[client.id];
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  update(delta: number) {
    if (this.started) {
      while (this.timeSinceLastUpdate >= TICK) {
        this.frame += 1;
        this.world.update();
  
        this.timeSinceLastUpdate -= TICK;
      }
  
      this.timeSinceLastUpdate += delta;
    }
  }

  private setupMessageHandlers() {
    this.onMessage('ping', (client: Client) => {
      client.send('pong');
    });

    this.onMessage('input', (client: Client, input: InputMessage) => {
      // TODO block input with old frame, client send real frame instead of delayed
      if (this.frame >= input.frame + INPUT_WINDOW) {
        console.log(`It should reject input from ${client.id}`);
      }
      this.state.players.get(client.id).setInput(input);
    });

    this.onMessage('checkOwnership', (client: Client, input: CheckOwnershipMessage) => {
      const isOwner = input.localClientId === this.ownerId;
      client.send('checkOwnership', { isOwner });
    });

    this.onMessage('startGame', async (client: Client, input: StartGameMessage) => {
      const isOwner = input.localClientId === this.ownerId;
      if (isOwner) {
        console.log(`Starting game with:`);
        console.log(Object.values(this.spawnPoints));
        // TODO maybe set a time to start to everyone start at the same time
        await this.lock();
        this.broadcast('startGame', Object.values(this.spawnPoints));
        this.started = true;
      } else {
        console.log('Only owner can start the game');
      }
    });
  }
}
