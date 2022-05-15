import { application } from "express";
import { GameObject } from "./GameObject";

export class Application {

  _app: PIXI.Application;
  _sprites: { [id: string]: PIXI.Sprite } = {};
  _gameObjects: GameObject[] = [];

  constructor(width, height) {
    const app = new PIXI.Application({ width, height });
    app.ticker.add(this.render.bind(this));
    document.body.appendChild(app.view);

    this._app = app;
  }

  set gameObjects(objects: GameObject[]){ 
    this._gameObjects = objects;
  }

  _ensureSprite(gameObject: GameObject) {
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

  _renderGameObject(gameObject: GameObject) {
    this._ensureSprite(gameObject);

    this._sprites[gameObject.id].position.set(gameObject.position.x, gameObject.position.y);
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

    this._sprites['start-button'] = sprite;
    this._app.stage.addChild(sprite);
  }

  removeStartButton() {
    this._app.stage.removeChild(this._sprites['start-button']);
  }

  addWaitingForHost() {
    const text = new PIXI.Text('Waiting for host');
    text.anchor.set(0.5, 0.5);
    text.x = this._app.screen.width / 2;
    text.y = this._app.screen.height / 2 + 100;

    this._sprites['waiting-text'] = text;
    this._app.stage.addChild(text);
  }

  removeWaitingForHost() {
    this._app.stage.removeChild(this._sprites['waiting-text']);
  }

  render() {
    this._gameObjects.forEach(obj => this._renderGameObject(obj));
  }
}