import React, { useRef, useEffect } from 'react';
import { GAME_CONFIG, type MoveLogEntry } from '../lib/gameConfig';

interface MoveLogProps {
  entries: MoveLogEntry[];
}

export default function MoveLog({ entries }: MoveLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="move-log">
        <div className="move-log-header">Battle Log</div>
        <div className="move-log-entries" ref={scrollRef}>
          <p className="move-log-empty">Roll the dice to begin...</p>
        </div>
      </div>
    );
  }

  function describeEntry(entry: MoveLogEntry): string {
    const name = entry.playerName;
    if (entry.event === 'win') {
      return `${name} reached square 100 and wins!`;
    }
    let msg = `${name} rolled ${entry.roll}, moved to ${entry.toPosition}`;
    if (entry.event === 'chute' && entry.eventFrom !== undefined && entry.eventTo !== undefined) {
      msg += `. Hit a chute! Slid from ${entry.eventFrom} down to ${entry.eventTo}`;
    }
    if (entry.event === 'ladder' && entry.eventFrom !== undefined && entry.eventTo !== undefined) {
      msg += `. Climbed a ladder from ${entry.eventFrom} up to ${entry.eventTo}!`;
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
    <div className="move-log">
      <div className="move-log-header">Battle Log</div>
      <div className="move-log-entries" ref={scrollRef}>
        {entries.map((entry, i) => (
          <div
            key={i}
            className={`move-log-entry ${entry.event} player-${entry.playerId}-entry`}
          >
            <span className="move-log-turn">T{entry.turn}</span>
            <span className={`move-log-icon ${entry.event}`}>{getEntryIcon(entry)}</span>
            <span className="move-log-text">{describeEntry(entry)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
