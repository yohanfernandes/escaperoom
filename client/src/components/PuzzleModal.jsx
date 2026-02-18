import React, { useEffect, useRef } from 'react';
import CodeInput from './puzzles/CodeInput.jsx';
import CombinationLock from './puzzles/CombinationLock.jsx';
import SymbolSequence from './puzzles/SymbolSequence.jsx';

const PUZZLE_COMPONENTS = {
  code_input:       CodeInput,
  combination_lock: CombinationLock,
  symbol_sequence:  SymbolSequence,
};

export default function PuzzleModal({ puzzle, roomCode, onClose }) {
  const drawerRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!puzzle) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [puzzle, onClose]);

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) onClose();
  }

  if (!puzzle) return null;

  const Component = PUZZLE_COMPONENTS[puzzle.kind] || CodeInput;
  const canInteract = puzzle.interactableBy === 'both' || puzzle.interactableBy === 'pilot';

  return (
    <div
      className="modal-backdrop modal-open"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={puzzle.label}
    >
      <div className="modal-drawer" ref={drawerRef}>
        <div className="modal-header">
          <span className="modal-title">{puzzle.label}</span>
          <button
            className="modal-close btn btn-ghost"
            onClick={onClose}
            aria-label="Close puzzle"
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <Component
            puzzle={puzzle}
            roomCode={roomCode}
            canInteract={canInteract}
          />
        </div>
      </div>
    </div>
  );
}
