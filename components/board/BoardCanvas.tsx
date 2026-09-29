"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { BoardObject, ObjectType } from "@/lib/board/types";
import { useBoardSync, type ConnectionStatus } from "@/lib/board/useBoardSync";
import { Toolbar } from "./Toolbar";
import { PresenceBar } from "./PresenceBar";

interface BoardCanvasProps {
  room: string;
}

function DraggableObject({
  object,
  selected,
  onUpdate,
  onDelete,
  onSelect,
  onCursor,
}: {
  object: BoardObject;
  selected: boolean;
  onUpdate: (object: BoardObject) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string | null) => void;
  onCursor: (x: number, y: number) => void;
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
    const boardRect = ref.current?.parentElement?.getBoundingClientRect();
    if (boardRect) {
      onCursor(
        Math.round(e.clientX - boardRect.left),
        Math.round(e.clientY - boardRect.top),
      );
    }

    if (!dragging.current) return;
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

  function handleContentBlur(e: React.FocusEvent<HTMLDivElement>) {
    const text = e.currentTarget.textContent ?? "";
    if (text !== object.content) {
      onUpdate({ ...object, content: text });
    }
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
      <div
        className="object-content"
        contentEditable
        suppressContentEditableWarning
        onBlur={handleContentBlur}
      >
        {object.content}
      </div>
    </div>
  );
}

export function BoardCanvas({ room }: BoardCanvasProps) {
  const [objects, setObjects] = useState<BoardObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const cursorThrottle = useRef(0);

  // Stable handlers for the sync hook.
  const handleInit = useCallback((incoming: BoardObject[]) => {
    setObjects((prev) => {
      // Merge: keep local objects the server does not know about yet.
      const byId = new Map(incoming.map((o) => [o.id, o]));
      const merged = [...byId.values()];
      for (const local of prev) {
        if (!byId.has(local.id)) merged.push(local);
      }
      return merged;
    });
  }, []);

  const handleRemoteAdd = useCallback((object: BoardObject) => {
    setObjects((prev) =>
      prev.some((o) => o.id === object.id) ? prev : [...prev, object],
    );
  }, []);

  const handleRemoteUpdate = useCallback((object: BoardObject) => {
    setObjects((prev) =>
      prev.map((o) => (o.id === object.id ? object : o)),
    );
  }, []);

  const handleRemoteDelete = useCallback((objectId: string) => {
    setObjects((prev) => prev.filter((o) => o.id !== objectId));
    setSelectedId((current) => (current === objectId ? null : current));
  }, []);

  const {
    status,
    participants,
    remoteCursors,
    send,
  } = useBoardSync({
    room,
    onInit: handleInit,
    onAdd: handleRemoteAdd,
    onUpdate: handleRemoteUpdate,
    onDelete: handleRemoteDelete,
  });

  const addObject = useCallback(
    (type: ObjectType) => {
      const baseX = 40 + Math.random() * 120;
      const baseY = 40 + Math.random() * 80;

      const object: BoardObject = {
        id: crypto.randomUUID(),
        type,
        x: baseX,
        y: baseY,
        width: type === "text" ? 160 : 180,
        height: type === "text" ? 40 : 120,
        content: type === "text" ? "Type here..." : "New card",
        color: type === "text" ? "#e6e9ef" : undefined,
        fontSize: type === "text" ? 14 : undefined,
      };

      setObjects((prev) => [...prev, object]);
      send({ type: "add", object });
    },
    [send],
  );

  const updateObject = useCallback(
    (object: BoardObject) => {
      setObjects((prev) =>
        prev.map((o) => (o.id === object.id ? object : o)),
      );
      send({ type: "update", object });
    },
    [send],
  );

  const deleteObject = useCallback(
    (objectId: string) => {
      setObjects((prev) => prev.filter((o) => o.id !== objectId));
      setSelectedId(null);
      send({ type: "delete", objectId });
    },
    [send],
  );

  const selectObject = useCallback((objectId: string | null) => {
    setSelectedId(objectId);
  }, []);

  const handleCanvasCursor = useCallback(
    (x: number, y: number) => {
      const now = Date.now();
      if (now - cursorThrottle.current < 50) return;
      cursorThrottle.current = now;
      send({ type: "cursor", x, y });
    },
    [send],
  );

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
            onCursor={handleCanvasCursor}
          />
        ))}
        {Object.values(remoteCursors).map((cursor) => (
          <div
            key={cursor.userId}
            className="remote-cursor"
            style={{ left: cursor.x, top: cursor.y }}
          >
            <span className="cursor-arrow">➤</span>
          </div>
        ))}
      </div>
      <PresenceBar participants={participants} status={status} />
      {status !== "live" && <ConnectionHint status={status} />}
    </>
  );
}

function ConnectionHint({ status }: { status: ConnectionStatus }) {
  const text =
    status === "connecting"
      ? "Connecting to live session…"
      : "Offline mode — start the party server for real-time sync";
  return <div className="connection-hint">{text}</div>;
}
