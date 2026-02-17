import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.jsx';
import LobbyPage from './pages/LobbyPage.jsx';
import WaitingRoomPage from './pages/WaitingRoomPage.jsx';
import GamePage from './pages/GamePage.jsx';
import JoinPage from './pages/JoinPage.jsx';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LobbyPage />} />
          <Route path="/waiting/:roomCode" element={<WaitingRoomPage />} />
          <Route path="/game/:roomCode" element={<GamePage />} />
          <Route path="/join/:roomCode" element={<JoinPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
