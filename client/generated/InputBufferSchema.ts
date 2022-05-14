// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.34
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
import { InputSchema } from './InputSchema'

export class InputBufferSchema extends Schema {
    @type([ InputSchema ]) public inputs: ArraySchema<InputSchema> = new ArraySchema<InputSchema>();
}
