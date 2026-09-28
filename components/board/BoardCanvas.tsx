"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { BoardObject } from "@/lib/board/types";
import { Toolbar } from "./Toolbar";
import { PresenceBar } from "./PresenceBar";

interface BoardCanvasProps {
  room: string;
}

function useLocalBoard() {
  const [objects, setObjects] = useState<BoardObject[]>([]);

  const addCard = useCallback(() => {
    const baseX = 40 + Math.random() * 120;
    const baseY = 40 + Math.random() * 80;

    setObjects((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: "card",
        x: baseX,
        y: baseY,
        width: 180,
        height: 120,
        content: "New card",
      },
    ]);
  }, []);

  const updateObject = useCallback(
    (object: BoardObject) => {
      setObjects((prev) =>
        prev.map((o) => (o.id === object.id ? object : o)),
      );
    },
    [],
  );

  return { objects, addCard, updateObject };
}

function DraggableObject({
  object,
  onUpdate,
}: {
  object: BoardObject;
  onUpdate: (object: BoardObject) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  function startDrag(e: React.MouseEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    dragging.current = true;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;

    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function move(e: React.MouseEvent<HTMLDivElement>) {
    if (!dragging.current) return;
    const boardRect = ref.current?.parentElement?.getBoundingClientRect();
    if (!boardRect) return;

    const x = Math.max(0, e.clientX - boardRect.left - offset.current.x);
    const y = Math.max(0, e.clientY - boardRect.top - offset.current.y);

    onUpdate({
      ...object,
      x,
      y,
    });
  }

  function endDrag() {
    dragging.current = false;
  }

  return (
    <div
      ref={ref}
      className={`canvas-object ${dragging.current ? "is-dragging" : ""}`}
      style={{
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
      }}
      onMouseDown={startDrag}
      onMouseMove={move}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
    >
      <div className="object-label">{object.type}</div>
      <div className="object-content" contentEditable suppressContentEditableWarning>
        {object.content}
      </div>
    </div>
  );
}

export function BoardCanvas({ room }: BoardCanvasProps) {
  const { objects, addCard, updateObject } = useLocalBoard();

  return (
    <>
      <Toolbar room={room} onAddCard={addCard} />
      <div className="board-canvas">
        {objects.map((object) => (
          <DraggableObject
            key={object.id}
            object={object}
            onUpdate={updateObject}
          />
        ))}
      </div>
      <PresenceBar />
    </>
  );
}
