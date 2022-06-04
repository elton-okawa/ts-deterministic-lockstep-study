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
    this._lastPlayerFrame[id] = this._startFrame;
  }

  removePlayer(id: string) {
    delete this._lastPlayerFrame[id];
  }

  confirmInput(id: string, frame: number): boolean {
    if (this._lastPlayerFrame[id] < frame) {
      this._lastPlayerFrame[id] = frame;
      this.tryToConfirmFrame();
      return true;
    } else {
      console.error(`Cannot confirm same or older input (current: ${this._lastPlayerFrame[id]}, received: ${frame})`);
      return false;
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

  private tryToConfirmFrame() {
    const minConfirmedFrame = Object.values(this._lastPlayerFrame)
      .reduce((prev, curr) => Math.min(prev, curr), Number.POSITIVE_INFINITY);

    this._lastConfirmedFrame = Math.max(this._lastConfirmedFrame, minConfirmedFrame);
  }
}