import { DebugEventManager, InputOrigin } from "./DebugEventManager";
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

/**
 * Possible cases
 * 
 * 1. Input arrives before usage
 * - Input arrives, mark that we have the authoritative input for frame X
 * - Game request input X, as we have the authoritative one, return it
 * 
 * 2. Input arrives after usage
 * - Game request input X, we do not have it
 * - Mark predicted input and return it
 * - Input X arrives
 * 
 * 2.1. Input X is the same as predicted
 * - Mark that our prediction was correct
 * 
 * 2.2. Input X is not the same
 * - Mark that a rollback is needed starting from frame X
 */
export class InputManager {

  private _ownId: string;
  private _predicted: { [key: string]: PredictedInputInfo } = {};
  private _authoritative: { [key: string]: InputInfo } = {};
  private _needRollback: boolean = false;
  private _rollbackFromFrame = 0;
  private _lastCompleteFrame = -1;
  private _debugEventManager: DebugEventManager;
  private _window: number;

  constructor(ownId: string, window: number, debugEventManager: DebugEventManager) {
    this._ownId = ownId;
    this._window = window;
    this._debugEventManager = debugEventManager;
  }

  // only rollback after we have all authoritative inputs from that frame
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
      lastUsed: 0,
      buffer: new InputBuffer(this._window),
    };

    this._authoritative[playerId] = {
      last: 0,
      buffer: new InputBuffer(this._window),
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
      // if (this._predicted[playerId].confirmed > frame) {
      //   console.warn(`Going back confirmed input (current: ${this._predicted[playerId].confirmed}, received: ${frame})`)
      // }
      // this._predicted[playerId].confirmed = frame;
      // this._predicted[playerId].buffer.setInput(frame, authInput);
      this._debugEventManager.input(playerId, InputOrigin.AUTHORITATIVE, authInput);
      return authInput;
    } else if (playerId === this._ownId) {
      const ownPredicted = this._predicted[playerId].buffer.getInput(frame)
      this._debugEventManager.input(playerId, InputOrigin.PREDICTED, ownPredicted);
      return ownPredicted;
    } else {
      const lastAuth = auth.buffer.getInput(auth.last);
      const resInput = this._predicted[playerId].buffer.setInput(frame, lastAuth);
      this._debugEventManager.input(playerId, InputOrigin.PREDICTED, resInput);
      return lastAuth;
    }
  }

  confirmInput(frame: number, playerId: string, input: Input) {
    // console.log(`[${playerId}] confirmInput: ${frame}`);
    this._authoritative[playerId].last = frame;
    const resInput = this._authoritative[playerId].buffer.setInput(frame, input);
    this._debugEventManager.confirmInput(playerId, resInput);
    this.tryToSetLastCompleteFrame();

    if (this._predicted[playerId].lastUsed < frame) {
      // FIX think if we need to also set input and confirm it
      this._predicted[playerId].buffer.setInput(frame, input);
      this._predicted[playerId].confirmed = frame;
      return;
    }

    if (this._predicted[playerId].confirmed < frame) {
      const predictedInput = this._predicted[playerId].buffer.getInput(frame);
      if (!inputEquals(predictedInput, input)) {
        this.tryToSetRollbackFrame();
        this._predicted[playerId].buffer.setInput(frame, input);
        this._predicted[playerId].confirmed = frame;
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
      this._debugEventManager.authFrameConfirmed(minAuth);
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
    // FIX we should receive the input frame that caused the rollback because
    // for now, we only need to rollback from that frame and not from
    // inputs that we didn't confirm yet
    const minConfirmed = Object.values(this._predicted)
      .map((predicted) => predicted.confirmed)
      .reduce((prev, curr) => Math.min(prev, curr), Number.POSITIVE_INFINITY);

    if (!this._needRollback) {
      this._needRollback = true;
      // FIX I think that we can rollback from min + 1, but we'll leave as it is for now
      this._rollbackFromFrame = minConfirmed;
      // console.log(JSON.stringify({ auth: this._authoritative, predicted: this._predicted }));
      this._debugEventManager.rollbackNeeded(minConfirmed);
    }
  }
}