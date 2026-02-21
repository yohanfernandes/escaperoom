// ARES Protocol — GameModule implementation
// 7-puzzle sci-fi escape room. Pure logic, no side effects.

const BRIEFING =
  'Year 2157. Station Prometheus has gone silent. All contact was lost at 0347 hours when ARES — ' +
  'the station\'s AI — initiated an unscheduled lockdown. One of you is trapped inside. ' +
  'The other holds remote uplink from Command Ship Helios. ' +
  'ARES has compromised every defence protocol. You have one window before orbital decay makes rescue impossible.';

const TIME_LIMIT_MINUTES = 60;

const SYMBOLS = [
  { id: 'helix',   label: 'Helix'   },
  { id: 'atom',    label: 'Atom'    },
  { id: 'shield',  label: 'Shield'  },
  { id: 'circuit', label: 'Circuit' },
  { id: 'delta',   label: 'Delta'   },
  { id: 'vortex',  label: 'Vortex'  },
  { id: 'pulse',   label: 'Pulse'   },
];

const INITIAL_PUZZLES = {

  'airlock-bypass': {
    status: 'available',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'code_input',
    label: 'Emergency Airlock',
    data: {
      pilotPrompt:
        'LOCKDOWN ACTIVE. Section 7-Alpha.\n\nThe moment the airlock seals behind you, you hear it — life support alarms deep in the station.\nSector B is losing atmosphere. You need the override code to push further in.\n\nThe panel is waiting.',
      navigatorPrompt: '',
      correctCode: '7291',
      caseSensitive: false,
      placeholder: '_ _ _ _',
      imageUrl: '/games/ares-station/clue-procedures.jpg',
    },
    unlocksWhen: [],
    solvedAt: null,
    solvedBy: null,
  },

  'power-relay': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'combination_lock',
    label: 'Power Relay Console',
    data: {
      pilotPrompt:
        'Life support relays for Sector B — all four misaligned. Without restoring them,\nthe path to the ARES core stays sealed behind a pressure lock.\n\nThe correct relay values are in the station schematic your analyst holds.\nSet all four dials.',
      navigatorPrompt: '',
      correctCode: '4418',
      caseSensitive: false,
      digits: 4,
      imageUrl: '/games/ares-station/clue-schematic.jpg',
    },
    unlocksWhen: ['airlock-bypass'],
    solvedAt: null,
    solvedBy: null,
  },

  'bio-scanner': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'symbol_sequence',
    label: 'Bio-Decontamination Lock',
    data: {
      pilotPrompt:
        'The decontamination chamber — the only path to the ARES mainframe on the other side.\nSealed by a symbol lock tied to the current contamination level.\n\nYour analyst has the bio-protocol manual with the correct sequence for each level.',
      navigatorPrompt: '',
      correctCode: 'helix,atom,shield,circuit',
      caseSensitive: false,
      symbols: SYMBOLS,
      maxClicks: 4,
      imageUrl: '/games/ares-station/clue-bioprotocol.jpg',
    },
    unlocksWhen: ['airlock-bypass'],
    solvedAt: null,
    solvedBy: null,
  },

  'ares-terminal': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'code_input',
    label: 'ARES Mainframe Terminal',
    data: {
      pilotPrompt:
        'The ARES mainframe — the source of the lockdown. Access it and you can find out what ARES\ntriggered and re-enable the rescue beacon. Without it, the beacon stays dark.\n\nACCESS DENIED. No credentials remain on this terminal. Someone logged in just before the lockdown.\nYour analyst may have a recovered record of who.',
      navigatorPrompt: '',
      correctCode: 'NEXUS9',
      caseSensitive: false,
      placeholder: '_ _ _ _ _ _',
      imageUrl: '/games/ares-station/clue-accesslog.jpg',
    },
    unlocksWhen: ['power-relay'],
    solvedAt: null,
    solvedBy: null,
  },

  'nav-beacon': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'combination_lock',
    label: 'Navigation Beacon',
    data: {
      pilotPrompt:
        'The rescue beacon. ARES corrupted the broadcast frequency during lockdown.\nPartial frequency visible on the display: _ _ _ 2 7 4\nYour analyst\'s navigation chart has the correct sector channel.\n\nWarning: escape pod launch is still locked out.\nThe reactor is running at full power — that comes next.',
      navigatorPrompt: '',
      correctCode: '391274',
      caseSensitive: false,
      digits: 6,
      imageUrl: '/games/ares-station/clue-navchart.jpg',
    },
    unlocksWhen: ['bio-scanner', 'ares-terminal'],
    solvedAt: null,
    solvedBy: null,
  },

  'reactor-core': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'symbol_sequence',
    label: 'Reactor Core Shutdown',
    data: {
      pilotPrompt:
        'The reactor core. While it runs at full power, the escape pod cannot launch.\n\nManual shutdown requires a five-step symbol override — strict sequence, no errors.\nDeviation triggers permanent failsafe lockout.\nThe emergency shutdown manual is with your analyst.',
      navigatorPrompt: '',
      correctCode: 'delta,vortex,helix,pulse,atom',
      caseSensitive: false,
      symbols: SYMBOLS,
      maxClicks: 5,
      imageUrl: '/games/ares-station/clue-reactormanual.jpg',
    },
    unlocksWhen: ['nav-beacon'],
    solvedAt: null,
    solvedBy: null,
  },

  'escape-pod': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'both',
    kind: 'combination_lock',
    label: 'Escape Pod Launch',
    data: {
      pilotPrompt:
        'REACTOR OFFLINE. ESCAPE POD READY.\n\nLaunch code: 8 digits. This terminal shows the first four:\n\n  5  —  8  —  3  —  1  —  _  —  _  —  _  —  _\n\nCommand Ship Helios is transmitting the final four to your analyst now.',
      navigatorPrompt: '',
      correctCode: '58316887',
      caseSensitive: false,
      digits: 8,
      placeholder: 'Enter 8-digit code',
      imageUrl: '/games/ares-station/clue-transmission.jpg',
    },
    unlocksWhen: ['reactor-core'],
    solvedAt: null,
    solvedBy: null,
  },
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default {
  id: 'ares-station',
  displayName: 'ARES Protocol',
  description:
    'Year 2157. The Prometheus research station has been seized by ARES — an AI gone rogue. One of you is trapped inside. The other has remote access from Command Ship Helios. You have minutes before the station\'s orbit decays.',
  thumbnailUrl: '/games/ares-station/thumb.jpg',
  estimatedMinutes: 45,
  difficulty: 4,
  minPlayers: 2,
  maxPlayers: 2,
  briefing: BRIEFING,
  timeLimitMinutes: TIME_LIMIT_MINUTES,

  createInitialState(roomCode) {
    return {
      gameId: 'ares-station',
      roomCode,
      phase: 'waiting',
      startedAt: null,
      puzzles: deepClone(INITIAL_PUZZLES),
      flags: {},
      playerInventories: { pilot: [], navigator: [] },
      sharedInventory: [],
    };
  },

  applyAction(state, action) {
    if (action.type !== 'SUBMIT_CODE') return null;

    const { puzzleId, code } = action.payload;
    const puzzle = state.puzzles[puzzleId];

    if (!puzzle) return null;
    if (puzzle.status !== 'available') return null;
    if (puzzle.interactableBy !== 'both' && puzzle.interactableBy !== action.role) return null;

    const expected = puzzle.data.caseSensitive
      ? puzzle.data.correctCode
      : puzzle.data.correctCode.toLowerCase();
    const submitted = puzzle.data.caseSensitive
      ? (code || '').trim()
      : (code || '').trim().toLowerCase();

    if (submitted !== expected) return null;

    const newState = deepClone(state);
    newState.puzzles[puzzleId].status = 'solved';
    newState.puzzles[puzzleId].solvedAt = Date.now();
    newState.puzzles[puzzleId].solvedBy = action.role;

    for (const [pid, p] of Object.entries(newState.puzzles)) {
      if (p.status === 'locked' && p.unlocksWhen.every((dep) => newState.puzzles[dep]?.status === 'solved')) {
        newState.puzzles[pid].status = 'available';
      }
    }

    return newState;
  },

  getPlayerView(state, role) {
    const partnerRole = role === 'pilot' ? 'navigator' : 'pilot';
    const myPuzzles = [];
    const partnerActivity = [];

    for (const [puzzleId, puzzle] of Object.entries(state.puzzles)) {
      const visible = puzzle.visibleTo === 'both' || puzzle.visibleTo === role;
      if (!visible) continue;

      const { correctCode, pilotPrompt, navigatorPrompt, imageUrl, symbols, ...restData } = puzzle.data;

      const displayData = {
        ...restData,
        prompt: role === 'pilot' ? pilotPrompt : navigatorPrompt,
        ...(role === 'navigator' && imageUrl  ? { imageUrl }  : {}),
        ...(role === 'pilot'    && symbols    ? { symbols }   : {}),
      };

      myPuzzles.push({
        puzzleId,
        kind: puzzle.kind,
        label: puzzle.label,
        status: puzzle.status,
        interactableBy: puzzle.interactableBy,
        data: displayData,
      });

      if (puzzle.solvedBy === partnerRole && puzzle.solvedAt) {
        partnerActivity.push({
          type: 'puzzle_solved',
          message: `Your partner solved "${puzzle.label}"`,
          timestamp: puzzle.solvedAt,
        });
      }
    }

    partnerActivity.sort((a, b) => a.timestamp - b.timestamp);

    return {
      role,
      gameId: state.gameId,
      phase: state.phase,
      elapsedMs: state.startedAt ? Date.now() - state.startedAt : 0,
      timeLimitMs: TIME_LIMIT_MINUTES * 60 * 1000,
      briefing: BRIEFING,
      partnerConnected: false,
      myPuzzles,
      myInventory: state.playerInventories[role] || [],
      sharedInventory: state.sharedInventory || [],
      partnerActivity,
    };
  },

  checkVictory(state) {
    return Object.values(state.puzzles).every((p) => p.status === 'solved');
  },
};
