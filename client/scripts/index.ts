const client = new Colyseus.Client('ws://localhost:2567');

function connect() {
  client.joinOrCreate('game_room').then(room => {
    console.log(room.sessionId, 'joined', room.name);
  }).catch(e => {
      console.log('JOIN ERROR', e);
  });
}

connect();