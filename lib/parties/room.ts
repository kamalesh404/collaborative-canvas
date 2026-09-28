import type { Board, BoardObject, Participant } from "@/lib/board/types";

export default function room() {
  // TODO: load initial board from persistence, then sync via PartyKit
  return {
    onConnect(_conn: { id?: string }, _ctx: { room?: string }) {
      // presence and object sync will be wired here
    },
    onClose(_conn: { id?: string }, _ctx: { room?: string }) {
      // presence cleanup
    },
  } as const;
}
