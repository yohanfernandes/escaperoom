import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

export default function SymbolSequence({ puzzle, canInteract }) {
  const { dispatchAction } = useApp();
  const { puzzleId, label, status, data } = puzzle;
  const { symbols = [], maxClicks = 4 } = data;

  const [sequence, setSequence] = useState([]);
  const [shaking, setShaking] = useState(false);

  const solved = status === 'solved';
  const locked = status === 'locked';

  function handleSymbolClick(symbolId) {
    if (!canInteract || solved || sequence.length >= maxClicks) return;
    // Prevent duplicate adjacent clicks — allow re-use (symbols can repeat in theory)
    setSequence((prev) => [...prev, symbolId]);
  }

  function handleReset() {
    setSequence([]);
  }

  function handleSubmit() {
    if (!canInteract || solved || sequence.length < maxClicks) return;
    const code = sequence.join(',');
    dispatchAction('SUBMIT_CODE', { puzzleId, code });
    setShaking(true);
    setTimeout(() => {
      setShaking(false);
      setSequence([]);
    }, 500);
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

  const symbolBase = data.symbolBasePath || '/games/haunted-manor';

  return (
    <div className={`puzzle-panel available ${shaking ? 'shake' : ''}`}>
      <h3 className="puzzle-label">{label}</h3>
      <p className="puzzle-prompt">{data.prompt}</p>

      {canInteract ? (
        <div className="symbol-sequence">
          {/* Progress slots */}
          <div className="symbol-progress">
            {Array.from({ length: maxClicks }).map((_, i) => (
              <div
                key={i}
                className={`sequence-slot ${sequence[i] ? 'filled' : 'empty'}`}
                title={sequence[i] || `Step ${i + 1}`}
              >
                {sequence[i] ? (
                  <img
                    src={`${symbolBase}/symbols/${sequence[i]}.svg`}
                    alt={sequence[i]}
                    className="sequence-symbol-img"
                  />
                ) : (
                  <span className="sequence-number">{i + 1}</span>
                )}
              </div>
            ))}
          </div>

          {/* Symbol grid */}
          <div className="symbol-grid">
            {symbols.map(({ id, label: symLabel }) => {
              const usedCount = sequence.filter((s) => s === id).length;
              return (
                <button
                  key={id}
                  className={`symbol-btn ${usedCount > 0 ? 'symbol-used' : ''}`}
                  onClick={() => handleSymbolClick(id)}
                  disabled={sequence.length >= maxClicks}
                  title={symLabel}
                  aria-label={`Select symbol: ${symLabel}`}
                >
                  <img
                    src={`${symbolBase}/symbols/${id}.svg`}
                    alt={symLabel}
                    className="symbol-img"
                  />
                  <span className="symbol-label">{symLabel}</span>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="symbol-actions">
            <button
              className="btn btn-ghost"
              onClick={handleReset}
              disabled={sequence.length === 0}
            >
              Reset
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={sequence.length < maxClicks}
            >
              Invoke ({sequence.length}/{maxClicks})
            </button>
          </div>
        </div>
      ) : (
        <p className="puzzle-readonly-hint">
          Your partner is working on this. Describe the symbols to them.
        </p>
      )}
    </div>
  );
}
