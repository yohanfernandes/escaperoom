import { io } from 'socket.io-client';

// Single shared socket instance for the whole app.
// autoConnect: false so we control exactly when it connects.
export const socket = io({
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 10,
});
