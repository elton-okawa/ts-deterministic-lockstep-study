//@ts-ignore
import rapier from 'https://cdn.skypack.dev/@dimforge/rapier2d-compat@0.7.6';
rapier.init();

const RAPIER = rapier as typeof RapierType;

import { GameObject, Vector } from './GameObject';
import { Input } from './Input';

const PHYSICS_SCALE = 100;
const FORCE_MULTIPLIER = 20;
const MAX_HORIZONTAL_SPEED = 2;
const PLAYER_SIZE = { x: 50, y: 50 };

export class PhysicsWorld {

  private _world: RAPIER.World;
  private _static: RAPIER.Collider[] = [];
  private _bodies: RAPIER.RigidBody[] = [];
  private _players: { [key: string]: RAPIER.RigidBody } = {};

  private _staticObjs: { [key: string]: GameObject } = {};
  private _bodyObjs: { [key: string]: GameObject } = {};

  constructor() {
    console.log(`Using rapierjs version: ${RAPIER.version()}`);

    const gravity = { x: 0.0, y: 20 };
    this._world = new RAPIER.World(gravity);

    this.init();
  }

  get staticInfo(): GameObject[] {
    return Object.values(this._staticObjs);
  }

  get bodyInfo(): GameObject[] {
    [...this._bodies, ...Object.values(this._players)].map(body => {
      // all bodies has a single collider
      const collider = this._world.getCollider(body.collider(0));
      this.mutateColliderToGameObject(collider, this._bodyObjs[collider.handle]);
    });

    return Object.values(this._bodyObjs);
  }

  init() {
    this.setupWalls();
    const rigidBody = this._world.createRigidBody(
      RAPIER.RigidBodyDesc.newDynamic().setTranslation(1.0, 0.0)
    );

    // Create a cuboid collider attached to the dynamic rigidBody.
    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.25, 0.25);
    const collider = this._world.createCollider(colliderDesc, rigidBody.handle);

    this._bodies.push(rigidBody);
    this._bodyObjs[collider.handle] = new GameObject();
    this.mutateColliderToGameObject(collider, this._bodyObjs[collider.handle]);
  }

  start() {}

  update() {
    this._world.step();
  }

  addPlayer(id: string, position: Vector) {
    const bodyDesc = RAPIER.RigidBodyDesc.newDynamic()
      .setTranslation(position.x / PHYSICS_SCALE, position.y / PHYSICS_SCALE);
    const body = this._world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc
      .cuboid(PLAYER_SIZE.x / (PHYSICS_SCALE * 2), PLAYER_SIZE.y / (PHYSICS_SCALE * 2));
    const collider = this._world.createCollider(colliderDesc, body.handle);

    this._players[id] = body;
    this._bodyObjs[collider.handle] = new GameObject();
    this.mutateColliderToGameObject(collider, this._bodyObjs[collider.handle]);
  } 

  hasPlayer(id: string): boolean {
    return id in this._players;
  }

  applyInput(id: string, input: Input) {
    const player = this._players[id];
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

  private setupWalls() {
    // Create the ground
    const ground = this._world.createCollider(
      new RAPIER.ColliderDesc(new RAPIER.Cuboid(2.5, 0.3)).setTranslation(2.5, 3.3)
    );
    const roof = this._world.createCollider(
      new RAPIER.ColliderDesc(new RAPIER.Cuboid(1, 0.3)).setTranslation(3, 0.3),
    );

    const leftWall = this._world.createCollider(
      new RAPIER.ColliderDesc(new RAPIER.Cuboid(0.3, 4)).setTranslation(0.3, 2),
    );
    const rightWall = this._world.createCollider(
      new RAPIER.ColliderDesc(new RAPIER.Cuboid(0.3, 4)).setTranslation(5.7, 2),
    );

    this._static.push(ground, leftWall, rightWall, roof);

    this._static.forEach(st => {
      this._staticObjs[st.handle] = new GameObject();
      this.mutateColliderToGameObject(st, this._staticObjs[st.handle]);
    });
  }

  private mutateColliderToGameObject(collider: RAPIER.Collider, target: GameObject) {
    const pos = collider.translation();
    const halfSize = collider.halfExtents();

    target.id = collider.handle;
    target.position.x = pos.x * PHYSICS_SCALE;
    target.position.y = pos.y * PHYSICS_SCALE;
    target.rotation = collider.rotation();
    target.size.x = halfSize.x * 2 * PHYSICS_SCALE;
    target.size.y = halfSize.y * 2 * PHYSICS_SCALE;
  }
}