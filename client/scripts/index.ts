import { GameRoomState } from "../typing/GameRoomState";

const client = new Colyseus.Client('ws://localhost:2567');

let currentState: GameRoomState;

function connect() {
  client.joinOrCreate<GameRoomState>('game_room').then(room => {
    console.log(room.sessionId, 'joined', room.name);

    const app = new PIXI.Application({ width: 640, height: 360 });
    document.body.appendChild(app.view);
    const spriteOne = PIXI.Sprite.from('./static/happy-face.png');
    spriteOne.width = 50;
    spriteOne.height = 50;

    const spriteTwo = PIXI.Sprite.from('./static/happy-face.png');
    spriteTwo.width = 50;
    spriteTwo.height = 50;

    app.stage.addChild(spriteOne);
    app.stage.addChild(spriteTwo);
    app.ticker.add((delta) => {
      if (currentState) {
        const bodies = Array.from(currentState.gameObjects.values());

        const bodyOne: any = bodies[1];
        spriteOne.x = bodyOne.position.x;
        spriteOne.y = bodyOne.position.y;

        const bodyTwo: any = bodies[2];
        spriteTwo.x = bodyTwo.position.x;
        spriteTwo.y = bodyTwo.position.y;
      }
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