# Deterministic Lockstep Study

This repository is intended to study real time physics-based gameplay using deterministic lockstep with delay and rollback.

The following examples were performed:
- In the **same computer** (theorically it should also work in different ones because I'm using a deterministic cross-platform physics engine) 
- Applying inputs on the left window
- Simulated latency of 50 and 200ms respectively

https://user-images.githubusercontent.com/24387035/174302075-d9a2dc09-fe9b-4134-a023-b325121d1288.mp4

https://user-images.githubusercontent.com/24387035/174302098-304ae48d-febd-4565-85bd-cf66044e49d4.mp4

In the `200ms` game on the right, it's really noticiable things teleporting after rollback caused by missprediction. This could be addressed by [#37](https://github.com/elton-okawa/ts-game-lockstep/issues/37).

One last thing to emphasize is that even if you stop the video at the same frame, especially in the 200ms, you might see a slightly different simulation which is not an issue because eventually it'll rollback and correct the position. An determinism/implementation problem is noticiable at the level you can tell that both simulations are completely different without needing to pause it because a small error becomes big in no time.

## Overview
The physics is being simulated by a [deterministic cross-platform](https://rapier.rs/docs/user_guides/javascript/determinism) physics engine called [Rapier](https://rapier.rs/).

The client/server communication is performed by [Colyseus](https://www.colyseus.io/), a library built over WebSockets that creates a TCP connection, which basically means that we have **guaranteed in-order delivery**

The netcode uses deterministic lockstep with static delay and rollback, the basic idea is that we only send/receive inputs to recreate the **exactly** same simulation in all clients, that's why we need a deterministic cross-platform physics engine.

For more details about the netcode, take a look at the [Deterministic Lockstep implementation](./docs/deterministic-lockstep.md) doc.

## Developing

Install dependencies from `client` and `server`:
```
./install.sh
```

Start in watch mode, it'll reload server/client after every change:
```
yarn watch
```
Note that after changing client code it'll take a while to transpile and you'll need to reload the html page.

Open `localhost:2567/client` with a single or more browser windows to play

Controls:
- WASD - move character
- Space - jump/fly

## Credits

- Font: `Kenney Future` from [Kenney Fonts](https://www.kenney.nl/assets/kenney-fonts) by [Kenney](https://www.kenney.nl/) under license [Creative Commons Zero, CC0](https://creativecommons.org/publicdomain/zero/1.0/). Note: original file `.ttf` has been converted to `.png` and `.xml` for library compatibility

## License

MIT
