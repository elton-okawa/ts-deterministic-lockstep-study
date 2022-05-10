// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.34
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
import { GameObjectSchema } from './GameObjectSchema'

export class GameRoomState extends Schema {
    @type({ map: GameObjectSchema }) public gameObjects: MapSchema<GameObjectSchema> = new MapSchema<GameObjectSchema>();
}
