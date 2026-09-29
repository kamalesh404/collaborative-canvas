// The real party server lives in /party/board.ts (PartyKit convention).
// This file re-exports shared types used by both the client and the server.
export type {
  Board,
  BoardObject,
  Participant,
} from "@/lib/board/types";
export type { ClientMessage, ServerMessage } from "@/lib/board/messages";
