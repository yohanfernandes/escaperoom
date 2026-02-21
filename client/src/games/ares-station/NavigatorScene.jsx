import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.jsx';

function AnalystCluePanel({ puzzle, onShowLightbox }) {
  const { dispatchAction } = useApp();
  const { puzzleId, label, status, data, interactableBy } = puzzle;
  const [code, setCode] = useState('');
  const [shaking, setShaking] = useState(false);

  const canInteract = interactableBy === 'both' || interactableBy === 'navigator';

  function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim() || !canInteract) return;
    dispatchAction('SUBMIT_CODE', { puzzleId, code });
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
    setCode('');
  }

  if (status === 'locked') {
    return (
      <div className="puzzle-panel locked">
        <div className="puzzle-lock-icon">🔒</div>
        <span className="puzzle-label">{label}</span>
        <span className="puzzle-locked-hint">Solve other systems to unlock this</span>
      </div>
    );
  }

  if (status === 'solved') {
    return (
      <div className="puzzle-panel solved">
        <div className="puzzle-solved-icon">✓</div>
        <span className="puzzle-label">{label}</span>
        <span className="puzzle-solved-text">Solved</span>
      </div>
    );
  }

  return (
    <div className={`puzzle-panel available nav-clue-panel ${shaking ? 'shake' : ''}`}>
      <h3 className="puzzle-label">{label}</h3>

      {data.imageUrl && (
        <button
          className="clue-image-frame"
          onClick={() => onShowLightbox(data.imageUrl)}
          aria-label={`Enlarge data for ${label}`}
        >
          <img src={data.imageUrl} alt={`Data: ${label}`} className="clue-image" />
          <span className="clue-image-caption">Click to enlarge</span>
        </button>
      )}

      {data.prompt && <p className="puzzle-prompt">{data.prompt}</p>}

      {canInteract ? (
        <form onSubmit={handleSubmit} className="code-form">
          <input
            className="input code-input"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={data.placeholder || 'Enter full code…'}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <button className="btn btn-primary" type="submit" disabled={!code.trim()}>
            Transmit
          </button>
        </form>
      ) : (
        <p className="puzzle-readonly-hint">
          Relay this data to your Operator.
        </p>
      )}
    </div>
  );
}

export default function NavigatorScene({ playerView, roomCode }) {
  const { partnerActivity, myPuzzles } = playerView;
  const [lightboxUrl, setLightboxUrl] = useState(null);

  return (
    <div className="scene navigator-scene ares-station">
      <div className="scene-columns">
        {/* ── Data column ── */}
        <div className="puzzle-column">
          <div className="column-header">
            <h2>Mission Data</h2>
          </div>

          {myPuzzles.map((puzzle) => (
            <AnalystCluePanel
              key={puzzle.puzzleId}
              puzzle={puzzle}
              onShowLightbox={setLightboxUrl}
            />
          ))}
        </div>

        {/* ── Activity feed ── */}
        <div className="activity-column">
          <div className="column-header">
            <h2>Progress</h2>
          </div>
          <div className="activity-feed">
            {partnerActivity.length === 0 ? (
              <p className="activity-empty">Your Operator's progress will appear here.</p>
            ) : (
              partnerActivity.map((event, i) => (
                <div key={i} className="activity-item">
                  <span className="activity-icon">★</span>
                  <span className="activity-message">{event.message}</span>
                </div>
              ))
            )}
          </div>

          <div className="role-info-card">
            <h3>Analyst</h3>
            <ul>
              <li>You have remote access. Use it.</li>
              <li>Your Operator is inside. You are not.</li>
              <li>The data holds the answers.</li>
            </ul>
          </div>
        </div>
      </div>

      {lightboxUrl && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxUrl(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Data enlarged"
        >
          <img src={lightboxUrl} alt="Data enlarged" className="lightbox-image" />
          <button
            className="lightbox-close btn btn-ghost"
            onClick={() => setLightboxUrl(null)}
          >
            ✕ Close
          </button>
        </div>
      )}
    </div>
  );
}
