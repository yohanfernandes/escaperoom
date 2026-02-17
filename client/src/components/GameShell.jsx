import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import PilotScene from '../games/haunted-manor/PilotScene.jsx';
import NavigatorScene from '../games/haunted-manor/NavigatorScene.jsx';

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function VictoryScreen({ elapsedMs, role, onPlayAgain }) {
  return (
    <div className="victory-overlay">
      <div className="victory-card">
        <div className="victory-icon">🔓</div>
        <h1>You Escaped!</h1>
        <p className="victory-time">
          Time: <strong>{formatTime(elapsedMs)}</strong>
        </p>
        <p className="victory-sub">
          The Count's secrets are yours. Well done, {role === 'pilot' ? 'Pilot' : 'Navigator'}.
        </p>
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}

// Game scenes registry — add new games here
const SCENES = {
  'haunted-manor': { pilot: PilotScene, navigator: NavigatorScene },
};

export default function GameShell({ playerView, roomCode }) {
  const navigate = useNavigate();
  const { clearSession, lastRejection } = useApp();
  const [elapsedMs, setElapsedMs] = useState(playerView.elapsedMs);

  // Tick the timer every second
  useEffect(() => {
    if (playerView.phase !== 'playing') return;
    const startMs = Date.now() - playerView.elapsedMs;
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startMs);
    }, 1000);
    return () => clearInterval(interval);
  }, [playerView.phase, playerView.elapsedMs]);

  function handlePlayAgain() {
    clearSession();
    navigate('/');
  }

  const { role, gameId, phase, partnerConnected } = playerView;
  const scenes = SCENES[gameId] || SCENES['haunted-manor'];
  const SceneComponent = role === 'pilot' ? scenes.pilot : scenes.navigator;

  return (
    <div className="game-shell">
      {/* ── Header ── */}
      <header className="game-header">
        <div className="header-left">
          <span className="role-badge">{role === 'pilot' ? '⚙ PILOT' : '🗺 NAVIGATOR'}</span>
        </div>
        <div className="header-center">
          <span className="game-title">The Haunted Manor</span>
        </div>
        <div className="header-right">
          <span className={`partner-status ${partnerConnected ? 'online' : 'offline'}`}>
            {partnerConnected ? '● Partner' : '○ Partner disconnected'}
          </span>
          <span className="timer">{formatTime(elapsedMs)}</span>
        </div>
      </header>

      {/* ── Rejection toast ── */}
      {lastRejection && (
        <div className="rejection-toast">{lastRejection}</div>
      )}

      {/* ── Game scene ── */}
      <main className="game-main">
        <SceneComponent playerView={playerView} roomCode={roomCode} />
      </main>

      {/* ── Victory overlay ── */}
      {phase === 'victory' && (
        <VictoryScreen
          elapsedMs={elapsedMs}
          role={role}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
