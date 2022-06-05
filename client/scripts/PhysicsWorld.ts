//@ts-ignore
import rapier from 'https://cdn.skypack.dev/@dimforge/rapier2d-compat@0.7.6';
import { DebugEventManager } from './DebugEventManager';
rapier.init();

const RAPIER = rapier as typeof RapierType;

import { GameObject } from './GameObject';
import { Input } from './Input';

const PHYSICS_SCALE = 100;
const FORCE_MULTIPLIER = 20;
const MAX_HORIZONTAL_SPEED = 2;

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface Radius {
  radius: number;
}

interface Id {
  id: string;
}

export class PhysicsWorld {

  private _world: RAPIER.World;
  private _players = new Map<string, RAPIER.RigidBody>();
  private _movableColliders = new Map<number, RAPIER.Collider>();

  private _staticObjs: { [key: string]: GameObject } = {};
  private _movableObjs: { [key: string]: GameObject } = {};
  private _rapierSnapshots: any[];
  private _debugEventManager: DebugEventManager;

  constructor(snapshotSize: number, debugEventManager: DebugEventManager) {
    console.log(`Using rapierjs version: ${RAPIER.version()}`);

    const gravity = { x: 0.0, y: 20 };
    this._world = new RAPIER.World(gravity);
    this._rapierSnapshots = Array.from({length: snapshotSize});
    this._debugEventManager = debugEventManager;
  }

  update(frame: number) {
    this._world.step();
    this.takeSnapshot(frame);
    this.updateGameObjectsPosition();
  }

  updateGameObjectsPosition() {
    for (const collider of this._movableColliders.values()) {
      this.mutateColliderToGameObject(collider, this._movableObjs[collider.handle]);
    }
  }

  restore(frame: number) {
    this._debugEventManager.snapshotRestored(frame);
    const oldWorldRef = this._world;
    this._world = RAPIER.World.restoreSnapshot(this._rapierSnapshots[frame % this._rapierSnapshots.length]);
    
    this.restoreRigibodyReferences(this._players);
    this.restoreColliderReferences(this._movableColliders);
    // this.restoreRigibodyReferences(this._bodies);

    // Free world at the end to not have the risk of losing current body.id
    // used to find new object references
    oldWorldRef.free();
  }

  addPlayer(gameObject: GameObject, params: Id & Position & Size) {
    const bodyDesc = RAPIER.RigidBodyDesc.newDynamic()
      .setTranslation(params.x, params.y);
    const body = this._world.createRigidBody(bodyDesc);

    const colliderDesc = RAPIER.ColliderDesc
      .cuboid(params.width / 2, params.height / 2);
    const collider = this._world.createCollider(colliderDesc, body.handle);

    this._players.set(params.id, body);
    this._movableColliders.set(collider.handle, collider);
    this._movableObjs[collider.handle] = gameObject;

    const halfSize = collider.halfExtents();
    gameObject.size.x = halfSize.x * 2 * PHYSICS_SCALE;
    gameObject.size.y = halfSize.y * 2 * PHYSICS_SCALE;

    this.mutateColliderToGameObject(collider, this._movableObjs[collider.handle]);
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

  addSquareCollider(gameObject: GameObject, params: Position & Size) {
    const collider = this._world.createCollider(
      new RAPIER.ColliderDesc(new RAPIER.Cuboid(params.width/2, params.height/2)).setTranslation(params.x, params.y),
    );

    this._staticObjs[collider.handle] = gameObject;

    const halfSize = collider.halfExtents();
    gameObject.size.x = halfSize.x * 2 * PHYSICS_SCALE;
    gameObject.size.y = halfSize.y * 2 * PHYSICS_SCALE;

    this.mutateColliderToGameObject(collider, gameObject);
  }

  addRoundBody(gameObject: GameObject, params: Position & Radius) {
    const rigidBody = this._world.createRigidBody(
      RAPIER.RigidBodyDesc.newDynamic().setTranslation(params.x, params.y)
    );

    const colliderDesc = RAPIER.ColliderDesc.ball(params.radius);
    const collider = this._world.createCollider(colliderDesc, rigidBody.handle);

    this._movableColliders.set(collider.handle, collider);
    this._movableObjs[collider.handle] = gameObject;

    const radius = collider.radius();
    gameObject.radius = radius * PHYSICS_SCALE;

    this.mutateColliderToGameObject(collider, gameObject);
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
    // const halfSize = collider.halfExtents();

    target.id = collider.handle;
    target.position.x = pos.x * PHYSICS_SCALE;
    target.position.y = pos.y * PHYSICS_SCALE;
    target.rotation = collider.rotation();
  }

  private takeSnapshot(frame: number) {
    this._rapierSnapshots[frame % this._rapierSnapshots.length] = this._world.takeSnapshot();
  }

  private restoreRigibodyReferences(bodies: Map<string, RAPIER.RigidBody>) {
    for (const key of bodies.keys()) {
      const newBody = this._world.getRigidBody(bodies.get(key).handle);
      bodies.set(key, newBody);
    }
  }

  private restoreColliderReferences(colliders: Map<number, RAPIER.Collider>) {
    for (const key of colliders.keys()) {
      const newCollider = this._world.getCollider(colliders.get(key).handle);
      colliders.set(key, newCollider);
    }
  }
}