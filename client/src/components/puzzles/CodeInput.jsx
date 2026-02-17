import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function CodeInput({ puzzle, roomCode, canInteract }) {
  const { dispatchAction } = useApp();
  const [code, setCode] = useState('');
  const [shaking, setShaking] = useState(false);

  const { puzzleId, label, status, data } = puzzle;
  const solved = status === 'solved';
  const locked = status === 'locked';

  function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim() || !canInteract || solved) return;

    dispatchAction('SUBMIT_CODE', { puzzleId, code });

    // Briefly shake if rejected (rejection comes via context lastRejection)
    // We trigger shake optimistically when submitting — a nice UX touch
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
    setCode('');
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

  // Available
  return (
    <div className={`puzzle-panel available ${shaking ? 'shake' : ''}`}>
      <h3 className="puzzle-label">{label}</h3>
      <p className="puzzle-prompt">{data.prompt}</p>

      {canInteract ? (
        <form onSubmit={handleSubmit} className="code-form">
          <input
            className="input code-input"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={data.placeholder || 'Enter answer…'}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button className="btn btn-primary" type="submit" disabled={!code.trim()}>
            Submit
          </button>
        </form>
      ) : (
        <p className="puzzle-readonly-hint">
          Your partner is working on this puzzle. Describe what you know.
        </p>
      )}
    </div>
  );
}
