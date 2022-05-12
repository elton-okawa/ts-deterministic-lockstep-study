import RAPIER from 'rapier2d-node';

export interface StaticBodyInfo {
  id: number;
  position: Vector;
}

export interface BodyInfo extends StaticBodyInfo {
}

export interface Vector {
  x: number;
  y: number;
}

const PHYSICS_TO_PIXEL_SCALE = 100;

export class PhysicsWorld {

  world: RAPIER.World;
  static: RAPIER.Collider[] = [];
  bodies: RAPIER.RigidBody[] = [];

  constructor() {
    console.log(`Using rapierjs version: ${RAPIER.version()}`);

    const gravity = { x: 0.0, y: -9.81 };
    this.world = new RAPIER.World(gravity);

    this.init();
  }

  init() {
    // Create the ground
    const groundColliderDesc = new RAPIER.ColliderDesc(new RAPIER.Cuboid(5, 0.3))
      .setTranslation(3, 0);
    const ground = this.world.createCollider(groundColliderDesc);
    this.static.push(ground);

    // Create a dynamic rigid-body.
    const rigidBodyDesc = RAPIER.RigidBodyDesc.newDynamic().setTranslation(0.0, 1.0);
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);

    // Create a cuboid collider attached to the dynamic rigidBody.
    const colliderDesc = RAPIER.ColliderDesc.cuboid(0.5, 0.5);
    this.world.createCollider(colliderDesc, rigidBody.handle);

    this.bodies.push(rigidBody);
  }

  start() {}

  update() {
    this.world.step();

    // Get and print the rigid-body's position.
    let position = this.bodies[0].translation();
    console.log("Rigid-body position: ", position.x, position.y);
  }

  get staticInfo(): StaticBodyInfo[] {
    return this.static.map(this._mapStaticBody);
  }

  get bodyInfo(): BodyInfo[] {
    return this.bodies.map(body => {
      const staticInfo = this._mapStaticBody(body);
      return {
        ...staticInfo,
      }
    });
  }

  _mapStaticBody(body: (RAPIER.RigidBody|RAPIER.Collider)): StaticBodyInfo {
    const pos = body.translation();
    return {
      id: body.handle,
      position: {
        x: pos.x * PHYSICS_TO_PIXEL_SCALE,
        y: pos.y * PHYSICS_TO_PIXEL_SCALE,
      },
    }
  }
}