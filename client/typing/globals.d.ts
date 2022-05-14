import * as Colyseus from './colyseus';
import * as PIXI from './pixi';
import * as RAPIER from './rapierjs';

declare global {
  const Colyseus: typeof Colyseus;
  const PIXI: typeof PIXI;
  const RapierType: typeof RAPIER;
}
