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

### Confirm flow
Consider two players A and B, from A perspective
Note: inputs will be referenced as <player><frameNumber>

Confirm flow
- A is in frame 3
- A confirm A0
- A confirm B0 -> authoritative state is F0
- A is in frame 5
- A confirm B1
- A confirm A1 -> authoritative state is F1

Wrong prediction flow
- Authoritative state is F0
- A is in frame 5
- A confirm A1
- A note a prediction error on B1
- A rollback state to F0
- A apply authoritative inputs F0, F1 and predicted (maybe repredict) inputs from F2 to F4 to reach current frame
- Authoritative state is F1
- A confirm A2
- A confirm B2 -> authoritative state is F2

Timeout rollback window flow - consider 5 frames
- Authoritative state is F0
- A is in frame 5
- A confirm A1
- B1 does not arrive
- A is in frame 6
- B1 is considered same input as B0 -> Authoritative state is now F1 

## Credits

- Font: `Kenney Future` from [Kenney Fonts](https://www.kenney.nl/assets/kenney-fonts) by [Kenney](https://www.kenney.nl/) under license [Creative Commons Zero, CC0](https://creativecommons.org/publicdomain/zero/1.0/). Note: original file `.ttf` has been converted to `.png` and `.xml` for library compatibility

## License

MIT
