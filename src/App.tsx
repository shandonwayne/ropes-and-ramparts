import React from 'react';
import './ChutesLadders.css';
import ChutesLaddersGame from './ChutesLaddersGame';

function App() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--Wyrmwood)' }}>
      <ChutesLaddersGame />
    </div>
  );
}

export default App;