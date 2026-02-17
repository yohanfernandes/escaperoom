import React from 'react';
import CodeInput from '../../components/puzzles/CodeInput.jsx';

const PUZZLE_COMPONENTS = {
  code_input: CodeInput,
};

export default function NavigatorScene({ playerView, roomCode }) {
  const { partnerActivity } = playerView;

  return (
    <div className="scene navigator-scene">
      <div className="scene-columns">
        {/* ── Clue column ── */}
        <div className="puzzle-column">
          <div className="column-header">
            <h2>Your Reference</h2>
            <p className="column-subtitle">
              You hold the clues. Describe them to your Pilot.
            </p>
          </div>

          {playerView.myPuzzles.map((puzzle) => {
            const Component = PUZZLE_COMPONENTS[puzzle.kind] || CodeInput;
            const canInteract =
              puzzle.interactableBy === 'both' || puzzle.interactableBy === 'navigator';

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
            <h2>Progress</h2>
          </div>
          <div className="activity-feed">
            {partnerActivity.length === 0 ? (
              <p className="activity-empty">Your Pilot's progress will appear here.</p>
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
            <h3>Your role: Navigator</h3>
            <ul>
              <li>You hold the clues and references</li>
              <li>Describe what you read to your Pilot</li>
              <li>Your Pilot enters the answers</li>
              <li>For the final puzzle — you both enter the code!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
