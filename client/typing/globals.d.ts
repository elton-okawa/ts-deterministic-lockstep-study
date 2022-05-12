import * as Colyseus from './colyseus';
import * as PIXI from './pixi';

declare global {
  const Colyseus: typeof Colyseus;
  const PIXI: typeof PIXI;
}
