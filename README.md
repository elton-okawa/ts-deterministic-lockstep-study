# Deterministic Lockstep Study

This repository is intended to study real time physics-based gameplay using deterministic lockstep with delay and rollback.

TODO - place an working example gif

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

## Credits

- Font: `Kenney Future` from [Kenney Fonts](https://www.kenney.nl/assets/kenney-fonts) by [Kenney](https://www.kenney.nl/) under license [Creative Commons Zero, CC0](https://creativecommons.org/publicdomain/zero/1.0/). Note: original file `.ttf` has been converted to `.png` and `.xml` for library compatibility

## License

MIT
