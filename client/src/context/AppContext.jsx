import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { socket } from '../socket.js';

const AppContext = createContext(null);

const SESSION_KEY = 'escape-room-session';

export function AppProvider({ children }) {
  // { roomCode, role, gameId }
  const [roomInfo, setRoomInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // The filtered PlayerView from the server
  const [playerView, setPlayerView] = useState(null);

  // Feedback for rejected actions
  const [lastRejection, setLastRejection] = useState(null);

  // Whether audio has been unlocked by user gesture
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  // Connection status
  const [connected, setConnected] = useState(socket.connected);

  // ── Persist session to localStorage ──────────────────────────────────────
  const saveSession = useCallback((info) => {
    setRoomInfo(info);
    if (info) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(info));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const clearSession = useCallback(() => {
    saveSession(null);
    setPlayerView(null);
    setAudioUnlocked(false);
  }, [saveSession]);

  // ── Socket lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onStateUpdate = (view) => setPlayerView(view);
    const onActionRejected = ({ reason }) => {
      setLastRejection(reason);
      // Auto-clear after 4 s
      setTimeout(() => setLastRejection(null), 4000);
    };
    const onRoomExpired = () => {
      clearSession();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('STATE_UPDATE', onStateUpdate);
    socket.on('ACTION_REJECTED', onActionRejected);
    socket.on('ROOM_EXPIRED', onRoomExpired);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('STATE_UPDATE', onStateUpdate);
      socket.off('ACTION_REJECTED', onActionRejected);
      socket.off('ROOM_EXPIRED', onRoomExpired);
    };
  }, [clearSession]);

  // ── Action dispatcher ─────────────────────────────────────────────────────
  const dispatchAction = useCallback(
    (type, payload) => {
      if (!roomInfo?.roomCode) return;
      setLastRejection(null);
      socket.emit('ACTION', { roomCode: roomInfo.roomCode, type, payload });
    },
    [roomInfo]
  );

  return (
    <AppContext.Provider
      value={{
        socket,
        connected,
        roomInfo,
        saveSession,
        clearSession,
        playerView,
        setPlayerView,
        dispatchAction,
        lastRejection,
        setLastRejection,
        audioUnlocked,
        setAudioUnlocked,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
