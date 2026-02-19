// Blackwood Asylum — GameModule implementation
// Horror escape room. 6 puzzles. No text prompts — all info lives in images.
// Pure logic: no side effects, no I/O. All functions are synchronous.

const BRIEFING =
  'In 1972, Blackwood Asylum quietly closed. In 1987, you were committed against your will. ' +
  'Tonight you understand what the "therapy" actually is. ' +
  'One of you is still inside, trapped in Ward B. ' +
  'The other has recovered the archived documents from outside — floor plans, patient records, ' +
  'the director\'s private journal. ' +
  'There is one window before dawn. After that, the procedure begins.';

const TIME_LIMIT_MINUTES = 45;

const SYMBOLS = [
  { id: 'eye',    label: 'Eye'    },
  { id: 'skull',  label: 'Skull'  },
  { id: 'candle', label: 'Candle' },
  { id: 'chain',  label: 'Chain'  },
  { id: 'cross',  label: 'Cross'  },
  { id: 'needle', label: 'Needle' },
];

const INITIAL_PUZZLES = {

  'ward-lock': {
    status: 'available',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'combination_lock',
    label: 'Ward B Entrance',
    data: {
      pilotPrompt: '',
      navigatorPrompt: '',
      correctCode: '1408',
      caseSensitive: false,
      digits: 4,
      imageUrl: '/games/blackwood-asylum/clue-floorplan.jpg',
    },
    unlocksWhen: [],
    solvedAt: null,
    solvedBy: null,
  },

  'therapy-machine': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'symbol_sequence',
    label: 'Electroshock Machine',
    data: {
      pilotPrompt: '',
      navigatorPrompt: '',
      correctCode: 'needle,cross,skull,candle',
      caseSensitive: false,
      symbols: SYMBOLS,
      maxClicks: 4,
      symbolBasePath: '/games/blackwood-asylum',
      imageUrl: '/games/blackwood-asylum/clue-treatment.jpg',
    },
    unlocksWhen: ['ward-lock'],
    solvedAt: null,
    solvedBy: null,
  },

  'medicine-cabinet': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'navigator',
    kind: 'code_input',
    label: 'Medicine Cabinet',
    data: {
      pilotPrompt: '',
      navigatorPrompt: '',
      correctCode: '135',
      caseSensitive: false,
      placeholder: 'Enter 3-digit code…',
      imageUrl: '/games/blackwood-asylum/clue-prescription.jpg',
    },
    unlocksWhen: ['ward-lock'],
    solvedAt: null,
    solvedBy: null,
  },

  'patient-files': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'combination_lock',
    label: 'Patient Filing Cabinet',
    data: {
      pilotPrompt: '',
      navigatorPrompt: '',
      correctCode: '0731',
      caseSensitive: false,
      digits: 4,
      imageUrl: '/games/blackwood-asylum/clue-patient-record.jpg',
    },
    unlocksWhen: ['therapy-machine', 'medicine-cabinet'],
    solvedAt: null,
    solvedBy: null,
  },

  'ritual-chamber': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'symbol_sequence',
    label: 'Hidden Chamber',
    data: {
      pilotPrompt: '',
      navigatorPrompt: '',
      correctCode: 'chain,eye,needle,cross,skull',
      caseSensitive: false,
      symbols: SYMBOLS,
      maxClicks: 5,
      symbolBasePath: '/games/blackwood-asylum',
      imageUrl: '/games/blackwood-asylum/clue-ritual-page.jpg',
    },
    unlocksWhen: ['patient-files'],
    solvedAt: null,
    solvedBy: null,
  },

  'asylum-gate': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'both',
    kind: 'combination_lock',
    label: 'Asylum Gate',
    data: {
      pilotPrompt: '',
      navigatorPrompt: '',
      correctCode: '386219',
      caseSensitive: false,
      digits: 6,
      placeholder: 'Enter 6-digit code…',
      imageUrl: '/games/blackwood-asylum/clue-newspaper.jpg',
    },
    unlocksWhen: ['ritual-chamber'],
    solvedAt: null,
    solvedBy: null,
  },
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default {
  id: 'blackwood-asylum',
  displayName: 'Blackwood Asylum',
  description:
    'In 1972, Blackwood Asylum quietly closed. In 1987, you were committed there against your will. ' +
    'Tonight you understand what the "therapy" actually is. Your contact outside has recovered the archived documents. ' +
    'Escape before dawn.',
  thumbnailUrl: '/games/blackwood-asylum/thumb.jpg',
  estimatedMinutes: 45,
  difficulty: 5,
  minPlayers: 2,
  maxPlayers: 2,
  briefing: BRIEFING,
  timeLimitMinutes: TIME_LIMIT_MINUTES,

  createInitialState(roomCode) {
    return {
      gameId: 'blackwood-asylum',
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

    if (submitted !== expected) return null; // Wrong answer

    // Correct — build new state
    const newState = deepClone(state);
    newState.puzzles[puzzleId].status = 'solved';
    newState.puzzles[puzzleId].solvedAt = Date.now();
    newState.puzzles[puzzleId].solvedBy = action.role;

    // Unlock any puzzle whose dependencies are now all solved
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
        // imageUrl only goes to navigator (pilot reads from room scene)
        ...(role === 'navigator' && imageUrl ? { imageUrl } : {}),
        // symbols only go to pilot (they click the grid)
        ...(role === 'pilot' && symbols ? { symbols } : {}),
      };

      myPuzzles.push({
        puzzleId,
        kind: puzzle.kind,
        label: puzzle.label,
        status: puzzle.status,
        interactableBy: puzzle.interactableBy,
        data: displayData,
      });

      // Record partner activity for solved puzzles
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
      partnerConnected: false, // roomManager sets this
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
