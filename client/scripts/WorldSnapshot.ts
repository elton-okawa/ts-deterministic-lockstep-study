import { Vector } from "./Vector";

interface BodySnapshot {
  handle: number;
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
        handle: -1,
        valid: false,
        position: { x: 0, y: 0 },
        rotation: 0,
        linearVelocity: { x: 0, y: 0},
        angularVelocity: 0,
      }),
    );
  }

  get frame(): number {
    return this._frame;
  }

  get bodies(): BodySnapshot[] {
    return this._bodies;
  }

  update(frame: number, bodies: IterableIterator<RAPIER.RigidBody>): BodySnapshot[] {
    this._frame = frame;
    this._bodies.forEach(body => body.valid = false);

    let index = 0;
    for (const physics of bodies) {
      if (index >= this._bodies.length) {
        console.error(`There are more bodies than snapshot supports (physicsBodies: ${index}, snapshot: ${this._bodies.length}), aborting in the middle`);
        return;
      }

      const body = this._bodies[index];

      body.valid = true;
      body.handle = physics.handle;
      body.position = physics.translation();
      body.rotation = physics.rotation();
      body.linearVelocity = physics.linvel();
      body.angularVelocity = physics.angvel();

      index += 1;
    }

    return this._bodies;
  }
}