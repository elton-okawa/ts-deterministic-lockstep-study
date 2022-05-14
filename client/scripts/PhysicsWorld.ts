//@ts-ignore
import rapier from 'https://cdn.skypack.dev/@dimforge/rapier2d-compat@0.7.6';
import { RawPhysicsPipeline } from 'rapier2d-node/dist/rapier_wasm2d';
rapier.init();

const RAPIER = rapier as typeof RapierType;

import { GameObject, Vector } from './GameObject';
import { Input } from './Input';

const PHYSICS_SCALE = 100;
const SPEED = 1;

export class PhysicsWorld {

  world: RAPIER.World;
  static: RAPIER.Collider[] = [];
  bodies: RAPIER.RigidBody[] = [];
  players: { [key: string]: RAPIER.RigidBody } = {};

  constructor() {
    console.log(`Using rapierjs version: ${RAPIER.version()}`);

    const gravity = { x: 0.0, y: 9.81 };
    this.world = new RAPIER.World(gravity);

    this.init();
  }

  init() {
    // Create the ground
    const groundColliderDesc = new RAPIER.ColliderDesc(new RAPIER.Cuboid(5, 0.3))
      .setTranslation(3, 3.3);
    const ground = this.world.createCollider(groundColliderDesc);
    this.static.push(ground);

    // Create a dynamic rigid-body.
    const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic().setTranslation(0.0, 0.0);
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);

    // Create a cuboid collider attached to the dynamic rigidBody.
    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5);
    this.world.createCollider(colliderDesc, rigidBody.handle);

    this.bodies.push(rigidBody);
  }

  start() {}

  update() {
    this.world.step();
  }

  addPlayer(id: string, position: Vector, size: Vector) {
    const bodyDesc = RAPIER.RigidBodyDesc.newDynamic()
      .setTranslation(position.x / PHYSICS_SCALE, position.y / PHYSICS_SCALE);
    const body = this.world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc
      .cuboid(size.x / PHYSICS_SCALE, size.y / PHYSICS_SCALE);
    this.world.createCollider(colliderDesc, body.handle);

    this.players[id] = body;
  } 

  applyInput(id: string, input: Input) {
    this.players[id].setLinvel(this._inputToVelocity(input), true);
  }

  _inputToVelocity(input: Input): RAPIER.Vector {
    let x = 0;
    let y = 0;

    if (input.up) y += 1;
    if (input.down) y -= 1;
    if (input.left) x -= 1;
    if (input.right) x += 1;

    // invert y because positive is down in physics coordinate system
    y = -y;
    return { x: x * SPEED, y: y * SPEED };
  }

  get staticInfo(): GameObject[] {
    return this.static.map(this._mapStaticBody);
  }

  // TODO we should not create everytime
  get bodyInfo(): GameObject[] {
    return [...this.bodies, ...Object.values(this.players)].map(body => {
      const staticInfo = this._mapStaticBody(body);
      return {
        ...staticInfo,
      }
    });
  }

  _mapStaticBody(body: RAPIER.RigidBody | RAPIER.Collider): GameObject {
    const pos = body.translation();
    return {
      id: body.handle,
      position: {
        x: pos.x * PHYSICS_SCALE,
        y: pos.y * PHYSICS_SCALE,
      },
      size: {
        x: 50,
        y: 50,
      },
    }
  }
}