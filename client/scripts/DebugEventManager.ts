export enum InputOrigin {
  PREDICTED = 'PREDICTED',
  AUTHORITATIVE = 'AUTHORITATIVE',
}

enum DebugEventType {
  INPUT = 'INPUT',
  CONFIRM_INPUT = 'CONFIRM_INPUT',
  AUTH_FRAME_CONFIRMED = 'AUTH_FRAME_CONFIRMED',
  ROLLBACK_NEEDED = 'ROLLBACK_NEEDED',
  ROLLBACK = 'ROLLBACK',
  SNAPSHOT_SAVED = 'SNAPSHOT_SAVED',
  SNAPSHOT_RESTORED = 'SNAPSHOT_RESTORED',
}

interface Event {
  type: DebugEventType;
  data: Record<string, any>;
  time: Date;
}

export class DebugEventManager {
  private ownId: string;
  private events: Event[] = [];
  private enabled: boolean;

  constructor(playerId: string, enabled: boolean) {
    this.ownId = playerId;
    this.enabled = enabled;
  }

  // TODO json output if needed

  get text(): { filename: string, lines: string[] } {
    return {
      filename: `${this.ownId}-${new Date().toISOString()}.txt`,
      lines: this.events.map((event) => `[${event.time.toISOString()}][${event.type.padStart(20)}]: ${JSON.stringify(event.data)}\n`),
    }
  }  

  private addEvent(event: Event) {
    if (this.enabled) {
      this.events.push(event);
    }
  }

  input(playerId: string, origin: InputOrigin, input: any) {
    this.addEvent({
      type: DebugEventType.INPUT,
      time: new Date(),
      data: {
        playerId: playerId,
        origin: origin,
        input: _.cloneDeep(input),
      }
    });
  }

  confirmInput(playerId: string, input: any) {
    this.addEvent({
      type: DebugEventType.CONFIRM_INPUT,
      time: new Date(),
      data: {
        playerId: playerId,
        input: _.cloneDeep(input),
      }
    })
  }

  authFrameConfirmed(confirmedFrame: number) {
    this.addEvent({
      type: DebugEventType.AUTH_FRAME_CONFIRMED,
      time: new Date(),
      data: {
        frame: confirmedFrame,
      }
    });
  }

  rollbackNeeded(startFrame: number) {
    this.addEvent({
      type: DebugEventType.ROLLBACK_NEEDED,
      time: new Date(),
      data: {
        startFrame: startFrame,
      }
    });
  }

  rollback(startFrame: number, endFrame: number) {
    this.addEvent({
      type: DebugEventType.ROLLBACK,
      time: new Date(),
      data: {
        startFrame: startFrame,
        endFrame: endFrame,
      }
    });
  }

  snapshotSaved(frame: number, bodies: any) {
    this.addEvent({
      type: DebugEventType.SNAPSHOT_SAVED,
      time: new Date(),
      data: {
        frame: frame,
        bodies: _.cloneDeep(bodies),
      }
    });
  }

  snapshotRestored(frame: number) {
    this.addEvent({
      type: DebugEventType.SNAPSHOT_RESTORED,
      time: new Date(),
      data: {
        frame: frame,
      },
    });
  }
}