// leaderboard.js — In-memory leaderboard with optional MongoDB persistence.

import mongoose from 'mongoose';

// In-memory boards: Map<gameId, Entry[]> sorted by timeMs ASC, capped at 10
const boards = new Map();

// Per-room pending entries: Map<roomCode, { gameId, timeMs, names[] }>
const pending = new Map();

let LeaderboardEntry = null;

const LeaderboardSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  gameId: { type: String, required: true, index: true },
  names: [String],
  timeMs: { type: Number, required: true },
  completedAt: { type: Date, default: Date.now },
});

export function initLeaderboard() {
  if (mongoose.connection.readyState !== 1) return;

  LeaderboardEntry =
    mongoose.models.LeaderboardEntry ||
    mongoose.model('LeaderboardEntry', LeaderboardSchema);

  // Hydrate in-memory boards from DB
  LeaderboardEntry.find({})
    .sort({ timeMs: 1 })
    .lean()
    .then((docs) => {
      for (const doc of docs) {
        const list = boards.get(doc.gameId) || [];
        list.push({
          roomCode: doc.roomCode,
          gameId: doc.gameId,
          names: doc.names,
          timeMs: doc.timeMs,
          completedAt: doc.completedAt,
        });
        boards.set(doc.gameId, list);
      }
      // Sort and cap each game
      for (const [gameId, list] of boards.entries()) {
        list.sort((a, b) => a.timeMs - b.timeMs);
        boards.set(gameId, list.slice(0, 10));
      }
      console.log('[leaderboard] hydrated from DB');
    })
    .catch((err) => console.warn('[leaderboard] hydration failed:', err.message));
}

export function isEligible(gameId, timeMs, topN = 5) {
  const list = boards.get(gameId) || [];
  if (list.length < topN) return true;
  return timeMs < list[topN - 1].timeMs;
}

export async function addEntry(roomCode, gameId, name, timeMs) {
  // Upsert pending entry
  let entry = pending.get(roomCode);
  if (!entry) {
    entry = { roomCode, gameId, timeMs, names: [], completedAt: new Date() };
    pending.set(roomCode, entry);
  }
  if (!entry.names.includes(name)) {
    entry.names.push(name);
  }

  // Update in-memory leaderboard
  const list = boards.get(gameId) || [];
  const existing = list.find((e) => e.roomCode === roomCode);
  if (existing) {
    existing.names = [...entry.names];
  } else {
    list.push({
      roomCode,
      gameId,
      names: [...entry.names],
      timeMs,
      completedAt: entry.completedAt,
    });
  }
  list.sort((a, b) => a.timeMs - b.timeMs);
  boards.set(gameId, list.slice(0, 10));

  // Persist to MongoDB
  if (LeaderboardEntry) {
    try {
      await LeaderboardEntry.findOneAndUpdate(
        { roomCode },
        { roomCode, gameId, names: entry.names, timeMs, completedAt: entry.completedAt },
        { upsert: true, new: true }
      );
    } catch (err) {
      console.warn('[leaderboard] persist failed:', err.message);
    }
  }
}

export function getTopEntries(gameId, limit = 10) {
  return (boards.get(gameId) || []).slice(0, limit);
}

export default { initLeaderboard, isEligible, addEntry, getTopEntries };
