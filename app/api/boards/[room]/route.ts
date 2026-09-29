import { NextResponse } from "next/server";
import { loadBoard, persistenceEnabled } from "@/server/db/boardRepo";
import type { Board } from "@/lib/board/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/boards/[room]
 *
 * Returns the persisted board when the database is configured; otherwise
 * returns an empty board so the client can boot in memory-only mode.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ room: string }> },
) {
  const { room } = await params;

  if (!persistenceEnabled()) {
    const now = Date.now();
    const empty: Board = {
      id: room,
      name: "Untitled board",
      objects: [],
      createdAt: now,
      updatedAt: now,
    };
    return NextResponse.json({ board: empty, persisted: false });
  }

  try {
    const board = await loadBoard(room);
    return NextResponse.json({ board, persisted: true });
  } catch (error) {
    console.error(`Failed to load board ${room}:`, error);
    return NextResponse.json(
      { error: "Failed to load board" },
      { status: 500 },
    );
  }
}
