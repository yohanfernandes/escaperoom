// roomManager.js — Room lifecycle, player assignment, action dispatch.
// In-memory storage for Phase 1-2; persistence.js handles MongoDB sync.

import { gameEngine } from './gameEngine.js';
import { saveRoom, loadRoom } from './persistence.js';

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

function getRoleBySocketId(room, socketId) {
  if (room.players.pilot?.socketId === socketId) return 'pilot';
  if (room.players.navigator?.socketId === socketId) return 'navigator';
  return null;
}

function buildViews(room) {
  const { gameId, state, players } = room;
  // From each player's perspective, "partnerConnected" = is the OTHER player connected?
  const isNavigatorConnected = !!(players.navigator?.socketId && players.navigator?.connected);
  const isPilotConnected = !!(players.pilot?.socketId && players.pilot?.connected);

  const pilotView = gameEngine.getPlayerView(gameId, state, 'pilot');
  pilotView.partnerConnected = isNavigatorConnected; // pilot's partner is navigator

  const navView = gameEngine.getPlayerView(gameId, state, 'navigator');
  navView.partnerConnected = isPilotConnected; // navigator's partner is pilot

  return { pilot: pilotView, navigator: navView };
}

export const roomManager = {
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
    if (room.state.phase === 'victory') room.status = 'completed';

    await saveRoom(room);

    const views = buildViews(room);
    const pilotSocketId = room.players.pilot?.socketId;
    const navigatorSocketId = room.players.navigator?.socketId;

    return {
      success: true,
      views,
      pilotSocketId,
      navigatorSocketId,
      victory: room.state.phase === 'victory',
    };
  },

  getPlayerView(roomCode, role) {
    const room = rooms.get(roomCode);
    if (!room) return null;
    const view = gameEngine.getPlayerView(room.gameId, room.state, role);
    const partnerRole = role === 'pilot' ? 'navigator' : 'pilot';
    view.partnerConnected = room.players[partnerRole]?.connected ?? false;
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
