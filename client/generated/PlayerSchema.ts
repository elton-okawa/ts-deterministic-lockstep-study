// 
// THIS FILE HAS BEEN GENERATED AUTOMATICALLY
// DO NOT CHANGE IT MANUALLY UNLESS YOU KNOW WHAT YOU'RE DOING
// 
// GENERATED USING @colyseus/schema 1.0.34
// 

import { Schema, type, ArraySchema, MapSchema, SetSchema, DataChange } from '@colyseus/schema';
import { InputBufferSchema } from './InputBufferSchema'

export class PlayerSchema extends Schema {
    @type("string") public id!: string;
    @type(InputBufferSchema) public inputBuffer: InputBufferSchema = new InputBufferSchema();
}
