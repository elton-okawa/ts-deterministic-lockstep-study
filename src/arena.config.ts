import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";
import express from 'express';

/**
 * Import your Room files
 */
import { GameRoom } from "./rooms/GameRoom";

export default Arena({
    getId: () => "Game Network Study",

    initializeGameServer: (gameServer) => {
        /**
         * Define your room handlers:
         */
        gameServer.define('game_room', GameRoom);

        if (process.env.NODE_ENV !== "production") {
            gameServer.simulateLatency(100);
        }
    },

    initializeExpress: (app) => {
        /**
         * Bind your custom express routes here:
         */
        app.get("/", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!");
        });

        /**
         * Bind @colyseus/monitor
         * It is recommended to protect this route with a password.
         * Read more: https://docs.colyseus.io/tools/monitor/
         */
        app.use("/colyseus", monitor());
        app.use("/client", express.static('lib/client'))
    },


    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
});