import { GameRoomState } from "./generated/GameRoomState";
import { Application } from './scripts/Application';
import { PhysicsWorld } from "./scripts/PhysicsWorld";
import { Ping } from "./scripts/Ping";
import { InputManager } from "./scripts/InputManager";
import { Input } from "./scripts/Input";
import { DebugEventManager } from "./scripts/DebugEventManager";
import { GameObject } from "./scripts/GameObject";

const client = new Colyseus.Client('ws://localhost:2567');
const localClientId = Date.now();

let room: Colyseus.Room<GameRoomState>;

const FIXED_DELTA = 33.33;
const FRAME_FREQUENCY = 1 / FIXED_DELTA;
const FPS = 60;
const ROLLBACK_WINDOW = 20;
const MAX_DELTA_SHIFT = FIXED_DELTA / 3;

let currentState: GameRoomState;
let app: Application;
let world: PhysicsWorld;
let timeSinceLastUpdate = 0;
let lastUpdate: number;
let currentInput: Input;
let ownId: string;
let inputManager: InputManager;
let debugEventManager: DebugEventManager;
const gameObjects: GameObject[] = [];

let currentFrame: number;
let estimatedServerFrame: number;

let updateTimeout: NodeJS.Timer;
let isOwner = false;
let started = false;
let ping: Ping;

interface CheckOwnershipMessage {
  isOwner: boolean;
}

interface StartMessage {
  startInMs: number,
  players: PlayerInfo[],
}

interface PlayerInfo {
  id: string;
  position: { x: number, y: number };
}

function handleDownloadClick(filename: string, lines: string[]) {
  const file = new File(lines, filename, { type: 'text/plain' });
  const url = URL.createObjectURL(file);

  const element = document.createElement('a');
  element.setAttribute('href', url);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  URL.revokeObjectURL(url);
  document.body.removeChild(element);
}

function setupDownloadButton() {
  const button = document.createElement('button');
  button.innerText = 'Download debug log';
  button.addEventListener('click', () => {
    const { filename, lines } = debugEventManager.text;
    console.log(`Exporting: ${lines.length} lines`);
    handleDownloadClick(filename, lines);
  });

  document.body.appendChild(button);
}

function connect() {
  client.joinOrCreate<GameRoomState>('game_room', { localClientId }).then(gameRoom => {
    console.log(gameRoom.sessionId, 'joined', gameRoom.name);
    room = gameRoom;
    currentState = room.state;

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

    gameRoom.onMessage('startGame', (message: StartMessage) => {
      start(message.startInMs, message.players);
      started = true;
    });

    gameRoom.onStateChange.once(firstState => {
      console.log('First state received');
      currentState = firstState;

      setup(room.sessionId, firstState.env);
    });

    gameRoom.onError((code: number, message: string) => {
      console.log(`Error code '${code}': '${message}'`);
      clearInterval(updateTimeout);
    });

    gameRoom.onLeave((code: number) => {
      console.log(`Leave code '${code}'`);
      clearInterval(updateTimeout);
    });

    room.send('checkOwnership', { localClientId });
  }).catch(e => {
      console.log('JOIN ERROR', e);
  });
}

function setup(id: string, env: string) {
  console.log(`Setup: ownId '${id}', env '${env}'`);

  const isDev = env === 'development';
  app = new Application(640, 360);
  app.gameObjects = gameObjects;

  ownId = id;
  currentFrame = 0;
  debugEventManager = new DebugEventManager(id, isDev);

  if (isDev) {
    setupDownloadButton();
  }

  room.onStateChange(state => {
    currentState = state;
    const halfRTT = ping.ping / 2;
    estimatedServerFrame = state.frame + halfRTT * FRAME_FREQUENCY
    app.frameDiff = currentFrame - estimatedServerFrame;
  });

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

function start(shouldStartInMs: number, playerInfos: PlayerInfo[]) {
  app.tryRemoveStartButton();
  app.tryRemoveWaitingForHost();

  world = new PhysicsWorld(ROLLBACK_WINDOW, debugEventManager);
  createSceneObjects();
  inputManager = new InputManager(ownId, ROLLBACK_WINDOW, debugEventManager);

  playerInfos.forEach(player => {
    const playerObj = new GameObject();

    world.addPlayer(playerObj, { 
      id: player.id,
      x: player.position.x,
      y: player.position.y,
      width: 0.5,
      height: 0.5,
    });
    inputManager.addPlayer(player.id);

    gameObjects.push(playerObj);
  });

  currentState.players.forEach(player => {
    player.inputBuffer.inputs.forEach(inputSchema => {
      inputSchema.onChange = (changes: any[]) => { 
        // console.log(`${player.id}: ${JSON.stringify(changes)}`);
        inputManager.confirmInput(inputSchema.frame, player.id, inputSchema);
      }
    });
  });

  // remove estimated time to arrive the start message
  const startInMs = shouldStartInMs - ping.ping / 2;
  lastUpdate = Date.now() + startInMs;
  updateTimeout = setTimeout(update, startInMs);
  currentInput = {
    frame: currentFrame,
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

function createSceneObjects() {
  const ground = new GameObject();
  ground.sprite = './static/gray-block.png';
  world.addSquareCollider(ground, { width: 6.4, height: 0.3, x: 3.2, y: 3.45});

  const roof = new GameObject();
  roof.sprite = './static/gray-block.png';
  world.addSquareCollider(roof, { width: 6.4, height: 0.3, x: 3.2, y: 0.15});

  const leftWall = new GameObject();
  leftWall.sprite = './static/gray-block.png';
  world.addSquareCollider(leftWall, { width: 0.3, height: 5.8, x: 0.15, y: 3.2});

  const rightWall = new GameObject();
  rightWall.sprite = './static/gray-block.png';
  world.addSquareCollider(rightWall, { width: 0.3, height: 5.8, x: 6.25, y: 3.2});

  const leftJumper = new GameObject();
  leftJumper.sprite = './static/gray-block.png';
  world.addJumper(leftJumper, { width: 1, height: 0.1, x: 1, y: 3.25});

  const rightJumper = new GameObject();
  rightJumper.sprite = './static/gray-block.png';
  world.addJumper(rightJumper, { width: 1, height: 0.1, x: 5.5, y: 3.25});

  const floatingPlatform = new GameObject();
  floatingPlatform.sprite = './static/gray-block.png';
  world.addRotationSquareBody(floatingPlatform, { width: 0.3, height: 2, x: 3.2, y: 1.5 });

  const ballOne = new GameObject();
  ballOne.sprite = './static/gray-circle.png';
  world.addRoundBody(ballOne, { radius: 0.25, x: 3, y: 2 });

  const ballTwo = new GameObject();
  ballTwo.sprite = './static/gray-circle.png';
  world.addRoundBody(ballTwo, { radius: 0.25, x: 5, y: 2 });

  gameObjects.push(
    ground, roof, leftWall, rightWall, leftJumper, rightJumper,
    floatingPlatform, ballOne, ballTwo,
  );
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(value, min));
}

let debug_countRollback = 0;

function update() {
  const now = Date.now();
  timeSinceLastUpdate += now - lastUpdate;

  // const timeDiff = (currentFrame - estimatedServerFrame) * FIXED_DELTA;
  // const delta = FIXED_DELTA + clamp(timeDiff, -MAX_DELTA_SHIFT, MAX_DELTA_SHIFT);
  const delta = FIXED_DELTA;
  // while (timeSinceLastUpdate >= delta && currentFrame < currentState.frame) {
  while (timeSinceLastUpdate >= delta) {
    timeSinceLastUpdate -= delta;

    simulateGameplayFrame(currentFrame);

    currentFrame += 1;
  }

  app.render();
  lastUpdate = now;

  updateTimeout = setTimeout(update, 1000 / FPS);
}

// [startFrame, endFrame[
function rollback(startFrame: number, endFrame: number) {
  console.log(`Rollback from '${startFrame}' to '${endFrame}'`)
  debugEventManager.rollback(startFrame, endFrame);
  world.restore(startFrame);

  for (let frame = startFrame; frame < endFrame; frame++) {
    simulatePhysicsFrame(frame);
  }
}

function simulateGameplayFrame(frame: number) {
  app.frame = frame;

  if (inputManager.shouldRollback) {
    rollback(inputManager.rollbackFromFrame, frame);
    inputManager.rollbackPerformed();
  }

  // if (frame > 20 && debug_countRollback > 10) {
  //   rollback(frame - 10, frame);
  //   inputManager.rollbackPerformed();
  //   debug_countRollback = 0; 
  // }
  // debug_countRollback += 1;

  // TODO Static delay is not applied by input buffer on client
  currentInput.frame = frame + 3;
  inputManager.setOwnInput(currentInput.frame, currentInput);
  currentInput.frame = frame;
  room.send('input', currentInput);

  simulatePhysicsFrame(frame);
}

function simulatePhysicsFrame(frame: number) {
  currentState.players.forEach(player => {
    const input = inputManager.getInput(frame, player.id);
    world.applyInput(player.id, input);
  });

  // state(t+1) = state(t) + input(t)
  world.update(frame + 1);
}

connect();