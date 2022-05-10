import Colyseus from "../typing/colyseus";
import { GameRoomState } from "../typing/GameRoomState";
import PIXI from "../typing/pixi";

const client = new Colyseus.Client('ws://localhost:2567');

let currentState: any = {};

function connect() {
  client.joinOrCreate<GameRoomState>('game_room').then(room => {
    console.log(room.sessionId, 'joined', room.name);

    const app = new PIXI.Application({ width: 640, height: 360 });
    document.body.appendChild(app.view);
    const sprite = PIXI.Sprite.from('./static/happy-face.png');
    app.stage.addChild(sprite);
    app.ticker.add((delta) => {
      const body: any = Object.values(currentState?.bodies ?? {})?.[0] ?? {};
      sprite.x = body?.position?.x ?? 100;
      sprite.y = body?.position?.y ?? 100;
    });

    room.onStateChange(state => {
      currentState = state;
      // console.log(state);
    });
  }).catch(e => {
      console.log('JOIN ERROR', e);
  });
}

connect();