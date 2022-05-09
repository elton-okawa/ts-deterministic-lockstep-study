const client = new Colyseus.Client('ws://localhost:2567');

function connect() {
  client.joinOrCreate('game_room').then(room => {
    console.log(room.sessionId, 'joined', room.name);

    const app = new PIXI.Application({ width: 640, height: 360 });
    document.body.appendChild(app.view);

    room.onStateChange(state => {
      // console.log(state);
    });
  }).catch(e => {
      console.log('JOIN ERROR', e);
  });
}

connect();