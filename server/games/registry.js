import hauntedManor from './haunted-manor/index.js';
import aresStation from './ares-station/index.js';

// { gameId → GameModule }
const registry = {
  'haunted-manor': hauntedManor,
  'ares-station':  aresStation,
};

export default registry;
