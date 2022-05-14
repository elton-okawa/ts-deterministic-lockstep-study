import { GameRoomState } from "./typing/GameRoomState";
import { Application } from './scripts/Application';
import { PhysicsWorld } from "./scripts/PhysicsWorld";
import { InputBuffer, RawInput } from "./scripts/InputBuffer";

const client = new Colyseus.Client('ws://localhost:2567');

const FIXED_DELTA = 33.33;

let currentState: GameRoomState;
let app: Application;
let world: PhysicsWorld;
let timeSinceLastUpdate = 0;
let lastUpdate;
let currentInput: RawInput;
let playerId: string;
let playerInput: InputBuffer;
let frame;

function connect() {
  client.joinOrCreate<GameRoomState>('game_room').then(room => {
    console.log(room.sessionId, 'joined', room.name);

    setup(room.sessionId);

    room.onStateChange(state => {
      currentState = state;
    });
  }).catch(e => {
      console.log('JOIN ERROR', e);
  });
}

function setup(id: string) {
  app = new Application(640, 360);

  playerId = id;
  frame = 0;
  playerInput = new InputBuffer();
  world = new PhysicsWorld();
  world.addPlayer(playerId, { x: 300, y: 0 }, { x: 50, y: 50 });

  lastUpdate = Date.now();
  setInterval(update, 16.67);
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
      currentInput.jump= pressed;
      break;
  }
}

function update() {
  const now = Date.now();
  timeSinceLastUpdate += now - lastUpdate;
  while (timeSinceLastUpdate >= FIXED_DELTA) {
    timeSinceLastUpdate -= FIXED_DELTA;

    playerInput.setInput(frame, currentInput);
    world.applyInput(playerId, playerInput.getInput(frame));
    world.update();

    frame += 1;
  }

  app.gameObjects = [...world.staticInfo, ...world.bodyInfo];
  app.render();
  lastUpdate = now;
}

connect();