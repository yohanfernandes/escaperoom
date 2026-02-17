import React, { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';

// Auto-join page: visited when someone follows a share link (/join/ROOMCODE)
export default function JoinPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { socket, connected, saveSession } = useApp();
  const didJoin = useRef(false);

  useEffect(() => {
    if (!connected || didJoin.current) return;
    didJoin.current = true;

    socket.emit('JOIN_ROOM', { roomCode: roomCode.toUpperCase() });

    const onJoined = ({ roomCode: rc, role }) => {
      saveSession({ roomCode: rc, role });
      navigate(`/game/${rc}`, { replace: true });
    };

    const onError = ({ message }) => {
      navigate('/', { replace: true, state: { error: message } });
    };

    socket.once('ROOM_JOINED', onJoined);
    socket.once('ERROR', onError);

    return () => {
      socket.off('ROOM_JOINED', onJoined);
      socket.off('ERROR', onError);
    };
  }, [connected, roomCode, socket, saveSession, navigate]);

  return (
    <div className="page">
      <div style={{ textAlign: 'center', marginTop: '30vh' }}>
        <div className="spinner-ring" style={{ margin: '0 auto 1rem' }} />
        <p>Joining room <strong>{roomCode}</strong>…</p>
      </div>
    </div>
  );
}
