"use client";

import type { Participant } from "@/lib/board/types";

interface PresenceBarProps {
  participants: Participant[];
  cursorPosition?: { x: number; y: number } | null;
}

export function PresenceBar({ participants }: PresenceBarProps) {
  if (participants.length === 0) {
    return (
      <div className="presence-shell">
        <span>Connected as you · 1 participant</span>
      </div>
    );
  }

  return (
    <div className="presence-shell">
      <span>
        {participants.length} participant{participants.length !== 1 ? "s" : ""} online
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
