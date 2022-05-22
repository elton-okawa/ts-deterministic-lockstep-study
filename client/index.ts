import { GameRoomState } from "./generated/GameRoomState";
import { Application } from './scripts/Application';
import { PhysicsWorld } from "./scripts/PhysicsWorld";
import { InputBuffer, RawInput } from "./scripts/InputBuffer";
import { Ping } from "./scripts/Ping";

const client = new Colyseus.Client('ws://localhost:2567');
const localClientId = Date.now();

let room: Colyseus.Room;

const FIXED_DELTA = 33.33;
const FRAME_FREQUENCY = 1 / FIXED_DELTA;
const FPS = 60;
const ROLLBACK_WINDOW = 20;

let currentState: GameRoomState;
let app: Application;
let world: PhysicsWorld;
let timeSinceLastUpdate = 0;
let lastUpdate: number;
let currentInput: RawInput;
let ownId: string;
let predictedInputs: { [key: string]: InputBuffer };

let frame: number;
let framesAhead: number;

let updateTimer: NodeJS.Timer;
let isOwner = false;
let started = false;
let ping: Ping;

interface CheckOwnershipMessage {
  isOwner: boolean;
}

interface PlayerInfo {
  id: string;
  position: { x: number, y: number };
}

function connect() {
  client.joinOrCreate<GameRoomState>('game_room', { localClientId }).then(gameRoom => {
    console.log(gameRoom.sessionId, 'joined', gameRoom.name);
    room = gameRoom;

    gameRoom.onMessage('checkOwnership', (message: CheckOwnershipMessage) => {
      isOwner = message.isOwner;
      console.log(`isOwner: ${isOwner}`);

      if (isOwner) {
        app.tryRemoveWaitingForHost();
        app.addStartButton(() => {
          console.log('Start game clicked');
          room.send('startGame', { localClientId });
        });
      }
    });

    gameRoom.onMessage('startGame', (playerInfos: PlayerInfo[]) => {
      start(playerInfos);
      started = true;
    });

    // TODO perform static sync using gameRoom.state
    gameRoom.onStateChange(state => {
      // TODO compare state to rollback
      // console.log(`Inputs: ${state.players.get(ownId).inputBuffer.inputs.map((input) => input.frame)}`)
      currentState = state;
      const halfRTT = ping.ping / 2;
      framesAhead = frame - (state.frame + halfRTT * FRAME_FREQUENCY);
      // console.log(`frame: ${frame}, stateFrame: ${state.frame}, framesAhead: ${framesAhead}`);
    });

    gameRoom.onError((code: number, message: string) => {
      console.log(`Error code '${code}': '${message}'`);
      clearInterval(updateTimer);
    });

    gameRoom.onLeave((code: number) => {
      console.log(`Leave code '${code}'`);
      clearInterval(updateTimer);
    });

    setup(gameRoom.sessionId);
    room.send('checkOwnership', { localClientId });
  }).catch(e => {
      console.log('JOIN ERROR', e);
  });
}

function setup(id: string) {
  app = new Application(640, 360);

  ownId = id;
  frame = 1;

  ping = new Ping(() => {
    room.send('ping');
  });
  room.onMessage('pong', () => {
    ping.handlePong();
    app.ping = ping.ping;
  });
  ping.startPingRoutine();

  app.addWaitingForHost();
}

function start(playerInfos: PlayerInfo[]) {
  app.tryRemoveStartButton();
  app.tryRemoveWaitingForHost();

  world = new PhysicsWorld(ROLLBACK_WINDOW);
  predictedInputs = {};

  playerInfos.forEach(player => {
    world.addPlayer(player.id, player.position);
    predictedInputs[player.id] = new InputBuffer();
  });

  lastUpdate = Date.now();
  updateTimer = setInterval(update, 1000 / FPS);
  currentInput = {
    up: false,
    down: false,
    left: false,
    right: false,
    jump: false,
  };

  document.addEventListener('keydown', (event: KeyboardEvent) => 
    handleKey(event.key, true));
  document.addEventListener('keyup', (event: KeyboardEvent) =>
    handleKey(event.key, false));
}

function handleKey(key: string, pressed: boolean) {
  switch (key) {
    case 'w':
      currentInput.up = pressed;
      break;
    case 's':
      currentInput.down = pressed;
      break;
    case 'a':
      currentInput.left = pressed;
      break;
    case 'd':
      currentInput.right = pressed;
      break;
    case ' ':
      currentInput.jump = pressed;
      break;
  }
}

let inputWarningCount = 21;

function update() {
  const now = Date.now();
  timeSinceLastUpdate += now - lastUpdate;
  while (timeSinceLastUpdate >= FIXED_DELTA && frame < currentState.frame) {
    timeSinceLastUpdate -= FIXED_DELTA;
    app.frame = frame;

    // ownInputs.setInput(frame, currentInput);
    // get inputs -> if exist authoritative use it, if not use predicted

    room.send('input', { frame, ...currentInput });

    // TODO verify if own input has been rejected
    currentState.players.forEach(player => {
      const input = player.inputBuffer.inputs[frame % InputBuffer.SIZE];
      // if (input.frame !== frame && inputWarningCount > 20) {
      if (input.frame !== frame) {
        console.log(`Input has different frame (own: ${player.id === ownId}, frame: ${frame}, input: ${input.frame})`);
        inputWarningCount = 0;
      }
      world.applyInput(player.id, input);
    });
    inputWarningCount += 1;
    world.update(frame);

    frame += 1;
  }

  app.gameObjects = [...world.staticInfo, ...world.bodyInfo];
  app.render();
  lastUpdate = now;
}

connect();