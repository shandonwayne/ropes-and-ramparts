import React from 'react';
import Confetti from './Confetti';

interface VictoryModalProps {
  winner: string;
  isIsolde: boolean;
  onPlayAgain: () => void;
}

export default function VictoryModal({ winner, isIsolde, onPlayAgain }: VictoryModalProps) {
  return (
    <div className="game-main">
      <div className={`game-over ${isIsolde ? 'isolde-victory' : 'rowan-victory'}`}>
        <Confetti
          active={true}
          colors={isIsolde
            ? ['#E08FB5', '#621B39', '#FFBC2E', '#DBDAD0', '#F57B35']
            : ['#F57B35', '#FFBC2E', '#E6A855', '#DBDAD0', '#E64C35']
          }
        />
        {isIsolde ? (
          <div className="victory-modal isolde-modal">
            <div className="victory-content">
              <div className="victory-text">
                <img src="/Glory-Isolde.svg" alt="Victorious Lady Isolde" className="glory-title" />
                <p className="victory-subtitle">THE GOBLIN REIGNS.</p>
                <button className="play-again-button" onClick={onPlayAgain}>PLAY AGAIN</button>
              </div>
            </div>
            <div className="victory-character">
              <img src="/Isolde-Cropped.svg" alt="Victorious Lady Isolde" className="victory-character-image" />
            </div>
          </div>
        ) : (
          <div className="victory-modal rowan-modal">
            <div className="victory-content">
              <div className="victory-text">
                <img src="/Glory-Rowan.svg" alt="Glory is Rowans" className="glory-title" />
                <p className="victory-subtitle">THE KNIGHT PREVAILS.</p>
                <button className="play-again-button" onClick={onPlayAgain}>PLAY AGAIN</button>
              </div>
              <div className="victory-character">
                <img src="/Rowan-Cropped.svg" alt="Victorious Sir Rowan" className="victory-character-image" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
