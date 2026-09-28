import type { Board, BoardObject, BoardEvent, Participant } from "./types";

export function createBoard(id: string, name = "Untitled board"): Board {
  const now = Date.now();
  return {
    id,
    name,
    objects: [],
    createdAt: now,
    updatedAt: now,
  };
}

export interface BoardState {
  board: Board;
  participants: Map<string, Participant>;
  cursors: Map<string, { x: number; y: number }>;
}

export function createBoardState(board: Board): BoardState {
  return {
    board,
    participants: new Map(),
    cursors: new Map(),
  };
}

export function addObject(state: BoardState, object: BoardObject): BoardEvent {
  state.board.objects.push(object);
  state.board.updatedAt = Date.now();
  return {
    type: "objects",
    payload: { objects: state.board.objects },
  };
}

export function updateObject(
  state: BoardState,
  object: BoardObject,
): BoardEvent {
  const index = state.board.objects.findIndex((o) => o.id === object.id);
  if (index === -1) {
    return { type: "objects", payload: { objects: state.board.objects } };
  }

  state.board.objects[index] = object;
  state.board.updatedAt = Date.now();
  return {
    type: "objects",
    payload: { objects: state.board.objects },
  };
}

export function deleteObject(
  state: BoardState,
  objectId: string,
): BoardEvent {
  state.board.objects = state.board.objects.filter((o) => o.id !== objectId);
  state.board.updatedAt = Date.now();
  return {
    type: "objects",
    payload: { objects: state.board.objects },
  };
}

export function setParticipants(
  state: BoardState,
  participants: Participant[],
): BoardEvent {
  state.participants.clear();
  for (const participant of participants) {
    state.participants.set(participant.id, participant);
  }

  return {
    type: "presence",
    payload: { participants },
  };
}

export function updateCursor(
  state: BoardState,
  userId: string,
  x: number,
  y: number,
): BoardEvent {
  state.cursors.set(userId, { x, y });

  return {
    type: "cursor",
    payload: {
      cursor: { userId, x, y },
    },
  };
}

export function clearCursor(
  state: BoardState,
  userId: string,
): BoardEvent {
  state.cursors.delete(userId);

  return {
    type: "cursor",
    payload: {
      cursor: null,
    },
  };
}

export function serializeBoard(state: BoardState): Board {
  return {
    id: state.board.id,
    name: state.board.name,
    objects: state.board.objects,
    createdAt: state.board.createdAt,
    updatedAt: state.board.updatedAt,
  };
}

export function getParticipantCount(state: BoardState): number {
  return state.participants.size;
}
