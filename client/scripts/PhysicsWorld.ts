//@ts-ignore
import rapier from 'https://cdn.skypack.dev/@dimforge/rapier2d-compat@0.7.6';
import { RawPhysicsPipeline } from 'rapier2d-node/dist/rapier_wasm2d';
rapier.init();

const RAPIER = rapier as typeof RapierType;

import { GameObject, Vector } from './GameObject';
import { Input } from './Input';

const PHYSICS_SCALE = 100;
const FORCE_MULTIPLIER = 20;
const MAX_HORIZONTAL_SPEED = 2;

export class PhysicsWorld {

  world: RAPIER.World;
  static: RAPIER.Collider[] = [];
  bodies: RAPIER.RigidBody[] = [];
  players: { [key: string]: RAPIER.RigidBody } = {};

  constructor() {
    console.log(`Using rapierjs version: ${RAPIER.version()}`);

    const gravity = { x: 0.0, y: 20 };
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
    const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic().setTranslation(1.0, 0.0);
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);

    // Create a cuboid collider attached to the dynamic rigidBody.
    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.25, 0.25);
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
      .cuboid(size.x / (PHYSICS_SCALE * 2), size.y / (PHYSICS_SCALE * 2));
    this.world.createCollider(colliderDesc, body.handle);

    this.players[id] = body;
  } 

  applyInput(id: string, input: Input) {
    const player = this.players[id];
    // TODO maybe we should use setLinvel directly but adding gravity velocity
    player.setLinvel(this.limitVelocity(player.linvel()), true);
    player.applyForce(this.inputToVector(input), true);
  }

  private limitVelocity(vel: RAPIER.Vector) {
    const signX = vel.x > 0 ? 1 : -1;
    // const signY = vel.y > 0 ? 1 : -1;

    return {
      x: Math.min(Math.abs(vel.x), MAX_HORIZONTAL_SPEED) * signX,
      y: vel.y,
    };
  }

  private inputToVector(input: Input): RAPIER.Vector {
    let x = 0;
    let y = 0;

    // if (input.up) y += 1;
    // if (input.down) y -= 1;
    if (input.jump) y += 1; // TODO check grounded before jump
    if (input.left) x -= 1;
    if (input.right) x += 1;

    // invert y because positive is down in physics coordinate system
    y = -y;
    return { x: x * FORCE_MULTIPLIER, y: y * FORCE_MULTIPLIER };
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