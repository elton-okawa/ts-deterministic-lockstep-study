import { inputEquals, Input } from "./Input";
import { InputBuffer } from "./InputBuffer";

interface InputInfo {
  last: number;
  buffer: InputBuffer;
}

interface PredictedInputInfo {
  confirmed: number;
  buffer: InputBuffer;
}

export class InputManager {

  private _predicted: { [key: string]: PredictedInputInfo } = {};
  private _authoritative: { [key: string]: InputInfo } = {};
  private _needRollback: boolean = false;
  private _rollbackFromFrame = 0;
  private _lastCompleteFrame = -1;

  get shouldRollback(): boolean {
    return this._needRollback && this._rollbackFromFrame <= this._lastCompleteFrame;
  }

  get rollbackFromFrame(): number {
    return this._rollbackFromFrame;
  }

  rollbackPerformed() {
    this._needRollback = false;
  }

  addPlayer(playerId: string) {
    this._predicted[playerId] = { 
      confirmed: 0,
      buffer: new InputBuffer(),
    };

    this._authoritative[playerId] = {
      last: 0,
      buffer: new InputBuffer(),
    };
  }

  removePlayer(playerId: string) {
    delete this._predicted[playerId];
    delete this._authoritative[playerId];
  }

  getInput(frame: number, playerId: string): Input {
    const auth = this._authoritative[playerId]; 
    if (auth.last <= frame) {
      this._predicted[playerId].confirmed = frame;
      return auth.buffer.getInput(frame);
    } else {
      const lastAuth = auth.buffer.getInput(auth.last);
      this._predicted[playerId].buffer.setInput(frame, lastAuth);
      return lastAuth;
    }
  }

  confirmInput(frame: number, playerId: string, input: Input) {
    this._authoritative[playerId].last = frame;
    this._authoritative[playerId].buffer.setInput(frame, input);
    this.tryToSetLastCompleteFrame();

    if (this._predicted[playerId].confirmed < frame) {
      const predictedInput = this._predicted[playerId].buffer.getInput(frame);
      if (!inputEquals(predictedInput, input)) {
        this.tryToSetRollbackFrame();
      } else {
        this._predicted[playerId].confirmed = frame;
      }
    } else {
      console.warn(`Cannot confirm previous input (current: ${this._predicted[playerId].confirmed}, received: ${frame})`);
    }
  }

  private tryToSetLastCompleteFrame() {
    const minAuth = Object.values(this._authoritative)
      .map((auth) => auth.last)
      .reduce((prev, curr) => Math.min(prev, curr), Number.POSITIVE_INFINITY)

    if (minAuth > this._lastCompleteFrame) {
      this._lastCompleteFrame = minAuth;
    }
  }

  /**
   * Consider player A and B
   * @example A5 and B5 confirmed
   * - A6 confirmed
   * - A7 confirmed
   * - B6 rejected -> rollback must start at 6, but has not triggered yet
   * - B7 rejected -> rollback must still start at 6
   */
  private tryToSetRollbackFrame() {
    const minConfirmed = Object.values(this._predicted)
      .map((predicted) => predicted.confirmed)
      .reduce((prev, curr) => Math.min(prev, curr), Number.POSITIVE_INFINITY);

    if (!this._needRollback) {
      this._needRollback = true;
      this._rollbackFromFrame = minConfirmed + 1;
    }
  }
}