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

TODO Ringbuffer input and state

TODO server and clients start at the same time and perform a fixed update

## Client

The client loop can be summarized to, considering current frame as X
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
3. Some inputs were predicted because they didn't arrive in time, but **the prediction was incorrect**. The simulation is desynched, considering that we are at frame X and the incorrect prediction occurred at frame Y, we need to restore the state at frame Y and reapply all inputs to reach the current frame X (`rollback`)

Important notes
- Own input is considered predicted because we didn't confirmed that server received in time

## Server
