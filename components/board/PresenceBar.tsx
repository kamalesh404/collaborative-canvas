"use client";

import type { Participant } from "@/lib/board/types";
import type { ConnectionStatus } from "@/lib/board/useBoardSync";

interface PresenceBarProps {
  participants: Participant[];
  status?: ConnectionStatus;
}

export function PresenceBar({ participants, status }: PresenceBarProps) {
  const statusLabel =
    status === "live"
      ? "live"
      : status === "connecting"
        ? "connecting…"
        : status === "offline"
          ? "offline"
          : null;

  return (
    <div className="presence-shell">
      <span className="presence-status" data-status={status ?? "unknown"}>
        {statusLabel ? `${statusLabel} · ` : ""}
        {participants.length === 0
          ? "1 participant (you)"
          : `${participants.length} participant${participants.length !== 1 ? "s" : ""}`}
      </span>
      <div className="participant-avatars">
        {participants.slice(0, 5).map((p) => (
          <div
            key={p.id}
            className="participant-avatar"
            style={{ backgroundColor: p.color }}
            title={p.name}
          >
            {p.name.charAt(0).toUpperCase()}
          </div>
        ))}
      </div>
    </div>
  );
}
