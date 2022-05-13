import { GameRoomState } from "./typing/GameRoomState";
import { Application } from './scripts/Application';
import { PhysicsWorld } from "./scripts/PhysicsWorld";

const client = new Colyseus.Client('ws://localhost:2567');

const FIXED_DELTA = 33.33;

let currentState: GameRoomState;
let app: Application;
let world: PhysicsWorld;
let timeSinceLastUpdate = 0;
let lastUpdate;

function connect() {
  client.joinOrCreate<GameRoomState>('game_room').then(room => {
    console.log(room.sessionId, 'joined', room.name);

    setup();

    room.onStateChange(state => {
      currentState = state;
    });
  }).catch(e => {
      console.log('JOIN ERROR', e);
  });
}

function setup() {
  app = new Application(640, 360);
  world = new PhysicsWorld();
  lastUpdate = Date.now();
  setInterval(update, 16.67);

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    console.log(`keydown: ${event.key}`);
  });

  document.addEventListener('keyup', (event: KeyboardEvent) => {
    console.log(`keyup: ${event.key}`);
  });
}

function update() {
  const now = Date.now();
  timeSinceLastUpdate += now - lastUpdate;
  while (timeSinceLastUpdate >= FIXED_DELTA) {
    timeSinceLastUpdate -= FIXED_DELTA;
    world.update();
  }

  app.gameObjects = [...world.staticInfo, ...world.bodyInfo];
  app.render();
  lastUpdate = now;
}

connect();