"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [roomName, setRoomName] = useState("");

  function createRoom() {
    const id = Math.random().toString(36).slice(2, 10);
    router.push(`/board/${id}`);
  }

  function joinRoom() {
    if (!roomName.trim()) return;
    router.push(`/board/${roomName.trim()}`);
  }

  return (
    <main className="home">
      <div className="home-card">
        <h1>Collaborative Canvas</h1>
        <p className="muted">
          Create a board or join one with a link. Move cards and text together
          in real time.
        </p>

        <button className="primary" onClick={createRoom}>
          Create new board
        </button>

        <div className="join">
          <input
            placeholder="Enter room code"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && joinRoom()}
          />
          <button onClick={joinRoom}>Join board</button>
        </div>
      </div>
    </main>
  );
}
