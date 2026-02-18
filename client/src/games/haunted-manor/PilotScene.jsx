import React, { useState, useEffect } from 'react';
import SceneCanvas from './SceneCanvas.jsx';
import PuzzleModal from '../../components/PuzzleModal.jsx';

export default function PilotScene({ playerView, roomCode }) {
  const { partnerActivity, myPuzzles } = playerView;
  const [activePuzzleId, setActivePuzzleId] = useState(null);

  const activePuzzle = myPuzzles.find((p) => p.puzzleId === activePuzzleId) ?? null;

  // Auto-close modal when active puzzle gets solved
  useEffect(() => {
    if (!activePuzzleId) return;
    const p = myPuzzles.find((p) => p.puzzleId === activePuzzleId);
    if (p?.status === 'solved') {
      const t = setTimeout(() => setActivePuzzleId(null), 700);
      return () => clearTimeout(t);
    }
  }, [myPuzzles, activePuzzleId]);

  return (
    <div className="scene pilot-scene">
      <div className="scene-columns">
        {/* ── Room scene ── */}
        <div className="puzzle-column">
          <div className="column-header">
            <h2>The Manor</h2>
            <p className="column-subtitle">
              Click glowing objects to interact with them. Describe what you see to your Navigator.
            </p>
          </div>

          <SceneCanvas
            puzzles={myPuzzles}
            onSelect={setActivePuzzleId}
          />
        </div>

        {/* ── Activity feed ── */}
        <div className="activity-column">
          <div className="column-header">
            <h2>Activity</h2>
          </div>
          <div className="activity-feed">
            {partnerActivity.length === 0 ? (
              <p className="activity-empty">Your Navigator's discoveries will appear here.</p>
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
            <h3>Your role: Pilot</h3>
            <ul>
              <li>Click glowing objects to interact</li>
              <li>Describe what you see to your Navigator</li>
              <li>Your Navigator has the clues you need</li>
              <li>Talk! Communication is everything.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Slide-up puzzle modal */}
      <PuzzleModal
        puzzle={activePuzzle}
        roomCode={roomCode}
        onClose={() => setActivePuzzleId(null)}
      />
    </div>
  );
}
