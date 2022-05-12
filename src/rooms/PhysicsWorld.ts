import RAPIER from 'rapier2d-node';

import { Engine, Bodies, Body, Composite, Runner } from 'matter-js';

export interface BodyInfo {
  id: number;
  position: Vector;
}

export interface Vector {
  x: number;
  y: number;
}

export class PhysicsWorld {

  engine: Engine;
  runner: Runner;
  staticBodies: Body[];
  bodies: Body[];

  constructor() {
    console.log(RAPIER.version());

    this.engine = Engine.create();

    this.staticBodies = [];
    this.bodies = [];

    this.init();
  }

  init() {
    const boxA = Bodies.rectangle(0, 0, 50, 50);
    const boxB = Bodies.rectangle(590, 0, 50, 50);
    const ground = Bodies.rectangle(320, 300, 700, 60, { isStatic: true });

    this.staticBodies.push(ground);
    this.bodies.push(boxA, boxB);
    // add all of the bodies to the world
    Composite.add(this.engine.world, [boxA, boxB, ground]);
  }

  start() {}

  update(delta: number) {
    Engine.update(this.engine, delta);
  }

  get staticBodiesInfo(): BodyInfo[] {
    return this.staticBodies.map(this._mapBody);
  }

  get bodyInfo(): BodyInfo[] {
    return this.bodies.map(this._mapBody);
  }

  _mapBody(body: Body): BodyInfo {
    return {
      id: body.id,
      position: { x: body.position.x, y: body.position.y },
    }
  }
}