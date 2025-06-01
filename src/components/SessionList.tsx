import React from "react";

interface SessionListProps {
  sessions: string[];
  selectedSession: string | null;
  onSelect: (session: string) => void;
  onDelete: (session: string) => void;
  onDuplicate?: (session: string) => void; // Added
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  selectedSession,
  onSelect,
  onDelete,
  onDuplicate,
}) => (
  <ul className="session-list">
    {sessions.map((s) => (
      <li
        key={s}
        className={`session-item${selectedSession === s ? " selected" : ""}`}
        onClick={() => onSelect(s)}
      >
        <span className="session-name">{s}</span>
        <button
          className="delete-session-btn"
          title="Delete workflow"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(s);
          }}
        >
          🗑️
        </button>
        {onDuplicate && (
          <button
            className="duplicate-session-btn"
            title="Duplicate workflow"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(s);
            }}
            style={{ marginLeft: 4 }}
          >
            ⧉
          </button>
        )}
      </li>
    ))}
  </ul>
);

export default SessionList;
