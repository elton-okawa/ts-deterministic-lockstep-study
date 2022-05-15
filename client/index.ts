import { GameRoomState } from "./generated/GameRoomState";
import { Application } from './scripts/Application';
import { PhysicsWorld } from "./scripts/PhysicsWorld";
import { InputBuffer, RawInput } from "./scripts/InputBuffer";

const client = new Colyseus.Client('ws://localhost:2567');
const localClientId = Date.now();

let room: Colyseus.Room;

const FIXED_DELTA = 33.33;

let currentState: GameRoomState;
let app: Application;
let world: PhysicsWorld;
let timeSinceLastUpdate = 0;
let lastUpdate;
let currentInput: RawInput;
let playerId: string;
let playerInputs: InputBuffer;
let frame;

let updateTimer: NodeJS.Timer;
let isOwner = false;
let started = false;

interface CheckOwnershipMessage {
  isOwner: boolean;
}

function connect() {
  client.joinOrCreate<GameRoomState>('game_room', { localClientId }).then(gameRoom => {
    console.log(gameRoom.sessionId, 'joined', gameRoom.name);
    room = gameRoom;

    gameRoom.onMessage('checkOwnership', (message: CheckOwnershipMessage) => {
      isOwner = message.isOwner;
      console.log(`isOwner: ${isOwner}`);

      if (isOwner) {
        app.removeWaitingForHost();
        app.addStartButton(() => {
          console.log('click');
        });
      }
    });

    // TODO perform static sync using gameRoom.state
    gameRoom.onStateChange(state => {
      // TODO compare state to rollback
      currentState = state;
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

  playerId = id;
  frame = 0;
  playerInputs = new InputBuffer(); 

  app.addWaitingForHost();
}

function start() {
  world = new PhysicsWorld();
  world.addPlayer(playerId, { x: 150, y: 0 });

  lastUpdate = Date.now();
  updateTimer = setInterval(update, 16.67);
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

function update() {
  const now = Date.now();
  timeSinceLastUpdate += now - lastUpdate;
  while (timeSinceLastUpdate >= FIXED_DELTA) {
    timeSinceLastUpdate -= FIXED_DELTA;

    // TODO enable this after setup initial state sync
    // currentState.players.forEach(player => {
    //   world.applyInput(player.id, player.inputBuffer[frame % InputBuffer.SIZE]);
    // });

    playerInputs.setInput(frame, currentInput);
    room.send('input', { frame, ...currentInput });
    world.applyInput(playerId, playerInputs.getInput(frame));
    world.update();

    frame += 1;
  }

  app.gameObjects = [...world.staticInfo, ...world.bodyInfo];
  app.render();
  lastUpdate = now;
}

connect();