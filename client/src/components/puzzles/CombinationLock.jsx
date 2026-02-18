import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function CombinationLock({ puzzle, canInteract }) {
  const { dispatchAction } = useApp();
  const { puzzleId, label, status, data } = puzzle;
  const numDigits = data.digits || 4;

  const [digits, setDigits] = useState(() => Array(numDigits).fill(0));
  const [shaking, setShaking] = useState(false);

  const solved = status === 'solved';
  const locked = status === 'locked';

  function spin(index, delta) {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = (next[index] + delta + 10) % 10;
      return next;
    });
  }

  function handleSubmit() {
    if (!canInteract || solved) return;
    const code = digits.join('');
    dispatchAction('SUBMIT_CODE', { puzzleId, code });
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }

  if (locked) {
    return (
      <div className="puzzle-panel locked">
        <div className="puzzle-lock-icon">🔒</div>
        <span className="puzzle-label">{label}</span>
        <span className="puzzle-locked-hint">Solve other puzzles to unlock this</span>
      </div>
    );
  }

  if (solved) {
    return (
      <div className="puzzle-panel solved">
        <div className="puzzle-solved-icon">✓</div>
        <span className="puzzle-label">{label}</span>
        <span className="puzzle-solved-text">Solved</span>
      </div>
    );
  }

  return (
    <div className={`puzzle-panel available ${shaking ? 'shake' : ''}`}>
      <h3 className="puzzle-label">{label}</h3>
      <p className="puzzle-prompt">{data.prompt}</p>

      {canInteract ? (
        <div className="combination-lock">
          <div className="dial-row">
            {digits.map((digit, i) => (
              <div key={i} className="dial">
                <button
                  className="dial-btn"
                  onClick={() => spin(i, 1)}
                  aria-label={`Increase digit ${i + 1}`}
                >
                  ▲
                </button>
                <div className="dial-digit">{digit}</div>
                <button
                  className="dial-btn"
                  onClick={() => spin(i, -1)}
                  aria-label={`Decrease digit ${i + 1}`}
                >
                  ▼
                </button>
              </div>
            ))}
          </div>
          <button className="btn btn-primary dial-submit" onClick={handleSubmit}>
            Unlock
          </button>
        </div>
      ) : (
        <p className="puzzle-readonly-hint">
          Your partner is working on this puzzle. Describe what you know.
        </p>
      )}
    </div>
  );
}
