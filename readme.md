# Real-Time Multiplayer Chess - Client

React frontend for the real-time multiplayer chess platform. Connects to the
[`chess-server`](https://github.com/AhmedMilad/chess_server) backend over
HTTP (via Axios) and WebSocket for real-time gameplay.

## Repositories

This project is split across two standalone repos.

| Repo | Description |
|------|-------------|
| [`chess-client`](https://github.com/AhmedMilad/chess_client) | This repo - React frontend |
| [`chess-server`](https://github.com/AhmedMilad/chess_server) | Go backend |

## Features

- **Game category browser** - displays available game categories for
  players to join.
- **WebSocket connection on join** - joining a category opens a socket
  connection to the server, which is torn down/reused as the player enters
  and leaves games.
- **Live server message handling** - listens for and reacts to real-time
  messages pushed from the server (moves, clock updates, opponent actions,
  disconnects, etc.).
- **Premoves** - players can queue their next move while waiting for the
  opponent to play, applied instantly once it's their turn.
- **Move history navigation** - players can step back to any prior move
  mid-game to review the board at that point.
- **Game analysis/evaluation** - displays move-by-move evaluation from the
  server's Stockfish analysis.
- **Legal move calculation** - computes and highlights available moves for
  the selected piece.
- **In-game actions** - offer/accept draw, resign, and surfacing opponent
  disconnect status.
- **Post-game actions** - rematch, start a new game, or view full game
  analysis.

## Tech Stack

| Layer | Technology |
| ------- | ------------ |
| Framework | React |
| HTTP client | Axios |
| Real-time | WebSocket |

## Getting Started

### Prerequisites

- Node.js 1x+
- A running instance of [`chess-server`](https://github.com/AhmedMilad/chess_server)

### Setup

```bash
git clone https://github.com/AhmedMilad/chess_client
cd chess_client
npm install
cp .env.example .env   # set REACT_APP_BACKEND_URL
npm start
```

### Environment Variables

```dotenv
# {domain:port}
REACT_APP_BACKEND_URL=
```

| Variable | Description |
|----------|--------------|
| `REACT_APP_BACKEND_URL` | Base URL (domain:port) of the `chess-server` backend, used for both Axios REST calls and the WebSocket connection |

## How It Works

1. On load, the client displayes game categories.
2. When a player joins a category, a WebSocket connection is opened to the
   server for that session.
3. The client listens for server messages over the socket - opponent moves,
   clock updates, draw offers, disconnect events - and updates the UI states in
   real time.
4. Legal moves for the selected piece are calculated client-side and
   highlighted; moves (including premoves) are validated locally before
   being sent to the server for authoritative validation.
5. During the game, players can navigate back through the move history to
   review prior positions without affecting the live game state.
6. In-game actions (offer draw, resign) and disconnect status are handled
   through the same socket connection.
7. After the game ends, post-game actions (rematch, new game, full
   analysis) are presented, with analysis data fetched from the server.

## License

> _MIT license._
