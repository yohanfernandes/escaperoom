import React from 'react';
import CodeInput from '../../components/puzzles/CodeInput.jsx';
import { useApp } from '../../context/AppContext.jsx';

const PUZZLE_COMPONENTS = {
  code_input: CodeInput,
};

export default function PilotScene({ playerView, roomCode }) {
  const { partnerActivity } = playerView;

  return (
    <div className="scene pilot-scene">
      <div className="scene-columns">
        {/* ── Puzzle column ── */}
        <div className="puzzle-column">
          <div className="column-header">
            <h2>The Manor</h2>
            <p className="column-subtitle">
              Explore the room. Describe what you see to your Navigator.
            </p>
          </div>

          {playerView.myPuzzles.map((puzzle) => {
            const Component = PUZZLE_COMPONENTS[puzzle.kind] || CodeInput;
            const canInteract =
              puzzle.interactableBy === 'both' || puzzle.interactableBy === 'pilot';

            return (
              <Component
                key={puzzle.puzzleId}
                puzzle={puzzle}
                roomCode={roomCode}
                canInteract={canInteract}
              />
            );
          })}
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
              <li>You interact with the puzzles</li>
              <li>Describe what you see to your Navigator</li>
              <li>Your Navigator has the clues you need</li>
              <li>Talk! Communication is everything.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
