export class InputFrameManager {

  private _startFrame: number;
  private _rollbackWindow: number;
  private _lastConfirmedFrame: number;
  private _lastPlayerFrame: number[];
  private _idToIndex: { [key: string]: number };

  constructor(startFrame: number, rollbackWindow: number) {
    this._startFrame = startFrame;
    this._rollbackWindow = rollbackWindow;

    this._lastConfirmedFrame = startFrame;
    this._lastPlayerFrame = [];
    this._idToIndex = {};
  }

  get confirmedFrame() {
    return this._lastConfirmedFrame;
  }

  addPlayer(id: string) {
    // first client input will be raw frame 1 resulting in 1 + STATIC_DELAY
    this._lastPlayerFrame.push(this._startFrame);
    this._idToIndex[id] = this._lastPlayerFrame.length - 1;
  }

  removePlayer(id: string) {
    const playerIndex = this._idToIndex[id];
    this._lastPlayerFrame.splice(playerIndex, 1);
    delete this._idToIndex[id];
  }

  confirmInput(id: string, inputFrame: number) {
    const targetFrame = inputFrame + this._startFrame;
    const playerIndex = this._idToIndex[id];
    if (this._lastPlayerFrame[playerIndex] < targetFrame) {
      this._lastPlayerFrame[playerIndex] = targetFrame;
      this.tryToConfirmFrame(targetFrame);
    } else {
      console.error(`Cannot confirm same or older input (current: ${this._lastPlayerFrame[playerIndex]}, received: ${targetFrame})`);
    }
  }

  tryToForceConfirmation(currentFrame: number): boolean {
    let forced = false;
    const minConfirmedFrame = currentFrame - this._rollbackWindow;
    if (this._lastConfirmedFrame < minConfirmedFrame) {
      this._lastConfirmedFrame = minConfirmedFrame;

      for (let i = 0; i < this._lastPlayerFrame.length; i++) {
        if (this._lastPlayerFrame[i] < minConfirmedFrame) {
          this._lastPlayerFrame[i] = minConfirmedFrame;
          forced = true;
        }
      }
    }

    return forced;
  }

  private tryToConfirmFrame(inputFrame: number) {
    const shouldConfirm = this._lastPlayerFrame
      .map((frame) => frame > this._lastConfirmedFrame)
      .reduce((prev, curr) => prev && curr, true);

    if (shouldConfirm) {
      this._lastConfirmedFrame = inputFrame;
    }
  }
}