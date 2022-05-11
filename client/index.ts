import { GameRoomState } from "./typing/GameRoomState";
import { Application } from './scripts/Application';

const client = new Colyseus.Client('ws://localhost:2567');

let currentState: GameRoomState;

function connect() {
  client.joinOrCreate<GameRoomState>('game_room').then(room => {
    console.log(room.sessionId, 'joined', room.name);

    const app = new Application(640, 360);

    room.onStateChange(state => {
      currentState = state;
      app.gameObjects = Array.from(state.gameObjects.values());
    });
  }).catch(e => {
      console.log('JOIN ERROR', e);
  });
}

connect();