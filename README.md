# Game Network Study

This repository is intended to study real time gameplay and network correction using colyseus

```
npm start
```

## Structure

- `index.ts`: main entry point, register an empty room handler and attach [`@colyseus/monitor`](https://github.com/colyseus/colyseus-monitor)
- `src/rooms/MyRoom.ts`: an empty room handler for you to implement your logic
- `src/rooms/schema/MyRoomState.ts`: an empty schema used on your room's state.
- `loadtest/example.ts`: scriptable client for the loadtest tool (see `npm run loadtest`)
- `package.json`:
    - `scripts`:
        - `npm start`: runs `ts-node-dev index.ts`
        - `npm test`: runs mocha test suite
        - `npm run loadtest`: runs the [`@colyseus/loadtest`](https://github.com/colyseus/colyseus-loadtest/) tool for testing the connection, using the `loadtest/example.ts` script.
- `tsconfig.json`: TypeScript configuration file

##

Try
- Client prediction + Server Reconciliation + Entity Interpolation
- Client in the present?

## Lockstep
- Client join
- `onJoin` server sends message with current state and physics tick
- `onJoin` server adds client input ring buffer to the synchronized state
- Client setup world and start simulating

- Client send message with input of physics tick + 3
- Server receive and store it on the state
- Server update state
- Client receive state and verify if the current tick is >= received tick
- If true it'll compare to the predicted tick and rollback if necessary
- If false it'll continue normally

## Credits

- Font: `Kenney Future` from [Kenney Fonts](https://www.kenney.nl/assets/kenney-fonts) by [Kenney](https://www.kenney.nl/) under license [Creative Commons Zero, CC0](https://creativecommons.org/publicdomain/zero/1.0/). Note: original file `.ttf` has been converted to `.png` and `.xml` for library compatibility

## License

MIT
