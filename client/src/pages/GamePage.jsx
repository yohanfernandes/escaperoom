import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import GameShell from '../components/GameShell.jsx';

export default function GamePage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket, roomInfo, saveSession, playerView, clearSession } = useApp();
  const didRejoin = useRef(false);

  // Attempt to rejoin on mount if we have a saved session
  useEffect(() => {
    if (didRejoin.current) return;

    if (!roomInfo?.role) {
      // No session — go back to lobby
      navigate('/', { replace: true });
      return;
    }

    // If we already have an active state in context, no need to rejoin
    if (['briefing', 'playing', 'victory', 'failed'].includes(playerView?.phase)) return;

    // Otherwise, emit REJOIN_ROOM to restore state after page refresh
    didRejoin.current = true;
    socket.emit('REJOIN_ROOM', { roomCode, role: roomInfo.role });

    const onRoomExpired = () => {
      clearSession();
      navigate('/', { replace: true, state: { error: 'Room expired or not found.' } });
    };

    socket.once('ROOM_EXPIRED', onRoomExpired);
    return () => socket.off('ROOM_EXPIRED', onRoomExpired);
  }, [socket, roomCode, roomInfo, playerView, navigate, clearSession]);

  // Listen for PARTNER_CONNECTED / PARTNER_DISCONNECTED events
  // (STATE_UPDATE already carries partnerConnected, but these give instant feedback)
  useEffect(() => {
    const onPartnerConnected = () => {
      // Context will update on next STATE_UPDATE — nothing extra needed here
    };
    socket.on('PARTNER_CONNECTED', onPartnerConnected);
    return () => socket.off('PARTNER_CONNECTED', onPartnerConnected);
  }, [socket]);

  if (!playerView) {
    return (
      <div className="page">
        <div style={{ textAlign: 'center', marginTop: '30vh' }}>
          <div className="spinner-ring" style={{ margin: '0 auto 1rem' }} />
          <p>Loading game…</p>
        </div>
      </div>
    );
  }

  return <GameShell playerView={playerView} roomCode={roomCode} />;
}
