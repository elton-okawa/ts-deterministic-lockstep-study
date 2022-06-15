# Deterministic Lockstep Implementation

## Overview

This repository implements the `Deterministic Lockstep with static delay and rollback`.
- Clients send and receive inputs to deterministically simulate the state.
- Each input is scheduled to be executed 3 frames later.
- Clients do not wait for all inputs to simulate the frame, they simulate using authoritative or predicted ones and rollback if needed.
- Server defines a rollback window of 10 frames, which means that any input that takes more than that to arrive will be ignored.

## General

The state follows the formula:

    S(t+1) = S(t) * I(t)

    Where:
    - S(x) = state of the frame X
    - I(x) = input of the frame X

You can read the formula as **applying input of frame t in the state t we acquire state t+1**

`Synchronized start` and `fixed update` allow all clients to roughly simulate the same frame at the same time.

### Synchronized start

Starting the game, server sends a message telling clients to start after X miliseconds. After received, clients uses the ping to estimated how much time elapsed since the message was sent and schedules to start after this time.

We do not rely on specific date time because a device with a misconfigured time would not start or start too late/early.

### Fixed update

Clients and server performs a fixed update that consist of measuring time elapsed since last update and performs X numbers of simulation steps that fit in that time.

This behavior allows a client to catch up current frame after a cpu stutter.

## Client

Clients store **inputs** and **states** in a ring buffer of size 2x the rollback window to avoid excessive memory allocation and have enough space from current client frame and last input from rollback window.

The loop can be summarized to, considering current frame as X
- Get current input
- Set own input as predicted to be executed at X+3 (`static delay`)
- Send input from frame X
- Get inputs of all clients from frame X
  - Authoritative ones if available
  - Use the last authoritative input as prediction 
- Simulate
- Store state as X+1
- Increment frame to X+1

There are the following scenarios:
1. All authoritative inputs of frame X arrived before client simulates it. Nothing to be done here, the simulation is synchronized.
2. Some inputs were predicted because they didn't arrive in time, but **the prediction was correct**. also nothing to be done here, the simulation is synchronized.
3. Some inputs were predicted because they didn't arrive in time, but **the prediction was incorrect**. The simulation is desynched, considering that we are at frame X and the incorrect prediction occurred at frame Y, we need to restore the state at frame Y and reapply all inputs from Y to X to reach the current frame X (`rollback`)

Important notes
- Own input is considered predicted because we didn't confirmed that server received in time

## Server

Server stores clients input in a ring buffer in order to avoid excessive memory allocation.

Server advance one frame only if it has inputs from all clients from that frame. This could harm the entire gameplay because a single disconnected/lagged client would block the server.

That's why the server also estimates clients frame in order to force confirmation of inputs that goes outside of the rollback window and ignore actual ones when they arrive.

For now, the server does not simulate the game state but it'd be a interesting feature to add in an attempt to keep clients synched, they'd receive a hashed state to compare if there is a simulation difference.