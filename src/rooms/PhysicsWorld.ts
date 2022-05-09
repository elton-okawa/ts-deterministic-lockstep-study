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
    this.engine = Engine.create();

    this.staticBodies = [];
    this.bodies = [];

    this.init();
  }

  init() {
    const boxA = Bodies.rectangle(400, 200, 80, 80);
    const boxB = Bodies.rectangle(450, 50, 80, 80);
    const ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });

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