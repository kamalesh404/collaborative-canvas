import type {
  PartyKitServer,
  PartyKitConnection,
  Room,
} from "partykit/server";
import type { Board, BoardObject, Participant } from "@/lib/board/types";
import type { ClientMessage, ServerMessage } from "@/lib/board/messages";
import {
  loadBoard,
  saveBoard,
  persistenceEnabled,
} from "@/server/db/boardRepo";

/**
 * Party server: authoritative real-time state for each board room.
 *
 * - On first connect, loads the board from Postgres (if configured) and
 *   sends an `init` snapshot to the joining client.
 * - add/update/delete messages mutate the in-memory board and are
 *   broadcast to every other connection.
 * - State is debounced-flushed to Postgres so boards survive restarts.
 * - Presence tracks connected participants and broadcasts on join/leave.
 */

const SAVE_DEBOUNCE_MS = 1500;

/** Per-room board cache. Keyed by room id; each room is its own DO instance. */
const boards = new Map<string, Board>();

/** Room id -> connection id -> participant state. */
const presence = new Map<string, Map<string, Participant>>();

const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();

function participantsIn(roomId: string): Participant[] {
  const roomPresence = presence.get(roomId);
  if (!roomPresence) return [];
  return [...roomPresence.values()];
}

function broadcast(
  room: Room,
  message: ServerMessage,
  exceptId?: string,
): void {
  const payload = JSON.stringify(message);
  for (const conn of room.getConnections()) {
    if (exceptId && conn.id === exceptId) continue;
    try {
      conn.send(payload);
    } catch {
      // connection may already be closing; ignore
    }
  }
}

function broadcastPresence(room: Room): void {
  broadcast(room, {
    type: "presence",
    participants: participantsIn(room.id),
  });
}

function scheduleSave(roomId: string): void {
  if (!persistenceEnabled()) return;
  const existing = saveTimers.get(roomId);
  if (existing) clearTimeout(existing);
  saveTimers.set(
    roomId,
    setTimeout(() => {
      saveTimers.delete(roomId);
      const board = boards.get(roomId);
      if (!board) return;
      saveBoard(board).catch((err: unknown) =>
        console.error(`Failed to save board ${roomId}:`, err),
      );
    }, SAVE_DEBOUNCE_MS),
  );
}

async function getBoard(room: Room): Promise<Board> {
  const cached = boards.get(room.id);
  if (cached) return cached;

  const loaded = (await loadBoard(room.id)) ?? {
    id: room.id,
    name: "Untitled board",
    objects: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  boards.set(room.id, loaded);
  return loaded;
}

function isValidObject(value: unknown): value is BoardObject {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Partial<BoardObject>;
  return (
    typeof o.id === "string" &&
    (o.type === "card" || o.type === "text" || o.type === "rect") &&
    typeof o.x === "number" &&
    typeof o.y === "number" &&
    typeof o.width === "number" &&
    typeof o.height === "number" &&
    typeof o.content === "string"
  );
}

function handleMessage(
  room: Room,
  sender: PartyKitConnection,
  raw: string | ArrayBuffer | ArrayBufferView,
): void {
  if (typeof raw !== "string") return;

  let message: ClientMessage;
  try {
    message = JSON.parse(raw) as ClientMessage;
  } catch {
    return;
  }

  const board = boards.get(room.id);
  if (!board) return;

  switch (message.type) {
    case "hello": {
      let roomPresence = presence.get(room.id);
      if (!roomPresence) {
        roomPresence = new Map();
        presence.set(room.id, roomPresence);
      }
      roomPresence.set(sender.id, message.participant);
      broadcastPresence(room);
      break;
    }

    case "add": {
      if (!isValidObject(message.object)) return;
      if (board.objects.some((o) => o.id === message.object.id)) return;
      board.objects.push(message.object);
      board.updatedAt = Date.now();
      broadcast(room, { type: "add", object: message.object }, sender.id);
      scheduleSave(room.id);
      break;
    }

    case "update": {
      if (!isValidObject(message.object)) return;
      const index = board.objects.findIndex(
        (o) => o.id === message.object.id,
      );
      if (index === -1) return;
      board.objects[index] = message.object;
      board.updatedAt = Date.now();
      broadcast(room, { type: "update", object: message.object }, sender.id);
      scheduleSave(room.id);
      break;
    }

    case "delete": {
      const before = board.objects.length;
      board.objects = board.objects.filter((o) => o.id !== message.objectId);
      if (board.objects.length === before) return;
      board.updatedAt = Date.now();
      broadcast(
        room,
        { type: "delete", objectId: message.objectId },
        sender.id,
      );
      scheduleSave(room.id);
      break;
    }

    case "cursor": {
      broadcast(
        room,
        { type: "cursor", userId: sender.id, x: message.x, y: message.y },
        sender.id,
      );
      break;
    }
  }
}

export default {
  async onConnect(
    connection: PartyKitConnection,
    room: Room,
  ): Promise<void> {
    const board = await getBoard(room);

    // Register presence slot (participant arrives via `hello`).
    if (!presence.has(room.id)) {
      presence.set(room.id, new Map());
    }

    connection.send(
      JSON.stringify({
        type: "init",
        objects: board.objects,
        you: connection.id,
        persisted: persistenceEnabled(),
      } satisfies ServerMessage),
    );

    // Anyone already here shows up immediately for the new connection.
    broadcastPresence(room);
  },

  onMessage(
    message: string | ArrayBuffer | ArrayBufferView,
    sender: PartyKitConnection,
    room: Room,
  ): void {
    handleMessage(room, sender, message);
  },

  onClose(connection: PartyKitConnection, room: Room): void {
    const roomPresence = presence.get(room.id);
    if (roomPresence) {
      roomPresence.delete(connection.id);
      broadcastPresence(room);
    }
  },

  onRequest(): Response {
    return new Response(
      JSON.stringify({ ok: true, party: "board" }),
      {
        headers: { "content-type": "application/json" },
      },
    );
  },
} satisfies PartyKitServer;
