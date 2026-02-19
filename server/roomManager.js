// roomManager.js — Room lifecycle, player assignment, action dispatch.
// In-memory storage for Phase 1-2; persistence.js handles MongoDB sync.

import { gameEngine } from './gameEngine.js';
import { saveRoom, loadRoom } from './persistence.js';
import leaderboard from './leaderboard.js';

const WORDS = ['TIGER', 'COBRA', 'RAVEN', 'GHOST', 'STORM', 'FLAME', 'FROST', 'VIPER', 'EMBER', 'SHADE'];

function generateRoomCode() {
  const word = WORDS[Math.floor(Math.random() * WORDS.length)];
  const num = String(Math.floor(Math.random() * 90 + 10));
  return word + num;
}

// In-memory store: roomCode → room
const rooms = new Map();

// socketId → roomCode (for fast disconnect lookup)
const socketToRoom = new Map();

// Socket.io instance reference (set by server/index.js)
let ioRef = null;

function getRoleBySocketId(room, socketId) {
  if (room.players.pilot?.socketId === socketId) return 'pilot';
  if (room.players.navigator?.socketId === socketId) return 'navigator';
  return null;
}

function buildViews(room, extra = {}) {
  const { gameId, state, players } = room;
  const isNavigatorConnected = !!(players.navigator?.socketId && players.navigator?.connected);
  const isPilotConnected = !!(players.pilot?.socketId && players.pilot?.connected);

  const pilotView = gameEngine.getPlayerView(gameId, state, 'pilot');
  pilotView.partnerConnected = isNavigatorConnected;
  Object.assign(pilotView, extra);

  const navView = gameEngine.getPlayerView(gameId, state, 'navigator');
  navView.partnerConnected = isPilotConnected;
  Object.assign(navView, extra);

  return { pilot: pilotView, navigator: navView };
}

export const roomManager = {
  setIo(io) {
    ioRef = io;
  },

  async createRoom(gameId, socketId) {
    // Validate game exists
    gameEngine.listGames(); // throws if engine broken
    const games = gameEngine.listGames();
    if (!games.find((g) => g.id === gameId)) {
      throw new Error(`Unknown game: ${gameId}`);
    }

    let roomCode;
    let attempts = 0;
    do {
      roomCode = generateRoomCode();
      attempts++;
      if (attempts > 20) throw new Error('Could not generate unique room code');
    } while (rooms.has(roomCode));

    const state = gameEngine.createInitialState(gameId, roomCode);

    const room = {
      roomCode,
      gameId,
      status: 'waiting',
      players: {
        pilot: { socketId, connected: true, joinedAt: new Date() },
        navigator: null,
      },
      state,
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    rooms.set(roomCode, room);
    socketToRoom.set(socketId, roomCode);

    await saveRoom(room);
    return { roomCode };
  },

  async joinRoom(roomCode, socketId) {
    let room = rooms.get(roomCode);

    // If not in memory, try to restore from DB (reconnect scenario)
    if (!room) {
      const persisted = await loadRoom(roomCode);
      if (persisted) {
        rooms.set(roomCode, persisted);
        room = persisted;
      }
    }

    if (!room) throw new Error('Room not found');
    if (room.status === 'completed') throw new Error('This game has already ended');
    if (room.players.navigator?.socketId && room.players.navigator?.connected) {
      throw new Error('Room is full');
    }

    room.players.navigator = { socketId, connected: true, joinedAt: new Date() };
    room.status = 'active';
    room.lastActivityAt = new Date();

    socketToRoom.set(socketId, roomCode);

    await saveRoom(room);
    return { room };
  },

  async startBriefing(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) throw new Error('Room not found');

    room.state.phase = 'briefing';
    room.lastActivityAt = new Date();

    await saveRoom(room);
    return buildViews(room);
  },

  // Kept for backward compat (not used — replaced by startBriefing)
  async startGame(roomCode) {
    const room = rooms.get(roomCode);
    if (!room) throw new Error('Room not found');

    room.state.phase = 'playing';
    room.state.startedAt = Date.now();
    room.lastActivityAt = new Date();

    await saveRoom(room);
    return buildViews(room);
  },

  async rejoinRoom(roomCode, role, socketId) {
    let room = rooms.get(roomCode);

    if (!room) {
      const persisted = await loadRoom(roomCode);
      if (persisted) {
        rooms.set(roomCode, persisted);
        room = persisted;
      }
    }

    if (!room) throw new Error('Room not found or expired');
    if (room.status === 'completed') throw new Error('This game has already ended');

    const existingPlayer = room.players[role];
    if (!existingPlayer) throw new Error('Role not found in this room');

    // Update the socket ID for the reconnecting player
    existingPlayer.socketId = socketId;
    existingPlayer.connected = true;
    room.lastActivityAt = new Date();

    socketToRoom.set(socketId, roomCode);

    await saveRoom(room);
    return { room };
  },

  async handleAction(roomCode, socketId, type, payload) {
    const room = rooms.get(roomCode);
    if (!room) return { success: false, reason: 'Room not found' };

    // ── START_MISSION intercept (before phase guard) ───────────────────────
    if (type === 'START_MISSION') {
      if (room.state.phase !== 'briefing') {
        return { success: false, reason: 'Not in briefing' };
      }
      if (getRoleBySocketId(room, socketId) !== 'pilot') {
        return { success: false, reason: 'Only the Pilot can begin the mission' };
      }

      room.state.phase = 'playing';
      room.state.startedAt = Date.now();
      room.lastActivityAt = new Date();

      // Schedule failure timeout
      const timeLimitMs = gameEngine.getTimeLimitMs(room.gameId);
      room._timeoutId = setTimeout(async () => {
        const r = rooms.get(roomCode);
        if (!r || r.state.phase !== 'playing') return;
        r.state.phase = 'failed';
        r.status = 'completed';
        r._timeoutId = null;
        await saveRoom(r);
        const views = buildViews(r);
        const ps = r.players.pilot?.socketId;
        const ns = r.players.navigator?.socketId;
        if (ps && ioRef) ioRef.to(ps).emit('STATE_UPDATE', views.pilot);
        if (ns && ioRef) ioRef.to(ns).emit('STATE_UPDATE', views.navigator);
      }, timeLimitMs);

      await saveRoom(room);
      const views = buildViews(room);
      return {
        success: true,
        views,
        pilotSocketId: room.players.pilot?.socketId,
        navigatorSocketId: room.players.navigator?.socketId,
        victory: false,
      };
    }

    if (room.state.phase !== 'playing') return { success: false, reason: 'Game is not in progress' };

    const actingRole = getRoleBySocketId(room, socketId);
    if (!actingRole) return { success: false, reason: 'Not authorized' };

    const newState = gameEngine.applyAction(room.gameId, room.state, {
      type,
      payload,
      role: actingRole,
    });

    if (newState === null) return { success: false, reason: 'Incorrect code — try again.' };

    // Check for victory
    if (gameEngine.checkVictory(room.gameId, newState)) {
      newState.phase = 'victory';
    }

    room.state = newState;
    room.lastActivityAt = new Date();

    if (room.state.phase === 'victory') {
      room.status = 'completed';
      clearTimeout(room._timeoutId);
      room._timeoutId = null;

      const timeMs = Date.now() - newState.startedAt;
      room._leaderboardEntry = { gameId: room.gameId, timeMs, names: [], submittedRoles: [] };
      const eligible = leaderboard.isEligible(room.gameId, timeMs);
      await saveRoom(room);
      const views = buildViews(room, { leaderboardEligible: eligible, timeMs });
      return {
        success: true,
        views,
        pilotSocketId: room.players.pilot?.socketId,
        navigatorSocketId: room.players.navigator?.socketId,
        victory: true,
      };
    }

    await saveRoom(room);
    const views = buildViews(room);
    return {
      success: true,
      views,
      pilotSocketId: room.players.pilot?.socketId,
      navigatorSocketId: room.players.navigator?.socketId,
      victory: false,
    };
  },

  async submitLeaderboardName(roomCode, socketId, name) {
    const room = rooms.get(roomCode);
    if (!room) return { success: false, reason: 'Room not found' };
    if (room.state.phase !== 'victory') return { success: false, reason: 'Game not in victory state' };

    const role = getRoleBySocketId(room, socketId);
    if (!role) return { success: false, reason: 'Not authorized' };

    const entry = room._leaderboardEntry;
    if (!entry) return { success: false, reason: 'No leaderboard entry for this room' };
    if (entry.submittedRoles.includes(role)) return { success: false, reason: 'Already submitted' };

    const trimmedName = (name || '').trim().slice(0, 30);
    if (!trimmedName) return { success: false, reason: 'Name cannot be empty' };

    entry.submittedRoles.push(role);
    await leaderboard.addEntry(roomCode, entry.gameId, trimmedName, entry.timeMs);

    return { success: true };
  },

  getPlayerView(roomCode, role) {
    const room = rooms.get(roomCode);
    if (!room) return null;
    const view = gameEngine.getPlayerView(room.gameId, room.state, role);
    const partnerRole = role === 'pilot' ? 'navigator' : 'pilot';
    view.partnerConnected = room.players[partnerRole]?.connected ?? false;
    // Re-attach leaderboard fields if in victory state
    if (room._leaderboardEntry) {
      view.leaderboardEligible = leaderboard.isEligible(room.gameId, room._leaderboardEntry.timeMs);
      view.timeMs = room._leaderboardEntry.timeMs;
    }
    return view;
  },

  async handleDisconnect(socketId) {
    const roomCode = socketToRoom.get(socketId);
    if (!roomCode) return null;

    socketToRoom.delete(socketId);

    const room = rooms.get(roomCode);
    if (!room) return null;

    const role = getRoleBySocketId(room, socketId);
    if (role && room.players[role]) {
      room.players[role].connected = false;
    }

    room.lastActivityAt = new Date();
    await saveRoom(room);

    return roomCode;
  },

  listGames() {
    return gameEngine.listGames();
  },

  getRoom(roomCode) {
    return rooms.get(roomCode) || null;
  },
};
