"use client";

interface ToolbarProps {
  room: string;
  onAddCard: () => void;
}

export function Toolbar({ room, onAddCard }: ToolbarProps) {
  return (
    <div className="toolbar-shell">
      <span className="room-chip">room / {room}</span>
      <div className="spacer" />
      <button className="icon-btn" onClick={onAddCard}>
        <span aria-hidden="true">+</span> Add card
      </button>
      <div className="hint">Drag objects to move them</div>
    </div>
  );
}
