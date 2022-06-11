// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.34
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
import { PlayerSchema } from './PlayerSchema'

export class GameRoomState extends Schema {
    @type({ map: PlayerSchema }) public players: MapSchema<PlayerSchema> = new MapSchema<PlayerSchema>();
    @type("number") public frame!: number;
    @type("string") public env!: string;
}
