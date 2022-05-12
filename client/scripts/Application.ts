import { GameObjectSchema } from "../typing/GameObjectSchema";

export class Application {

  _app: PIXI.Application;
  _sprites: { [id: string]: PIXI.Sprite } = {};
  _gameObjects: GameObjectSchema[];

  constructor(width, height) {
    const app = new PIXI.Application({ width, height });
    app.ticker.add(this.render.bind(this));
    document.body.appendChild(app.view);

    this._app = app;
  }

  set gameObjects(objects: GameObjectSchema[]){ 
    this._gameObjects = objects;
  }

  _ensureSprite(gameObject: GameObjectSchema) {
    if (!(gameObject.id in this._sprites)) {
      const sprite = PIXI.Sprite.from('./static/happy-face.png');
      sprite.width = 50;
      sprite.height = 50;
      this._sprites[gameObject.id] = sprite;
      this._app.stage.addChild(sprite);
    }
  }

  _renderGameObject(gameObject: GameObjectSchema) {
    this._ensureSprite(gameObject);

    this._sprites[gameObject.id].position.set(gameObject.position.x, gameObject.position.y);
  }

  render(delta) {
    this._gameObjects.forEach(obj => this._renderGameObject(obj));
  }
}