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
        'LOCKDOWN ACTIVE.\n\nSection 7-Alpha. Emergency override required.\nThe panel is waiting.',
      navigatorPrompt:
        'PROMETHEUS STATION — Emergency Procedures Manual, Rev. 14\n\nSection 6 — Airlock Override Codes:\n\n  Section 3-Beta  → 4471\n  Section 5-Gamma → 2293\n  Section 7-Alpha → 7291\n  Section 9-Delta → 8834',
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
        'Sector B life support is failing.\nFour relay dials. Each set 0–9.\nSomething in the station records holds the correct values.',
      navigatorPrompt:
        'Station circuit schematic — Sector B:\n\n  Relay A1 (Primary):    4\n  Relay A2 (Secondary):  4\n  Relay A3 (Tertiary):   1\n  Relay A4 (Emergency):  8\n\nNote: Sector A and C settings differ.',
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
        'The decontamination chamber is sealed.\nA symbol panel. Four inputs.\nOne sequence opens it.',
      navigatorPrompt:
        'Station Bio-Contamination Protocol, Revision 9:\n\n  Level 1: atom → pulse → delta → circuit\n  Level 2: shield → vortex → atom → helix\n  Level 3: helix → atom → shield → circuit\n  Level 4: vortex → delta → pulse → helix\n\nCurrent contamination level: 3',
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
        'The ARES mainframe.\nACCESS DENIED.\n\nCredentials required. No record remains on this terminal.',
      navigatorPrompt:
        'ARES ACCESS LOG — last 48 hours (recovered via backup channel):\n\n  [REDACTED]   logged in: ██████\n  [REDACTED]   logged in: ██████\n  Dr. V. Chen  logged in: NEXUS9\n  [REDACTED]   session timed out.\n  [SYSTEM]     LOCKDOWN INITIATED',
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
        'The navigation beacon.\nPartial frequency locked in: _ _ _ 2 7 4\nSix dials. The first three digits are unknown.',
      navigatorPrompt:
        'Navigation chart — emergency rescue beacon frequencies:\n\n  Sector 7-Gamma rescue channel: 391 ___',
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
        'The reactor core.\nFive symbols. Strict sequence.\nDeviation triggers failsafe lockout.',
      navigatorPrompt:
        'ARES Reactor Emergency Shutdown Protocol — manual override:\n\n  Phase 1: Graviton field neutralisation  → DELTA\n  Phase 2: Plasma vortex containment      → VORTEX\n  Phase 3: DNA helix stabilisation        → HELIX\n  Phase 4: Pulse dampening                → PULSE\n  Phase 5: Atomic lattice dissolution     → ATOM',
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
        'ESCAPE POD.\n\nLaunch requires an 8-digit code.\nThis terminal shows:\n\n  5  —  8  —  3  —  1  —  _  —  _  —  _  —  _',
      navigatorPrompt:
        'Encrypted transmission — Command Ship Helios:\n\n  "...6 — 2 — 9 — 4"',
      correctCode: '58316294',
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
