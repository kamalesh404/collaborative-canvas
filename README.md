# Collaborative Canvas

A real-time collaborative canvas for cards and text.

Open a room link, add objects, and move them together with other people in the same room.

- **Live demo:** [coming soon]
- **Stack:** Next.js, PartyKit, Postgres, Drizzle ORM

![Collaborative canvas](https://img.shields.io/badge/stack-Next.js%20%2B%20PartyKit%20%2B%20Postgres-6ee7b7)

## What it does

- Create a new board or join one with a room code
- Add cards and text blocks to the canvas
- Drag objects around the board
- See other participants in the same room
- Persist boards so state survives refresh

This is a portfolio project built to show full-stack, real-time, and data persistence skills in one place.

## How it works

The app is organized around three layers:

1. **Board model**
   - The board is a small typed schema of objects with position, size, type, and content.
   - The same model is used by the UI, the real-time layer, and the database layer, so the whole app stays consistent.

2. **Real-time sync**
   - Collaboration runs through PartyKit rooms.
   - Each board lives in its own room, which makes presence and object updates easy to manage per session.

3. **Persistence**
   - Boards and objects are stored in Postgres with Drizzle ORM.
   - The app loads the board when a room is opened and saves changes as the canvas evolves.

## Project structure

```
app/                 Next.js app router pages
components/board/    canvas, toolbar, presence, and object components
lib/board/           typed board model and local state helpers
lib/parties/         PartyKit room logic
server/db/           database schema and client
drizzle/             migrations
```

## Local development

1. Copy `.env.example` to `.env` and fill in the values for your PartyKit host and Postgres database.
2. Install dependencies:
   ```
   npm install
   ```
3. Generate and apply the database schema:
   ```
   npm run db:generate
   npm run db:migrate
   ```
4. Start the dev server:
   ```
   npm run dev
   ```
5. Open the app and create or join a board.

## Commands

- `npm run dev` — start the dev server
- `npm run build` — build for production
- `npm run start` — run the production server
- `npm run lint` — run linting
- `npm run db:generate` — generate Drizzle migrations
- `npm run db:migrate` — apply migrations
- `npm run db:studio` — open Drizzle Studio

## Demo

The easiest way to understand the project is to open two browser windows to the same room and move a card in one of them.

Once the demo is live, the README will point to the deployed app and a short walkthrough.

_Project scaffold complete — ready for real-time and persistence wiring._

## License

MIT
