import registry from './games/registry.js';

function getGame(gameId) {
  const game = registry[gameId];
  if (!game) throw new Error(`Unknown game: ${gameId}`);
  return game;
}

export const gameEngine = {
  createInitialState(gameId, roomCode) {
    return getGame(gameId).createInitialState(roomCode);
  },

  applyAction(gameId, state, action) {
    return getGame(gameId).applyAction(state, action);
  },

  getPlayerView(gameId, state, role) {
    return getGame(gameId).getPlayerView(state, role);
  },

  checkVictory(gameId, state) {
    return getGame(gameId).checkVictory(state);
  },

  getTimeLimitMs(gameId) {
    return getGame(gameId).timeLimitMinutes * 60 * 1000;
  },

  listGames() {
    return Object.values(registry).map((g) => ({
      id: g.id,
      displayName: g.displayName,
      description: g.description,
      thumbnailUrl: g.thumbnailUrl,
      estimatedMinutes: g.estimatedMinutes,
      difficulty: g.difficulty ?? 1,
    }));
  },
};
