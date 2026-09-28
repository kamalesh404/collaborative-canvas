"use client";

interface ToolbarProps {
  room: string;
  onAddCard: () => void;
  onAddText: () => void;
}

export function Toolbar({ room, onAddCard, onAddText }: ToolbarProps) {
  return (
    <div className="toolbar-shell">
      <span className="room-chip">room / {room}</span>
      <div className="spacer" />
      <div className="toolbar-actions">
        <button className="icon-btn" onClick={onAddCard}>
          <span className="btn-icon">+</span> Card
        </button>
        <button className="icon-btn" onClick={onAddText}>
          <span className="btn-icon">T</span> Text
        </button>
      </div>
      <div className="hint">Drag to move · Double-click to delete</div>
    </div>
  );
}
