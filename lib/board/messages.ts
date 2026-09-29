import type { BoardObject, Participant } from "./types";

/**
 * Messages exchanged between browser clients and the party server.
 * The server keeps the authoritative object list and broadcasts deltas.
 */

export type ClientMessage =
  | { type: "hello"; participant: Participant }
  | { type: "add"; object: BoardObject }
  | { type: "update"; object: BoardObject }
  | { type: "delete"; objectId: string }
  | { type: "cursor"; x: number; y: number };

export type ServerMessage =
  | { type: "init"; objects: BoardObject[]; you: string; persisted: boolean }
  | { type: "add"; object: BoardObject }
  | { type: "update"; object: BoardObject }
  | { type: "delete"; objectId: string }
  | { type: "presence"; participants: Participant[] }
  | { type: "cursor"; userId: string; x: number; y: number };

export function isClientMessage(value: unknown): value is ClientMessage {
  if (typeof value !== "object" || value === null) return false;
  const msg = value as { type?: unknown };
  return (
    typeof msg.type === "string" &&
    ["hello", "add", "update", "delete", "cursor"].includes(msg.type)
  );
}
