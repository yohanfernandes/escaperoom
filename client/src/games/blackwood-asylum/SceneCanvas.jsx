import React, { useState } from 'react';
import { HOTSPOTS } from './hotspots.js';

export default function SceneCanvas({ puzzles, onSelect }) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="scene-canvas">
      <div className="scene-image-wrapper">
        {!imageError ? (
          <img
            src="/games/blackwood-asylum/room-scene.jpg"
            alt="Blackwood Asylum — Ward B interior"
            className="scene-image"
            draggable={false}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="scene-image-placeholder">
            <p>Room scene image not yet placed.</p>
            <p className="scene-placeholder-hint">
              Generate <strong>room-scene.jpg</strong> and place it in{' '}
              <code>client/public/games/blackwood-asylum/</code>
            </p>
          </div>
        )}

        {/* Hotspot overlays — positioned as % of image */}
        {puzzles.map((puzzle) => {
          const hs = HOTSPOTS[puzzle.puzzleId];
          if (!hs) return null;

          const isAvailable = puzzle.status === 'available';

          return (
            <div
              key={puzzle.puzzleId}
              className={`hotspot ${isAvailable ? 'hotspot-available' : ''}`}
              style={{
                left:   `${hs.x}%`,
                top:    `${hs.y}%`,
                width:  `${hs.w}%`,
                height: `${hs.h}%`,
              }}
              onClick={isAvailable ? () => onSelect(puzzle.puzzleId) : undefined}
              role={isAvailable ? 'button' : undefined}
              tabIndex={isAvailable ? 0 : undefined}
              onKeyDown={isAvailable ? (e) => e.key === 'Enter' && onSelect(puzzle.puzzleId) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
