import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function LobbyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket, connected, saveSession } = useApp();

  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState('haunted-manor');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState(location.state?.error || '');
  const [loading, setLoading] = useState(false);

  // Fetch available games from API
  useEffect(() => {
    fetch('/api/games')
      .then((r) => r.json())
      .then(setGames)
      .catch(() => setGames([{ id: 'haunted-manor', displayName: 'The Haunted Manor', estimatedMinutes: 30 }]));
  }, []);

  // ── Create room ───────────────────────────────────────────────────────────
  function handleCreate() {
    if (!connected) return setError('Not connected to server');
    setLoading(true);
    setError('');

    socket.emit('CREATE_ROOM', { gameId: selectedGame });

    const onCreated = ({ roomCode, role }) => {
      saveSession({ roomCode, role, gameId: selectedGame });
      setLoading(false);
      navigate(`/waiting/${roomCode}`);
    };

    const onError = ({ message }) => {
      setError(message);
      setLoading(false);
    };

    socket.once('ROOM_CREATED', onCreated);
    socket.once('ERROR', onError);

    // Cleanup if component unmounts
    return () => {
      socket.off('ROOM_CREATED', onCreated);
      socket.off('ERROR', onError);
    };
  }

  // ── Join room ─────────────────────────────────────────────────────────────
  function handleJoin(e) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return setError('Enter a room code');
    if (!connected) return setError('Not connected to server');
    setLoading(true);
    setError('');

    socket.emit('JOIN_ROOM', { roomCode: code });

    const onJoined = ({ roomCode, role }) => {
      saveSession({ roomCode, role, gameId: selectedGame });
      setLoading(false);
      navigate(`/game/${roomCode}`);
    };

    const onError = ({ message }) => {
      setError(message);
      setLoading(false);
    };

    socket.once('ROOM_JOINED', onJoined);
    socket.once('ERROR', onError);
  }

  return (
    <div className="page lobby-page">
      <div className="lobby-container">
        <header className="lobby-header">
          <h1 className="title-main">Escape Room</h1>
          <p className="subtitle">An asymmetric cooperative puzzle experience</p>
          <div className={`connection-badge ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '● Connected' : '○ Connecting…'}
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        {/* Game selection */}
        <section className="lobby-section">
          <h2>Choose a game</h2>
          <div className="game-list">
            {games.map((g) => (
              <button
                key={g.id}
                className={`game-card ${selectedGame === g.id ? 'selected' : ''}`}
                onClick={() => setSelectedGame(g.id)}
              >
                <span className="game-card-name">{g.displayName}</span>
                <span className="game-card-time">~{g.estimatedMinutes} min</span>
              </button>
            ))}
          </div>
        </section>

        <div className="lobby-actions">
          {/* Create room */}
          <div className="action-card">
            <h3>Create a room</h3>
            <p>You'll be the <strong>Pilot</strong> — you interact with the puzzles.</p>
            <button
              className="btn btn-primary"
              onClick={handleCreate}
              disabled={loading || !connected}
            >
              {loading ? 'Creating…' : 'Create Room'}
            </button>
          </div>

          <div className="action-divider">or</div>

          {/* Join room */}
          <div className="action-card">
            <h3>Join a room</h3>
            <p>You'll be the <strong>Navigator</strong> — you decipher the clues.</p>
            <form onSubmit={handleJoin} className="join-form">
              <input
                className="input"
                type="text"
                placeholder="Enter room code (e.g. GHOST42)"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={10}
                autoComplete="off"
              />
              <button
                className="btn btn-secondary"
                type="submit"
                disabled={loading || !connected}
              >
                {loading ? 'Joining…' : 'Join Room'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
