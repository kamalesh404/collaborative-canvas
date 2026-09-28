import type { Board, BoardObject, BoardEvent, Participant } from "./types";

export function createEmptyBoard(id: string, name = "Untitled board"): Board {
  return {
    id,
    name,
    objects: [],
  };
}

export interface BoardState {
  board: Board;
  participants: Map<string, Participant>;
}

export function createBoardState(board: Board): BoardState {
  return {
    board,
    participants: new Map(),
  };
}

export function addObject(state: BoardState, object: BoardObject): BoardEvent {
  state.board.objects.push(object);
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

export function serializeBoard(state: BoardState): Board {
  return {
    id: state.board.id,
    name: state.board.name,
    objects: state.board.objects,
  };
}
