import React, { useState, useEffect } from 'react';

interface Indicator {
  id: number;
  text: string;
  type: 'chute' | 'ladder';
  x: number;
  y: number;
}

let nextId = 0;

export function useFloatingIndicators() {
  const [indicators, setIndicators] = useState<Indicator[]>([]);

  function addIndicator(text: string, type: 'chute' | 'ladder', x: number, y: number) {
    const id = nextId++;
    setIndicators((prev) => [...prev, { id, text, type, x, y }]);
    setTimeout(() => {
      setIndicators((prev) => prev.filter((ind) => ind.id !== id));
    }, 1800);
  }

  return { indicators, addIndicator };
}

interface FloatingIndicatorsProps {
  indicators: Indicator[];
}

export default function FloatingIndicators({ indicators }: FloatingIndicatorsProps) {
  return (
    <>
      {indicators.map((ind) => (
        <div
          key={ind.id}
          className={`floating-indicator ${ind.type}`}
          style={{ left: ind.x, top: ind.y }}
        >
          {ind.text}
        </div>
      ))}
    </>
  );
}
