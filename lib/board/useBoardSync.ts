"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { BoardObject, Participant } from "@/lib/board/types";
import type { ClientMessage, ServerMessage } from "@/lib/board/messages";

/**
 * useBoardSync connects the canvas to the party server.
 *
 * - Loads the initial object list from the REST API (SSR-friendly), then
 *   upgrades to the WebSocket for live updates.
 * - Exposes send helpers for add/update/delete/cursor.
 * - Tracks connection status, participants, and remote cursors.
 *
 * When the party server is unreachable (e.g. no `partykit dev` running),
 * the board degrades to single-player: local state still works.
 */

export type ConnectionStatus = "connecting" | "live" | "offline";

export interface RemoteCursor {
  userId: string;
  x: number;
  y: number;
}

interface UseBoardSyncOptions {
  room: string;
  onInit?: (objects: BoardObject[]) => void;
  onAdd?: (object: BoardObject) => void;
  onUpdate?: (object: BoardObject) => void;
  onDelete?: (objectId: string) => void;
}

export function useBoardSync({
  room,
  onInit,
  onAdd,
  onUpdate,
  onDelete,
}: UseBoardSyncOptions) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<
    Record<string, RemoteCursor>
  >({});
  const [myId, setMyId] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const myNameRef = useRef<string>("");

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, []);

  const sendCursor = useCallback(
    (x: number, y: number) => {
      send({ type: "cursor", x, y });
    },
    [send],
  );

  const announce = useCallback(
    (participant: Participant) => {
      myNameRef.current = participant.name;
      send({ type: "hello", participant });
    },
    [send],
  );

  useEffect(() => {
    let cancelled = false;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retries = 0;

    // 1) Initial load via REST (works even before party server is up).
    fetch(`/api/boards/${encodeURIComponent(room)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { board?: { objects?: BoardObject[] } } | null) => {
        if (!cancelled && data?.board?.objects && onInit) {
          onInit(data.board.objects);
        }
      })
      .catch(() => {
        /* offline is fine; WebSocket init will cover it */
      });

    // 2) Connect to the party server. In `partykit dev` it runs on the
    //    same origin (port 1999 proxied by the partykit CLI); in
    //    production, NEXT_PUBLIC_PARTYKIT_HOST points at the deployed host.
    function connect() {
      if (cancelled) return;

      // In local dev the party server runs on :1999 (partykit dev).
      // In production set NEXT_PUBLIC_PARTYKIT_HOST to the deployed host.
      const host =
        process.env.NEXT_PUBLIC_PARTYKIT_HOST ||
        (typeof window !== "undefined" && window.location.port !== "1999"
          ? `${window.location.hostname}:1999`
          : typeof window !== "undefined"
            ? window.location.host
            : "");
      const protocol =
        typeof window !== "undefined" && window.location.protocol === "https:"
          ? "wss"
          : "ws";

      try {
        socket = new WebSocket(
          `${protocol}://${host}/party/board/${encodeURIComponent(room)}`,
        );
      } catch {
        scheduleRetry();
        return;
      }
      socketRef.current = socket;

      socket.onopen = () => {
        retries = 0;
        setStatus("live");
        // Announce presence once the socket is open. A random display name
        // for now; replace with real identity when auth lands.
        const name =
          myNameRef.current ||
          `Guest ${Math.floor(1000 + Math.random() * 9000)}`;
        const colors = ["#6ee7b7", "#93c5fd", "#fca5a5", "#fcd34d", "#c4b5fd", "#67e8f9"];
        socket?.send(
          JSON.stringify({
            type: "hello",
            participant: {
              id: Math.random().toString(36).slice(2, 10),
              name,
              color: colors[Math.floor(Math.random() * colors.length)],
            },
          }),
        );
      };

      socket.onmessage = (event) => {
        let message: ServerMessage;
        try {
          message = JSON.parse(event.data as string) as ServerMessage;
        } catch {
          return;
        }

        switch (message.type) {
          case "init":
            if (!cancelled) {
              setMyId(message.you);
              if (onInit) onInit(message.objects);
            }
            break;
          case "add":
            if (onAdd) onAdd(message.object);
            break;
          case "update":
            if (onUpdate) onUpdate(message.object);
            break;
          case "delete":
            if (onDelete) onDelete(message.objectId);
            break;
          case "presence":
            if (!cancelled) setParticipants(message.participants);
            break;
          case "cursor":
            if (!cancelled) {
              setRemoteCursors((prev) => ({
                ...prev,
                [message.userId]: { userId: message.userId, x: message.x, y: message.y },
              }));
            }
            break;
        }
      };

      socket.onclose = () => {
        socketRef.current = null;
        if (!cancelled) {
          setStatus("offline");
          scheduleRetry();
        }
      };

      socket.onerror = () => {
        try {
          socket?.close();
        } catch {
          /* already closing */
        }
      };
    }

    function scheduleRetry() {
      if (cancelled) return;
      retries += 1;
      const delay = Math.min(1000 * retries, 5000);
      retryTimer = setTimeout(connect, delay);
    }

    connect();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        try {
          socket.close();
        } catch {
          /* noop */
        }
      }
      socketRef.current = null;
    };
    // Handlers are stable via useCallback at call sites; room is fixed per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room]);

  // Expire remote cursors that stop moving (server has no per-user timer).
  useEffect(() => {
    const timer = setInterval(() => {
      setRemoteCursors((prev) => {
        if (Object.keys(prev).length === 0) return prev;
        const now = Date.now();
        const next: Record<string, RemoteCursor> = {};
        for (const [id, cursor] of Object.entries(prev)) {
          const stamped = cursor as RemoteCursor & { _t?: number };
          if (!stamped._t || now - stamped._t < 5000) {
            next[id] = cursor;
          }
        }
        return next;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return {
    status,
    participants,
    remoteCursors,
    myId,
    send,
    sendCursor,
    announce,
  };
}
