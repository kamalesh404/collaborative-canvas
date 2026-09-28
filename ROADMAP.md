# Collaborative Canvas - Roadmap

## Current State
- [x] Project scaffold with Next.js + TypeScript
- [x] Typed board model for cards and text
- [x] Interactive board page with draggable cards
- [x] PartyKit room stubs for real-time sync
- [x] Drizzle schema and DB client stubs for persistence
- [x] CI workflow (lint, typecheck, build)
- [x] README with demo section and local setup
- [x] MIT LICENSE

## Next Milestones

### v1.0 - Real-time Collaboration
- [ ] Wire PartyKit rooms for real-time sync
- [ ] Add presence indicator (show who's in the room)
- [ ] Broadcast object changes across participants
- [ ] Add reconnect handling

### v1.1 - Persistence
- [ ] Connect Postgres database
- [ ] Load board from database on room entry
- [ ] Save object changes to database
- [ ] Add database migrations

### v1.2 - Polish & Deploy
- [ ] Add text block objects
- [ ] Add card editing (content updates)
- [ ] Deploy live demo
- [ ] Add screenshots/GIF to README
- [ ] Add demo link to README

## Future Ideas
- [ ] Undo/redo support
- [ ] Export board as PNG/JSON
- [ ] Multiple object types (shapes, images)
- [ ] Board templates
