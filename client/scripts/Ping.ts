const WINDOW_SIZE = 10;
const PING_INTERVAL_MS = 200;

export class Ping {
  private window: number[];
  private counter: number;
  private time: number;
  private pinger: () => void;

  constructor(pinger: () => void) {
    this.window = Array.from({ length: WINDOW_SIZE }, () => 50);
    this.counter = 0;
    this.pinger = pinger;
  }

  get ping() {
    const total = this.window.reduce((total, current) => total += current, 0);
    return Math.round(total / WINDOW_SIZE);
  }

  set ping(arg: number) {
    this.window[this.counter] = arg;
    this.counter = (this.counter + 1) % WINDOW_SIZE;
  }

  startPingRoutine() {
    this.performPing();
  }

  performPing() {
    this.time = Date.now();
    this.pinger();
  }

  handlePong() {
    this.ping = Date.now() - this.time;
    setTimeout(this.performPing.bind(this), PING_INTERVAL_MS);
  }
}