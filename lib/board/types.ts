export type ObjectType = "card" | "text" | "rect";

export interface BoardObject {
  id: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color?: string;
  fontSize?: number;
}

export interface Board {
  id: string;
  name: string;
  objects: BoardObject[];
  createdAt: number;
  updatedAt: number;
}

export interface Participant {
  id: string;
  name: string;
  color: string;
}

export interface BoardEvent {
  type: "objects" | "presence" | "cursor";
  payload: {
    objects?: BoardObject[];
    participants?: Participant[];
    cursor?: { userId: string; x: number; y: number } | null;
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
  color?: string,
  fontSize?: number,
): BoardObject {
  return {
    id: createId(),
    type,
    x,
    y,
    width,
    height,
    content,
    color,
    fontSize,
  };
}

export const COLORS = [
  "#6ee7b7",
  "#93c5fd",
  "#fca5a5",
  "#fcd34d",
  "#c4b5fd",
  "#67e8f9",
];

export function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}
