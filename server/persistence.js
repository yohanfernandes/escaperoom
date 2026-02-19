import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true },
  gameId: String,
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'abandoned'],
    default: 'waiting',
  },
  players: {
    pilot: { socketId: String, connected: Boolean, joinedAt: Date },
    navigator: { socketId: String, connected: Boolean, joinedAt: Date },
  },
  state: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  lastActivityAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
});

RoomSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

let Room = null;
let dbConnected = false;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('[DB] MONGODB_URI not set — running with in-memory storage only');
    return;
  }
  try {
    await mongoose.connect(uri);
    Room = mongoose.model('Room', RoomSchema);
    dbConnected = true;
    console.log('[DB] Connected to MongoDB');
  } catch (err) {
    console.warn('[DB] MongoDB connection failed, using in-memory fallback:', err.message);
  }
}

export async function saveRoom(roomData) {
  if (!dbConnected) return;
  // Strip runtime-only fields that must not be persisted
  const { _timeoutId, _leaderboardEntry, ...persistable } = roomData;
  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours TTL
  await Room.findOneAndUpdate(
    { roomCode: persistable.roomCode },
    { ...persistable, lastActivityAt: new Date(), expiresAt },
    { upsert: true, new: true }
  );
}

export async function loadRoom(roomCode) {
  if (!dbConnected) return null;
  return Room.findOne({ roomCode }).lean();
}

export async function markRoomStatus(roomCode, status) {
  if (!dbConnected) return;
  await Room.findOneAndUpdate({ roomCode }, { status, lastActivityAt: new Date() });
}
