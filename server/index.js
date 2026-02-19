import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { roomManager } from './roomManager.js';
import { connectDB } from './persistence.js';
import leaderboard from './leaderboard.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Give roomManager access to the io instance (needed for timeout-triggered STATE_UPDATEs)
roomManager.setIo(io);

const PORT = process.env.PORT || 3001;
const BASE_URL = process.env.BASE_URL || `http://localhost:5173`;

// ── Static files (production) ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get(/^(?!\/api|\/socket\.io).*/, (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
}

// ── REST endpoints ─────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/games', (_req, res) => {
  res.json(roomManager.listGames());
});

app.get('/api/leaderboard/:gameId', (req, res) => {
  res.json(leaderboard.getTopEntries(req.params.gameId));
});

// ── Socket.io ──────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[socket] connect   ${socket.id}`);

  // ── CREATE_ROOM ────────────────────────────────────────────────────────
  socket.on('CREATE_ROOM', async ({ gameId }) => {
    try {
      const { roomCode } = await roomManager.createRoom(gameId, socket.id);
      socket.join(roomCode);
      socket.emit('ROOM_CREATED', {
        roomCode,
        role: 'pilot',
        shareUrl: `${BASE_URL}/join/${roomCode}`,
      });
      console.log(`[room] created ${roomCode} (${gameId}) by ${socket.id}`);
    } catch (err) {
      socket.emit('ERROR', { message: err.message });
    }
  });

  // ── JOIN_ROOM ──────────────────────────────────────────────────────────
  socket.on('JOIN_ROOM', async ({ roomCode }) => {
    try {
      await roomManager.joinRoom(roomCode, socket.id);
      socket.join(roomCode);

      socket.emit('ROOM_JOINED', { roomCode, role: 'navigator' });

      // Notify pilot that their partner arrived
      socket.to(roomCode).emit('PARTNER_CONNECTED');

      // Start the briefing phase, get initial views for both players
      const views = await roomManager.startBriefing(roomCode);

      const room = roomManager.getRoom(roomCode);
      const pilotSocketId = room?.players.pilot?.socketId;
      const navigatorSocketId = room?.players.navigator?.socketId;

      if (pilotSocketId) io.to(pilotSocketId).emit('STATE_UPDATE', views.pilot);
      if (navigatorSocketId) io.to(navigatorSocketId).emit('STATE_UPDATE', views.navigator);

      console.log(`[room] ${roomCode} briefing — pilot: ${pilotSocketId}, nav: ${navigatorSocketId}`);
    } catch (err) {
      socket.emit('ERROR', { message: err.message });
    }
  });

  // ── REJOIN_ROOM ────────────────────────────────────────────────────────
  socket.on('REJOIN_ROOM', async ({ roomCode, role }) => {
    try {
      await roomManager.rejoinRoom(roomCode, role, socket.id);
      socket.join(roomCode);

      socket.emit('ROOM_REJOINED', { roomCode, role });

      // Notify partner
      socket.to(roomCode).emit('PARTNER_CONNECTED');

      // Send current state to rejoining player
      const view = roomManager.getPlayerView(roomCode, role);
      if (view) socket.emit('STATE_UPDATE', view);

      console.log(`[room] ${roomCode} rejoined as ${role} by ${socket.id}`);
    } catch (err) {
      socket.emit('ERROR', { message: err.message });
      socket.emit('ROOM_EXPIRED');
    }
  });

  // ── ACTION ─────────────────────────────────────────────────────────────
  socket.on('ACTION', async ({ roomCode, type, payload }) => {
    try {
      const result = await roomManager.handleAction(roomCode, socket.id, type, payload);

      if (!result.success) {
        socket.emit('ACTION_REJECTED', { reason: result.reason });
        return;
      }

      const { views, pilotSocketId, navigatorSocketId } = result;
      if (pilotSocketId) io.to(pilotSocketId).emit('STATE_UPDATE', views.pilot);
      if (navigatorSocketId) io.to(navigatorSocketId).emit('STATE_UPDATE', views.navigator);
    } catch (err) {
      console.error('[ACTION] error:', err);
      socket.emit('ACTION_REJECTED', { reason: 'Server error' });
    }
  });

  // ── SUBMIT_NAME ────────────────────────────────────────────────────────
  socket.on('SUBMIT_NAME', async ({ roomCode, name }) => {
    try {
      const result = await roomManager.submitLeaderboardName(roomCode, socket.id, name);
      if (result.success) {
        socket.emit('LEADERBOARD_ACCEPTED');
      } else {
        socket.emit('LEADERBOARD_REJECTED', { reason: result.reason });
      }
    } catch (err) {
      console.error('[SUBMIT_NAME] error:', err);
      socket.emit('LEADERBOARD_REJECTED', { reason: 'Server error' });
    }
  });

  // ── disconnect ─────────────────────────────────────────────────────────
  socket.on('disconnect', async () => {
    console.log(`[socket] disconnect ${socket.id}`);
    const roomCode = await roomManager.handleDisconnect(socket.id);
    if (roomCode) {
      socket.to(roomCode).emit('PARTNER_DISCONNECTED');
    }
  });
});

// ── Start ──────────────────────────────────────────────────────────────────
async function start() {
  await connectDB();
  leaderboard.initLeaderboard();
  httpServer.listen(PORT, () => {
    console.log(`[server] listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
