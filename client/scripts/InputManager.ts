import { Input } from "./Input";
import { InputBuffer, RawInput } from "./InputBuffer";

interface InputInfo {
  last: number;
  buffer: InputBuffer;
}

interface PredictedInputInfo {
  confirmed: number;
  buffer: InputBuffer;
}

// TODO 
// - We should rollback after we have all authoritative inputs from given frame
// - Should we force confirmation or we can depends on server?
export class InputManager {

  private _predicted: { [key: string]: PredictedInputInfo };
  private _authoritative: { [key: string]: InputInfo };
  private _shouldRollback: boolean;
  private _rollbackFromFrame: number;

  get shouldRollback(): boolean {
    return false;
  }

  get rollbackFromFrame(): number {
    return 0;
  }

  getInput(frame: number, playerId: string): Input {
    const auth = this._authoritative[playerId]; 
    if (auth.last <= frame) {
      this._predicted[playerId].confirmed = frame;
      return auth.buffer.getInput(frame);
    } else {
      const last = auth.buffer.getInput(auth.last);
      this._predicted[playerId].buffer.setInput(frame, last);
      return last;
    }
  }

  confirmInput(frame: number, playerId: string, input: Input) {
    this._authoritative[playerId].last = frame;
    this._authoritative[playerId].buffer.setInput(frame, input);

    if (this._predicted[playerId].confirmed < frame) {
      if (this._predicted[playerId].buffer.getInput(frame).equals(input)) {
        this._shouldRollback = true;
        this._rollbackFromFrame = frame;
      }
    }
  }
}