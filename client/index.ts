//@ts-ignore
import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier2d-compat';
RAPIER.init().then(() => {
  // Use the RAPIER module here.
  let gravity = { x: 0.0, y: -9.81 };
  let world = new RAPIER.World(gravity);

  // Create the ground
  let groundColliderDesc = RAPIER.ColliderDesc.cuboid(10.0, 0.1);
  world.createCollider(groundColliderDesc);

  // Create a dynamic rigid-body.
  let rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic()
          .setTranslation(0.0, 1.0);
  let rigidBody = world.createRigidBody(rigidBodyDesc);

  // Create a cuboid collider attached to the dynamic rigidBody.
  let colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5);
  let collider = world.createCollider(colliderDesc, rigidBody.handle);

  // Game loop. Replace by your own game loop system.
  let gameLoop = () => {
    // Ste the simulation forward.  
    world.step();

    // Get and print the rigid-body's position.
    let position = rigidBody.translation();
    console.log("Rigid-body position: ", position.x, position.y);

    setTimeout(gameLoop, 16);
  };

  gameLoop();
});

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