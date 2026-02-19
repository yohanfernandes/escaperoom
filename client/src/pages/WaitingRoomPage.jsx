import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

export default function WaitingRoomPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket, playerView } = useApp();
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}/join/${roomCode}`;

  // Navigate to game when state arrives with phase "playing"
  useEffect(() => {
    if (playerView?.phase === 'playing') {
      navigate(`/game/${roomCode}`, { replace: true });
    }
  }, [playerView, roomCode, navigate]);

  // Also navigate on PARTNER_CONNECTED as a fallback
  useEffect(() => {
    const handler = () => {
      // Give STATE_UPDATE a moment to arrive first
      setTimeout(() => navigate(`/game/${roomCode}`, { replace: true }), 200);
    };
    socket.on('PARTNER_CONNECTED', handler);
    return () => socket.off('PARTNER_CONNECTED', handler);
  }, [socket, roomCode, navigate]);

  function copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function copyCode() { copyToClipboard(roomCode); }
  function copyUrl()  { copyToClipboard(shareUrl); }

  return (
    <div className="page waiting-page">
      <div className="waiting-container">
        <div className="waiting-role-badge">PILOT</div>
        <h1>Waiting for your partner…</h1>
        <p className="waiting-subtitle">
          Share the code or link below with your partner.
          <br />
          <em>You must talk to each other — voice or text — to escape!</em>
        </p>

        <div className="room-code-display">
          <span className="room-code-label">Room code</span>
          <span className="room-code-value">{roomCode}</span>
          <button className="btn-copy" onClick={copyCode}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="share-url-row">
          <span className="share-url-text">{shareUrl}</span>
          <button className="btn-copy" onClick={copyUrl}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>

        <div className="waiting-spinner">
          <div className="spinner-ring" />
          <span>Waiting for Navigator to join…</span>
        </div>

        <button className="btn btn-ghost" onClick={() => navigate('/')}>
          Cancel
        </button>
      </div>
    </div>
  );
}
