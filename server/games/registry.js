import hauntedManor from './haunted-manor/index.js';
import aresStation from './ares-station/index.js';
import blackwoodAsylum from './blackwood-asylum/index.js';

// { gameId → GameModule }
const registry = {
  'haunted-manor':   hauntedManor,
  'ares-station':    aresStation,
  'blackwood-asylum': blackwoodAsylum,
};

export default registry;
