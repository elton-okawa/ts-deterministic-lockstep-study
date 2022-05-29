import * as Colyseus from './colyseus';
import * as PIXI from './pixi';
import * as RAPIER from './rapierjs';
import lodash from 'lodash';

declare global {
  const Colyseus: typeof Colyseus;
  const PIXI: typeof PIXI;
  const RapierType: typeof RAPIER;
  const _: typeof lodash;
}
