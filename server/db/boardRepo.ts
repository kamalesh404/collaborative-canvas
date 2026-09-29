import { eq } from "drizzle-orm";
import type { Board, BoardObject } from "@/lib/board/types";
import { isDbConfigured, getDb } from "./client";
import { boards, objects } from "./schema";

/**
 * Persistence layer for boards. Every function degrades gracefully:
 * when DATABASE_URL is not configured the app still works, just without
 * cross-session persistence.
 */

export function persistenceEnabled(): boolean {
  return isDbConfigured();
}

function rowToObject(row: {
  id: string;
  type: "card" | "text" | "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: string | null;
  fontSize: number | null;
}): BoardObject {
  return {
    id: row.id,
    type: row.type,
    x: row.x,
    y: row.y,
    width: row.width,
    height: row.height,
    content: row.content,
    color: row.color ?? undefined,
    fontSize: row.fontSize ?? undefined,
  };
}

export async function loadBoard(roomId: string): Promise<Board | null> {
  if (!persistenceEnabled()) return null;

  const db = getDb();
  const [board] = await db
    .select()
    .from(boards)
    .where(eq(boards.id, roomId))
    .limit(1);

  if (!board) return null;

  const rows = await db
    .select()
    .from(objects)
    .where(eq(objects.boardId, roomId));

  return {
    id: board.id,
    name: board.name,
    objects: rows.map(rowToObject),
    createdAt: board.createdAt,
    updatedAt: board.updatedAt,
  };
}

export async function saveBoard(board: Board): Promise<void> {
  if (!persistenceEnabled()) return;

  const db = getDb();
  const now = Date.now();

  await db
    .insert(boards)
    .values({
      id: board.id,
      name: board.name,
      createdAt: board.createdAt || now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: boards.id,
      set: { name: board.name, updatedAt: now },
    });

  // Replace-all strategy: simple and correct for v1 board sizes.
  await db.delete(objects).where(eq(objects.boardId, board.id));

  if (board.objects.length > 0) {
    await db.insert(objects).values(
      board.objects.map((o) => ({
        id: o.id,
        boardId: board.id,
        type: o.type,
        x: Math.round(o.x),
        y: Math.round(o.y),
        width: Math.round(o.width),
        height: Math.round(o.height),
        content: o.content,
        color: o.color ?? null,
        fontSize: o.fontSize ?? null,
      })),
    );
  }
}

export async function ensureBoard(roomId: string, name?: string): Promise<Board> {
  const existing = await loadBoard(roomId);
  if (existing) return existing;

  const now = Date.now();
  const fresh: Board = {
    id: roomId,
    name: name ?? "Untitled board",
    objects: [],
    createdAt: now,
    updatedAt: now,
  };
  await saveBoard(fresh);
  return fresh;
}
