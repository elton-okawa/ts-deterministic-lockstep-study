//@ts-ignore
import rapier from 'https://cdn.skypack.dev/@dimforge/rapier2d-compat@0.7.6';
import { DebugEventManager } from './DebugEventManager';
rapier.init();

const RAPIER = rapier as typeof RapierType;

import { GameObject } from './GameObject';
import { Input } from './Input';
import { Vector } from './Vector';

const PHYSICS_SCALE = 100;
const FORCE_MULTIPLIER = 20;
const MAX_HORIZONTAL_SPEED = 2;
const PLAYER_SIZE = { x: 50, y: 50 };

export class PhysicsWorld {

  private _world: RAPIER.World;
  private _bodies = new Map<number, RAPIER.RigidBody>();
  private _players = new Map<string, RAPIER.RigidBody>();

  private _static: { [key: string]: GameObject } = {};
  private _bodyObjs: { [key: string]: GameObject } = {};
  private _rapierSnapshots: any[];
  private _debugEventManager: DebugEventManager;

  constructor(snapshotSize: number, debugEventManager: DebugEventManager) {
    console.log(`Using rapierjs version: ${RAPIER.version()}`);

    const gravity = { x: 0.0, y: 20 };
    this._world = new RAPIER.World(gravity);
    this._rapierSnapshots = Array.from({length: snapshotSize});
    this._debugEventManager = debugEventManager;

    this.init();
  }

  get bodyInfo(): GameObject[] {
    for (const body of this._bodies.values()) {
      // all bodies has a single collider
      const collider = this._world.getCollider(body.collider(0));
      this.mutateColliderToGameObject(collider, this._bodyObjs[collider.handle]);
    }

    return Object.values(this._bodyObjs);
  }

  init() {
    const rigidBody = this._world.createRigidBody(
      RAPIER.RigidBodyDesc.newDynamic().setTranslation(3.0, 2.0)
    );

    // Create a cuboid collider attached to the dynamic rigidBody.
    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.25, 0.25);
    const collider = this._world.createCollider(colliderDesc, rigidBody.handle);

    this._bodies.set(rigidBody.handle, rigidBody);
    this._bodyObjs[collider.handle] = new GameObject();
    this.mutateColliderToGameObject(collider, this._bodyObjs[collider.handle]);
  }

  update(frame: number) {
    this._world.step();
    this.takeSnapshot(frame);
  }

  restore(frame: number) {
    this._debugEventManager.snapshotRestored(frame);
    const oldWorldRef = this._world;
    this._world = RAPIER.World.restoreSnapshot(this._rapierSnapshots[frame % this._rapierSnapshots.length]);
    
    this.restoreRigibodyReferences(this._players);
    this.restoreRigibodyReferences(this._bodies);

    // Free world at the end to not have the risk of losing current body.id
    // used to find new object references
    oldWorldRef.free();
  }

  addPlayer(id: string, position: Vector) {
    const bodyDesc = RAPIER.RigidBodyDesc.newDynamic()
      .setTranslation(position.x / PHYSICS_SCALE, position.y / PHYSICS_SCALE);
    const body = this._world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc
      .cuboid(PLAYER_SIZE.x / (PHYSICS_SCALE * 2), PLAYER_SIZE.y / (PHYSICS_SCALE * 2));
    const collider = this._world.createCollider(colliderDesc, body.handle);

    this._players.set(id, body);
    this._bodies.set(body.handle, body);
    this._bodyObjs[collider.handle] = new GameObject();
    this.mutateColliderToGameObject(collider, this._bodyObjs[collider.handle]);
  }

  removePlayer(id: string) {
    // remove from this._players
    // remove from this._bodies
  }

  hasPlayer(id: string): boolean {
    return this._players.has(id);
  }

  applyInput(id: string, input: Input) {
    const player = this._players.get(id);
    // TODO maybe we should use setLinvel directly but adding gravity velocity
    player.setLinvel(this.limitVelocity(player.linvel()), true);
    player.applyForce(this.inputToVector(input), true);
  }

  addSquareCollider(gameObject: GameObject, { width, height, x, y }: { width: number, height: number, x: number, y: number}) {
    const collider = this._world.createCollider(
      new RAPIER.ColliderDesc(new RAPIER.Cuboid(width/2, height/2)).setTranslation(x, y),
    );

    this._static[collider.handle] = gameObject;
    this.mutateColliderToGameObject(collider, this._static[collider.handle]);
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

  private takeSnapshot(frame: number) {
    this._rapierSnapshots[frame % this._rapierSnapshots.length] = this._world.takeSnapshot();
  }

  private restoreRigibodyReferences(bodies: Map<string|number, RAPIER.RigidBody>) {
    for (let key of bodies.keys()) {
      const newBody = this._world.getRigidBody(bodies.get(key).handle);
      bodies.set(key, newBody);
    }
  }
}