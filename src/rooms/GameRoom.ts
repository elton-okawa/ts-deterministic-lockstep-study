import { Room, Client } from "colyseus";
import { InputFrameManager } from "../helpers/InputFrameManager";
import { PhysicsWorld } from "./PhysicsWorld";
import { GameRoomState } from "./schema/GameRoomState";
import { RawInput } from "./schema/InputBufferSchema";

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

interface InputMessage extends RawInput {
  frame: number;
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
  private spawnPointX = 1;
  private spawnPoints: { [key: string]: PlayerInfo } = {};

  private estimatedClientsFrame = 0;
  private inputFrameManager: InputFrameManager;

  onCreate (options: ClientOptions) {
    this.world = new PhysicsWorld();
    this.setState(new GameRoomState(0, process.env.NODE_ENV));
    this.setSimulationInterval((delta) => this.update(delta), TICK);
    this.setPatchRate(TICK);
    this.setupMessageHandlers();
    this.ownerId = options.localClientId;
    this.inputFrameManager = new InputFrameManager(STATIC_DELAY - 1, INPUT_WINDOW);
    console.log(`Room '${this.roomId}' created with owner '${this.ownerId}'`);
  }

  onJoin (client: Client, options: ClientOptions) {
    console.log(client.sessionId, "joined!");
    this.state.addPlayer(client.id, INPUT_WINDOW);
    this.inputFrameManager.addPlayer(client.id);
    this.spawnPoints[client.id] = {
      id: client.id,
      position: { x: this.spawnPointX, y: 0.5 },
    }
    this.spawnPointX += 1;
  }

  onLeave (client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
    this.state.removePlayer(client.id);
    this.inputFrameManager.removePlayer(client.id);
    delete this.spawnPoints[client.id];
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

  update(delta: number) {
    if (this.started) {
      while (this.timeSinceLastUpdate >= TICK) {
        const forcedList = this.inputFrameManager.tryToForceConfirmation(this.estimatedClientsFrame);
        if (forcedList) {
          console.log(`Forcing input confirmation, estimatedFrame ${this.estimatedClientsFrame}:\n${forcedList.map((forced) => `  id: ${forced.id}, lastConfirmedFrame: ${forced.lastConfirmedFrame}`).join('\n')}`);
          forcedList.map(forced => this.state.players.get(forced.id).copyInputFromTo(forced.lastConfirmedFrame, forced.lastConfirmedFrame + 1));
        }

        // if we confirm inputs from frame X, we can have state X+1
        if (this.state.frame <= this.inputFrameManager.confirmedFrame) {
          // TODO simulate server side and confirm state hash
          // this.world.update();
          this.state.frame += 1;
          // console.log(`Server: ${this.state.frame}, clientEstimated: ${this.estimatedClientsFrame}`);
        }

        this.estimatedClientsFrame += 1;
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
      const targetFrame = input.frame + STATIC_DELAY;
      if (this.inputFrameManager.confirmInput(client.id, targetFrame)) {
        this.state.players.get(client.id).setInput(targetFrame, input);
      }
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
        await this.lock();

        const startInMs = 1000;
        this.broadcast('startGame', { startInMs: startInMs, players: Object.values(this.spawnPoints) });
        setTimeout(() => this.started = true, startInMs);
      } else {
        console.log('Only owner can start the game');
      }
    });
  }
}
