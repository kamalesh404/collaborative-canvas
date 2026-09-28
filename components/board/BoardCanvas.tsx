"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { BoardObject, ObjectType } from "@/lib/board/types";
import { Toolbar } from "./Toolbar";
import { PresenceBar } from "./PresenceBar";

interface BoardCanvasProps {
  room: string;
}

function useLocalBoard() {
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addObject = useCallback((type: ObjectType) => {
    const baseX = 40 + Math.random() * 120;
    const baseY = 40 + Math.random() * 80;

    setObjects((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type,
        x: baseX,
        y: baseY,
        width: type === "text" ? 160 : 180,
        height: type === "text" ? 40 : 120,
        content: type === "text" ? "Type here..." : "New card",
        color: type === "text" ? "#e6e9ef" : undefined,
        fontSize: type === "text" ? 14 : undefined,
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

  const deleteObject = useCallback((objectId: string) => {
    setObjects((prev) => prev.filter((o) => o.id !== objectId));
    setSelectedId(null);
  }, []);

  const selectObject = useCallback((objectId: string | null) => {
    setSelectedId(objectId);
  }, []);

  return { objects, selectedId, addObject, updateObject, deleteObject, selectObject };
}

function DraggableObject({
  object,
  selected,
  onUpdate,
  onDelete,
  onSelect,
}: {
  object: BoardObject;
  selected: boolean;
  onUpdate: (object: BoardObject) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string | null) => void;
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

    onSelect(object.id);
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

  function handleDoubleClick() {
    onDelete(object.id);
  }

  return (
    <div
      ref={ref}
      className={`canvas-object ${selected ? "is-selected" : ""} ${dragging.current ? "is-dragging" : ""}`}
      style={{
        left: object.x,
        top: object.y,
        width: object.width,
        height: object.height,
        backgroundColor: object.color || undefined,
        fontSize: object.fontSize || undefined,
      }}
      onMouseDown={startDrag}
      onMouseMove={move}
      onMouseUp={endDrag}
      onMouseLeave={endDrag}
      onDoubleClick={handleDoubleClick}
    >
      <div className="object-label">{object.type}</div>
      <div className="object-content" contentEditable suppressContentEditableWarning>
        {object.content}
      </div>
    </div>
  );
}

export function BoardCanvas({ room }: BoardCanvasProps) {
  const { objects, selectedId, addObject, updateObject, deleteObject, selectObject } = useLocalBoard();

  return (
    <>
      <Toolbar room={room} onAddCard={() => addObject("card")} onAddText={() => addObject("text")} />
      <div className="board-canvas">
        {objects.map((object) => (
          <DraggableObject
            key={object.id}
            object={object}
            selected={selectedId === object.id}
            onUpdate={updateObject}
            onDelete={deleteObject}
            onSelect={selectObject}
          />
        ))}
      </div>
      <PresenceBar />
    </>
  );
}
