import { Vector } from "./Vector";

interface BodySnapshot {
  id: number;
  valid: boolean;
  position: Vector;
  rotation: number;
  linearVelocity: Vector;
  angularVelocity: number;
}

export class WorldSnapshot {
  private _frame: number;
  private _bodies: BodySnapshot[];

  constructor(bodiesSize: number) {
    this._frame = 0;
    this._bodies = Array.from(
      { length: bodiesSize },
      () => ({
        id: -1,
        valid: false,
        position: { x: 0, y: 0 },
        rotation: 0,
        linearVelocity: { x: 0, y: 0},
        angularVelocity: 0,
      }),
    );
  }

  update(frame: number, bodies: RAPIER.RigidBody[]) {
    this._frame = frame;
    this._bodies.forEach(body => body.valid = false);

    if (this._bodies.length >= bodies.length) {
      for (let i = 0; i < bodies.length; i++) {
        const body = this._bodies[i];
        const physics = bodies[i];
        const translation = physics.translation();
        const linearVelocity = physics.linvel();

        body.valid = true;
        body.id = physics.handle;
        body.position.x = translation.x;
        body.position.y = translation.y;
        body.rotation = physics.rotation();
        body.linearVelocity.x = linearVelocity.x;
        body.linearVelocity.y = linearVelocity.y;
        body.angularVelocity = physics.angvel();
      }
    } else {
      console.error(`There are more bodies than snapshot supports (physicsBodies: ${bodies.length}, snapshot: ${this._bodies.length})`);
    }
  }
}