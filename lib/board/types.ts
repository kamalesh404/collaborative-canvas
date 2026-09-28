export type ObjectType = "card" | "text";

export interface BoardObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
}

export interface Board {
  id: string;
  name: string;
  objects: BoardObject[];
}

export interface Participant {
  id: string;
  name: string;
}

export interface BoardEvent {
  type: "objects" | "presence";
  payload: {
    objects?: BoardObject[];
    participants?: Participant[];
  };
}

export function createId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function createObject(
  type: ObjectType,
  x: number,
  y: number,
  width = 160,
  height = 96,
  content = "",
): BoardObject {
  return {
    id: createId(),
    type,
    x,
    y,
    width,
    height,
    content,
  };
}
