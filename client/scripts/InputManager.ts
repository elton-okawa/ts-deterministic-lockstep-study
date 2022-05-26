import { inputEquals, Input } from "./Input";
import { InputBuffer } from "./InputBuffer";

interface InputInfo {
  last: number;
  buffer: InputBuffer;
}

interface PredictedInputInfo {
  confirmed: number;
  lastUsed: number;
  buffer: InputBuffer;
}

export class InputManager {

  private _ownId: string;
  private _predicted: { [key: string]: PredictedInputInfo } = {};
  private _authoritative: { [key: string]: InputInfo } = {};
  private _needRollback: boolean = false;
  private _rollbackFromFrame = 0;
  private _lastCompleteFrame = -1; // FIX should we really need this?

  constructor(ownId: string) {
    this._ownId = ownId;
  }

  get shouldRollback(): boolean {
    return this._needRollback;
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
      lastUsed: 0,
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

  setOwnInput(frame: number, input: Input) {
    // console.log(`[${this._ownId}] setOwnInput: ${frame}`);
    this._predicted[this._ownId].buffer.setInput(frame, input);
  }

  getInput(frame: number, playerId: string): Input {
    // console.log(`[${playerId}] getInput: ${frame}`);
    const auth = this._authoritative[playerId];
    this._predicted[playerId].lastUsed = frame;
    if (auth.last >= frame) {
      const authInput = auth.buffer.getInput(frame);
      this._predicted[playerId].confirmed = frame;
      this._predicted[playerId].buffer.setInput(frame, authInput);
      return authInput;
    } else if (playerId === this._ownId) {
      return this._predicted[playerId].buffer.getInput(frame);
    } else {
      const lastAuth = auth.buffer.getInput(auth.last);
      this._predicted[playerId].buffer.setInput(frame, lastAuth);
      return lastAuth;
    }
  }

  confirmInput(frame: number, playerId: string, input: Input) {
    // console.log(`[${playerId}] confirmInput: ${frame}`);
    this._authoritative[playerId].last = frame;
    this._authoritative[playerId].buffer.setInput(frame, input);
    this.tryToSetLastCompleteFrame();

    if (this._predicted[playerId].lastUsed < frame) {
      return;
    }

    if (this._predicted[playerId].confirmed < frame) {
      const predictedInput = this._predicted[playerId].buffer.getInput(frame);
      if (!inputEquals(predictedInput, input)) {
        this.tryToSetRollbackFrame();
      } else {
        this._predicted[playerId].confirmed = frame;
      }
    } else {
      console.warn(`[${playerId}] Cannot confirm previous input (current: ${this._predicted[playerId].confirmed}, received: ${frame})`);
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
      // FIX I think that we can rollback from min + 1, but we'll leave as it is for now
      this._rollbackFromFrame = minConfirmed;
    }
  }
}