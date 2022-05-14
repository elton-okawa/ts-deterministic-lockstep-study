// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.34
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';


export class InputSchema extends Schema {
    @type("number") public frame!: number;
    @type("boolean") public up!: boolean;
    @type("boolean") public down!: boolean;
    @type("boolean") public left!: boolean;
    @type("boolean") public right!: boolean;
    @type("boolean") public jump!: boolean;
}
