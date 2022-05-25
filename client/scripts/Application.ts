import { GameObject } from "./GameObject";

const WAITING_TEXT_KEY = 'waiting-text';
const START_BUTTON_KEY = 'start-button';
const FRAME_KEY = 'frame';
const FRAME_DIFF_KEY = 'frame-diff';
const PING_KEY = 'ping';

export class Application {

  private _app: PIXI.Application;
  private _overlay: PIXI.Container;
  private _sprites: { [id: string]: PIXI.Sprite } = {};
  private _gameObjects: GameObject[] = [];
  private _texts: { [id: string]: PIXI.BitmapText } = {};
  private _loaded = false;

  constructor(width, height) {
    // TODO control pixi render
    // PIXI.Ticker.shared.autoStart = false;
    // PIXI.Ticker.shared.stop(); // ensure it's stopped
    // PIXI.Ticker.shared.update(time);
    // const app = new PIXI.Application({ width, height, autoStart: false, sharedTicker: true });
    const app = new PIXI.Application({ width, height });
    document.body.appendChild(app.view);

    app.stage.sortableChildren = true

    this._overlay = new PIXI.Container();
    this._overlay.zIndex = 1000;
    app.stage.addChild(this._overlay);
    
    app.loader.onStart.add(() => console.log('started'));
    app.loader.onComplete.add(() => console.log('completed'));
    app.loader.onError.add((error) => console.log(error));
    app.loader.add('kenney', './static/fonts/Kenney-Future.xml').load(() => {
      this.addFrame();
      this.addFrameDiff();
      this.addPing();
      this._loaded = true;
    });
    this._app = app;
  }

  set gameObjects(objects: GameObject[]){ 
    this._gameObjects = objects;
  }

  set frame(arg: number) {
    if (!this._loaded) return;
    this._texts[FRAME_KEY].text = `Frame: ${arg}`;
  }

  set frameDiff(arg: number) {
    if (!this._loaded) return;
    this._texts[FRAME_DIFF_KEY].text = `FDiff: ${arg.toFixed(2)}`;
  }

  set ping(arg: number) {
    if (!this._loaded) return;
    this._texts[PING_KEY].text = `Ping: ${arg} ms`;
  }

  private _ensureSprite(gameObject: GameObject) {
    if (!(gameObject.id in this._sprites)) {
      const sprite = PIXI.Sprite.from('./static/happy-face.png');
      sprite.anchor.set(0.5, 0.5);
      sprite.width = gameObject.size.x;
      sprite.height = gameObject.size.y;
      sprite.rotation = gameObject.rotation;
      this._sprites[gameObject.id] = sprite;
      this._app.stage.addChild(sprite);
    }
  }

  private _renderGameObject(gameObject: GameObject) {
    this._ensureSprite(gameObject);

    this._sprites[gameObject.id].position.set(gameObject.position.x, gameObject.position.y);
    this._sprites[gameObject.id].rotation = gameObject.rotation;
  }

  private addFrame() {
    const text = new PIXI.BitmapText('Frame: 0', { fontName: 'Kenney-Future', fontSize: 30, align: 'left' });

    text.x = this._app.screen.width - 250;
    text.y = 0;

    this._overlay.addChild(text);
    this._texts[FRAME_KEY] = text;
  }

  private addFrameDiff() {
    const text = new PIXI.BitmapText('FDiff: 0', { fontName: 'Kenney-Future', fontSize: 30, align: 'left' });

    text.x = this._app.screen.width - 250;
    text.y = 30;

    this._overlay.addChild(text);
    this._texts[FRAME_DIFF_KEY] = text;
  }

  private addPing() {
    const text = new PIXI.BitmapText('Ping: 0 ms', { fontName: 'Kenney-Future', fontSize: 30, align: 'left' });

    text.x = this._app.screen.width - 250;
    text.y = 60;

    this._overlay.addChild(text);
    this._texts[PING_KEY] = text;
  }

  addStartButton(cb: () => void) {
    const sprite = PIXI.Sprite.from('./static/start.png');
    sprite.anchor.set(0.5, 0.5);
    sprite.width = 256;
    sprite.height = 100;
    sprite.x = this._app.screen.width / 2;
    sprite.y = this._app.screen.height / 2 + 100;
    sprite.interactive = true;

    sprite.on('pointerdown', cb);

    this._sprites[START_BUTTON_KEY] = sprite;
    this._app.stage.addChild(sprite);
  }

  tryRemoveStartButton() {
    if (START_BUTTON_KEY in this._sprites) {
      this._app.stage.removeChild(this._sprites[START_BUTTON_KEY]);
    }
  }

  addWaitingForHost() {
    const text = new PIXI.Text('Waiting for host', new PIXI.TextStyle({ fill: ['#ffffff'] }));
    text.anchor.set(0.5, 0.5);
    text.x = this._app.screen.width / 2;
    text.y = this._app.screen.height / 2 + 100;

    this._sprites[WAITING_TEXT_KEY] = text;
    this._app.stage.addChild(text);
  }

  tryRemoveWaitingForHost() {
    if (WAITING_TEXT_KEY in this._sprites) {
      this._app.stage.removeChild(this._sprites[WAITING_TEXT_KEY]);
    }
  }

  render() {
    this._gameObjects.forEach(obj => this._renderGameObject(obj));
  }
}