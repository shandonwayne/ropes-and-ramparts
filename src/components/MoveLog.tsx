import React, { useRef, useEffect } from 'react';
import type { MoveLogEntry } from '../lib/gameConfig';

interface MoveLogProps {
  entries: MoveLogEntry[];
  playerId: number;
}

export default function MoveLog({ entries, playerId }: MoveLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const filtered = entries.filter((e) => e.playerId === playerId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered.length]);

  function describeEntry(entry: MoveLogEntry): string {
    if (entry.event === 'win') return `Reached 100 -- Victory!`;
    let msg = `Rolled ${entry.roll} → ${entry.toPosition}`;
    if (entry.event === 'chute' && entry.eventFrom !== undefined && entry.eventTo !== undefined) {
      msg += ` ↓ Chute to ${entry.eventTo}`;
    }
    if (entry.event === 'ladder' && entry.eventFrom !== undefined && entry.eventTo !== undefined) {
      msg += ` ↑ Ladder to ${entry.eventTo}`;
    }
    return msg;
  }

  function getEntryIcon(entry: MoveLogEntry): string {
    if (entry.event === 'chute') return '↓';
    if (entry.event === 'ladder') return '↑';
    if (entry.event === 'win') return '★';
    return '→';
  }

  return (
    <div className={`move-log player-${playerId}-log`}>
      <div className="move-log-entries" ref={scrollRef}>
        {filtered.length === 0 ? (
          <p className="move-log-empty">Awaiting orders...</p>
        ) : (
          filtered.map((entry, i) => (
            <div
              key={i}
              className={`move-log-entry ${entry.event}`}
            >
              <span className={`move-log-icon ${entry.event}`}>{getEntryIcon(entry)}</span>
              <span className="move-log-text">{describeEntry(entry)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
