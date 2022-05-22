export interface ForceConfirmation {
  id: string;
  lastConfirmedFrame: number;
}

export class InputFrameManager {

  private _startFrame: number;
  private _rollbackWindow: number;
  private _lastConfirmedFrame: number;
  private _lastPlayerFrame: { [key: string]: number };

  constructor(startFrame: number, rollbackWindow: number) {
    this._startFrame = startFrame;
    this._rollbackWindow = rollbackWindow;

    this._lastConfirmedFrame = startFrame;
    this._lastPlayerFrame = {};
  }

  get confirmedFrame() {
    return this._lastConfirmedFrame;
  }

  addPlayer(id: string) {
    // first client input will be raw frame 1 resulting in 1 + STATIC_DELAY
    this._lastPlayerFrame[id] = this._startFrame;
  }

  removePlayer(id: string) {
    delete this._lastPlayerFrame[id];
  }

  confirmInput(id: string, inputFrame: number) {
    const targetFrame = inputFrame + this._startFrame;
    if (this._lastPlayerFrame[id] < targetFrame) {
      this._lastPlayerFrame[id] = targetFrame;
      this.tryToConfirmFrame(targetFrame);
    } else {
      console.error(`Cannot confirm same or older input (current: ${this._lastPlayerFrame[id]}, received: ${targetFrame})`);
    }
  }

  tryToForceConfirmation(currentFrame: number): null | ForceConfirmation[] {
    let forced: ForceConfirmation[] = null;
    const minConfirmedFrame = currentFrame - this._rollbackWindow;
    if (this._lastConfirmedFrame < minConfirmedFrame) {
      this._lastConfirmedFrame = minConfirmedFrame;
      forced = [];

      for (const id of Object.keys(this._lastPlayerFrame)) {
        if (this._lastPlayerFrame[id] < minConfirmedFrame) {
          forced.push({
            id: id,
            lastConfirmedFrame: this._lastPlayerFrame[id],
          });
          this._lastPlayerFrame[id] = minConfirmedFrame;
        }
      }
    }

    return forced;
  }

  private tryToConfirmFrame(inputFrame: number) {
    const shouldConfirm = Object.values(this._lastPlayerFrame)
      .map((frame) => frame > this._lastConfirmedFrame)
      .reduce((prev, curr) => prev && curr, true);

    if (shouldConfirm) {
      this._lastConfirmedFrame = inputFrame;
    }
  }
}