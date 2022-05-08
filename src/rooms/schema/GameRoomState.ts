import { Schema, Context, type } from "@colyseus/schema";

export class GameRoomState extends Schema {

  @type("string") mySynchronizedProperty: string = "Hello world";

}
