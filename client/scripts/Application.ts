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

  render() {
    this._gameObjects.forEach(obj => this._renderGameObject(obj));
  }
}