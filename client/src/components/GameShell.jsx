import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

import HMPilotScene     from '../games/haunted-manor/PilotScene.jsx';
import HMNavigatorScene from '../games/haunted-manor/NavigatorScene.jsx';
import ARPilotScene     from '../games/ares-station/PilotScene.jsx';
import ARNavigatorScene from '../games/ares-station/NavigatorScene.jsx';

// ── Per-game display config ───────────────────────────────────────────────
const GAME_CONFIG = {
  'haunted-manor': {
    title:          'The Haunted Manor',
    pilotBadge:     '⚙ PILOT',
    navigatorBadge: '🗺 NAVIGATOR',
    victoryIcon:    '🔓',
    victoryTitle:   'You Escaped!',
    victoryLine:    (role) => `The Count's secrets are yours. Well done, ${role === 'pilot' ? 'Pilot' : 'Navigator'}.`,
  },
  'ares-station': {
    title:          'ARES Protocol',
    pilotBadge:     '⚡ OPERATOR',
    navigatorBadge: '📡 ANALYST',
    victoryIcon:    '🚀',
    victoryTitle:   'Station Secured!',
    victoryLine:    (role) => `ARES neutralised. Escape pod away. Well done, ${role === 'pilot' ? 'Operator' : 'Analyst'}.`,
  },
};

// ── Scene components registry ─────────────────────────────────────────────
const SCENES = {
  'haunted-manor': { pilot: HMPilotScene,  navigator: HMNavigatorScene },
  'ares-station':  { pilot: ARPilotScene,  navigator: ARNavigatorScene },
};

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function VictoryScreen({ elapsedMs, role, gameId, onPlayAgain }) {
  const cfg = GAME_CONFIG[gameId] || GAME_CONFIG['haunted-manor'];
  return (
    <div className="victory-overlay">
      <div className="victory-card">
        <div className="victory-icon">{cfg.victoryIcon}</div>
        <h1>{cfg.victoryTitle}</h1>
        <p className="victory-time">
          Time: <strong>{formatTime(elapsedMs)}</strong>
        </p>
        <p className="victory-sub">{cfg.victoryLine(role)}</p>
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}

export default function GameShell({ playerView, roomCode }) {
  const navigate = useNavigate();
  const { clearSession, lastRejection } = useApp();
  const [elapsedMs, setElapsedMs] = useState(playerView.elapsedMs);

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
  const cfg    = GAME_CONFIG[gameId] || GAME_CONFIG['haunted-manor'];
  const scenes = SCENES[gameId]      || SCENES['haunted-manor'];
  const SceneComponent = role === 'pilot' ? scenes.pilot : scenes.navigator;

  return (
    <div className="game-shell">
      {/* ── Header ── */}
      <header className="game-header">
        <div className="header-left">
          <span className="role-badge">
            {role === 'pilot' ? cfg.pilotBadge : cfg.navigatorBadge}
          </span>
        </div>
        <div className="header-center">
          <span className="game-title">{cfg.title}</span>
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
          gameId={gameId}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
