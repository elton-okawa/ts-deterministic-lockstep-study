import { GameRoomState } from "./generated/GameRoomState";
import { Application } from './scripts/Application';
import { PhysicsWorld } from "./scripts/PhysicsWorld";
import { Ping } from "./scripts/Ping";
import { InputManager } from "./scripts/InputManager";
import { Input } from "./scripts/Input";

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
let currentInput: Input;
let ownId: string;
let inputManager: InputManager;

let currentFrame: number;
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
      framesAhead = currentFrame - (state.frame + halfRTT * FRAME_FREQUENCY);
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
  console.log(`OwnId: ${ownId}`);
  currentFrame = 1;

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
  inputManager = new InputManager(ownId);

  playerInfos.forEach(player => {
    world.addPlayer(player.id, player.position);
    inputManager.addPlayer(player.id);
  });

  currentState.players.forEach(player => {
    player.inputBuffer.inputs.forEach(inputSchema => {
      inputSchema.onChange = (changes: any[]) => { 
        // console.log(`${player.id}: ${JSON.stringify(changes)}`);
        inputManager.confirmInput(inputSchema.frame, player.id, inputSchema);
      }
    });
  });

  lastUpdate = Date.now();
  updateTimer = setInterval(update, 1000 / FPS);
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
  // while (timeSinceLastUpdate >= FIXED_DELTA && currentFrame < currentState.frame) {

  while (timeSinceLastUpdate >= FIXED_DELTA) {
    timeSinceLastUpdate -= FIXED_DELTA;
    app.frame = currentFrame;

    if (inputManager.shouldRollback) {
      rollback(inputManager.rollbackFromFrame, currentFrame);
      inputManager.rollbackPerformed();
    }

    // TODO Static delay is not applied by input buffer on client
    currentInput.frame = currentFrame + 3;
    inputManager.setOwnInput(currentInput.frame, currentInput);
    currentInput.frame = currentFrame;
    room.send('input', currentInput);

    simulateFrame(currentFrame);

    currentFrame += 1;
  }

  app.gameObjects = [...world.staticInfo, ...world.bodyInfo];
  app.render();
  lastUpdate = now;
}

// [startFrame, endFrame[
function rollback(startFrame: number, endFrame: number) {
  console.log(`Rollback from '${startFrame}' to '${endFrame}'`)
  
  world.restore(startFrame);

  for (let frame = startFrame; frame < endFrame; frame++) {
    simulateFrame(frame);
  }
}

function simulateFrame(frame: number) {
  currentState.players.forEach(player => {
    const input = inputManager.getInput(frame, player.id);
    world.applyInput(player.id, input);
  });

  world.update(frame);
}

connect();