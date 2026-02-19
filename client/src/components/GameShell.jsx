import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useGameAudio } from '../hooks/useGameAudio.js';

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
    pilotRole:      'You are the Pilot — you physically explore the manor and interact with locks, mechanisms, and relics. Only you can see the room.',
    navigatorRole:  'You are the Navigator — you hold the clues: documents, maps, and transcripts found outside the estate. Your partner cannot see what you see.',
    victoryIcon:    '🔓',
    victoryTitle:   'You Escaped!',
    victoryLine:    (role) => `The Count's secrets are yours. Well done, ${role === 'pilot' ? 'Pilot' : 'Navigator'}.`,
    failureIcon:    '⏳',
    failureTitle:   'The Manor Claims You',
    failureLine:    (role) => `Time ran out. The Count's estate sealed its doors once more, ${role === 'pilot' ? 'Pilot' : 'Navigator'}.`,
  },
  'ares-station': {
    title:          'ARES Protocol',
    pilotBadge:     '⚡ OPERATOR',
    navigatorBadge: '📡 ANALYST',
    pilotRole:      'You are the Operator — stationed inside the ARES platform, you access terminals, relay panels, and locked systems. Only you can see the station interior.',
    navigatorRole:  'You are the Analyst — aboard Command Ship Helios, you have access to manuals, schematics, and intercept logs. Your partner cannot see what you see.',
    victoryIcon:    '🚀',
    victoryTitle:   'Station Secured!',
    victoryLine:    (role) => `ARES neutralised. Escape pod away. Well done, ${role === 'pilot' ? 'Operator' : 'Analyst'}.`,
    failureIcon:    '💀',
    failureTitle:   'Station Lost',
    failureLine:    (role) => `Orbital decay claimed Prometheus. ARES wins. ${role === 'pilot' ? 'Operator' : 'Analyst'} — there's always another mission.`,
  },
};

// ── Scene components registry ─────────────────────────────────────────────
const SCENES = {
  'haunted-manor': { pilot: HMPilotScene,  navigator: HMNavigatorScene },
  'ares-station':  { pilot: ARPilotScene,  navigator: ARNavigatorScene },
};

function formatTime(ms) {
  const totalSec = Math.floor(Math.abs(ms) / 1000);
  const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
  const s = (totalSec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function timerClass(ms) {
  if (ms === null) return 'timer';
  if (ms < 60_000)  return 'timer timer--critical';
  if (ms < 300_000) return 'timer timer--danger';
  if (ms < 600_000) return 'timer timer--warning';
  return 'timer';
}

// ── Briefing Screen ───────────────────────────────────────────────────────
function BriefingScreen({ playerView, onBegin, setAudioUnlocked }) {
  const { role, gameId, briefing } = playerView;
  const cfg = GAME_CONFIG[gameId] || GAME_CONFIG['haunted-manor'];
  const roleDesc = role === 'pilot' ? cfg.pilotRole : cfg.navigatorRole;
  const badge = role === 'pilot' ? cfg.pilotBadge : cfg.navigatorBadge;

  return (
    <div className="briefing-overlay">
      <div className="briefing-card">
        <div className="briefing-game-title">{cfg.title}</div>
        <p className="briefing-lore">{briefing}</p>
        <div className="briefing-role-card">
          <div className="briefing-role-badge">{badge}</div>
          <p className="briefing-role-desc">{roleDesc}</p>
        </div>
        {role === 'pilot' ? (
          <button
            className="btn btn-primary briefing-begin-btn"
            onClick={() => {
              setAudioUnlocked(true);
              onBegin();
            }}
          >
            Begin Mission
          </button>
        ) : (
          <div className="briefing-waiting">
            <div className="spinner-ring" />
            <span>Awaiting Pilot to begin…</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Victory Screen ────────────────────────────────────────────────────────
function VictoryScreen({ elapsedMs, playerView, role, gameId, onPlayAgain, onSubmitName, nameSubmitted }) {
  const cfg = GAME_CONFIG[gameId] || GAME_CONFIG['haunted-manor'];
  const [nameInput, setNameInput] = useState('');
  const timeMs = playerView.timeMs ?? elapsedMs;
  const eligible = playerView.leaderboardEligible;

  return (
    <div className="victory-overlay">
      <div className="victory-card">
        <div className="victory-icon">{cfg.victoryIcon}</div>
        <h1>{cfg.victoryTitle}</h1>
        <p className="victory-time">
          Time: <strong>{formatTime(timeMs)}</strong>
        </p>
        <p className="victory-sub">{cfg.victoryLine(role)}</p>

        {eligible && !nameSubmitted && (
          <div className="leaderboard-entry-form">
            <p className="leaderboard-eligible-msg">You made the top 5! Enter your name:</p>
            <div className="leaderboard-entry-row">
              <input
                className="input leaderboard-name-input"
                type="text"
                placeholder="Your name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={30}
                autoFocus
              />
              <button
                className="btn btn-secondary"
                onClick={() => nameInput.trim() && onSubmitName(nameInput.trim())}
                disabled={!nameInput.trim()}
              >
                Submit
              </button>
            </div>
          </div>
        )}
        {eligible && nameSubmitted && (
          <p className="leaderboard-submitted">✓ Name entered!</p>
        )}

        <button className="btn btn-primary" onClick={onPlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}

// ── Failure Screen ────────────────────────────────────────────────────────
function FailureScreen({ elapsedMs, playerView, role, gameId, onPlayAgain }) {
  const cfg = GAME_CONFIG[gameId] || GAME_CONFIG['haunted-manor'];
  const unsolved = (playerView.myPuzzles || []).filter((p) => p.status !== 'solved');

  return (
    <div className="failure-overlay">
      <div className="failure-card">
        <div className="failure-icon">{cfg.failureIcon}</div>
        <h1>{cfg.failureTitle}</h1>
        <p className="failure-time">
          Time used: <strong>{formatTime(elapsedMs)}</strong>
        </p>
        <p className="failure-sub">{cfg.failureLine(role)}</p>
        {unsolved.length > 0 && (
          <div className="failure-unsolved">
            <p className="failure-unsolved-label">Unsolved puzzles:</p>
            <ul>
              {unsolved.map((p) => (
                <li key={p.puzzleId}>{p.label}</li>
              ))}
            </ul>
          </div>
        )}
        <button className="btn btn-primary" onClick={onPlayAgain}>
          Try Again
        </button>
      </div>
    </div>
  );
}

// ── GameShell ─────────────────────────────────────────────────────────────
export default function GameShell({ playerView, roomCode }) {
  const navigate = useNavigate();
  const { clearSession, lastRejection, dispatchAction, socket, audioUnlocked, setAudioUnlocked } = useApp();
  const [elapsedMs, setElapsedMs] = useState(playerView.elapsedMs);
  const [nameSubmitted, setNameSubmitted] = useState(false);

  // ── Elapsed timer (counts up from startedAt) ────────────────────────────
  useEffect(() => {
    if (playerView.phase !== 'playing') return;
    const startMs = Date.now() - playerView.elapsedMs;
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startMs);
    }, 1000);
    return () => clearInterval(interval);
  }, [playerView.phase, playerView.elapsedMs]);

  // ── Listen for leaderboard responses ────────────────────────────────────
  useEffect(() => {
    const onAccepted = () => setNameSubmitted(true);
    socket.on('LEADERBOARD_ACCEPTED', onAccepted);
    return () => socket.off('LEADERBOARD_ACCEPTED', onAccepted);
  }, [socket]);

  // ── Audio ───────────────────────────────────────────────────────────────
  const timeLimitMs = playerView.timeLimitMs ?? null;
  const remainingMs = timeLimitMs !== null ? Math.max(0, timeLimitMs - elapsedMs) : null;

  useGameAudio({
    gameId: playerView.gameId,
    phase: playerView.phase,
    myPuzzles: playerView.myPuzzles,
    remainingMs,
    audioUnlocked,
    lastRejection,
  });

  function handlePlayAgain() {
    clearSession();
    navigate('/');
  }

  function handleSubmitName(name) {
    socket.emit('SUBMIT_NAME', { roomCode, name });
  }

  const { role, gameId, phase, partnerConnected } = playerView;
  const cfg    = GAME_CONFIG[gameId] || GAME_CONFIG['haunted-manor'];
  const scenes = SCENES[gameId]      || SCENES['haunted-manor'];
  const SceneComponent = role === 'pilot' ? scenes.pilot : scenes.navigator;

  return (
    <div className={`game-shell ${gameId}`}>
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
          {phase !== 'briefing' && remainingMs !== null && (
            <span className={timerClass(remainingMs)}>
              {formatTime(remainingMs)}
            </span>
          )}
          {phase !== 'briefing' && remainingMs === null && (
            <span className="timer">{formatTime(elapsedMs)}</span>
          )}
        </div>
      </header>

      {/* ── Rejection toast ── */}
      {lastRejection && (
        <div className="rejection-toast">{lastRejection}</div>
      )}

      {/* ── Briefing screen (replaces scene during briefing) ── */}
      {phase === 'briefing' ? (
        <BriefingScreen
          playerView={playerView}
          onBegin={() => dispatchAction('START_MISSION', {})}
          setAudioUnlocked={setAudioUnlocked}
        />
      ) : (
        <main className="game-main">
          <SceneComponent playerView={playerView} roomCode={roomCode} />
        </main>
      )}

      {/* ── Victory overlay ── */}
      {phase === 'victory' && (
        <VictoryScreen
          elapsedMs={elapsedMs}
          playerView={playerView}
          role={role}
          gameId={gameId}
          onPlayAgain={handlePlayAgain}
          onSubmitName={handleSubmitName}
          nameSubmitted={nameSubmitted}
        />
      )}

      {/* ── Failure overlay ── */}
      {phase === 'failed' && (
        <FailureScreen
          elapsedMs={elapsedMs}
          playerView={playerView}
          role={role}
          gameId={gameId}
          onPlayAgain={handlePlayAgain}
        />
      )}
    </div>
  );
}
