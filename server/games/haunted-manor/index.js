// The Haunted Manor — GameModule implementation
// Pure logic: no side effects, no I/O. All functions are synchronous.

const BRIEFING =
  'The Count sealed his estate on a moonless November night in 1847, and vanished. ' +
  'Three generations of investigators have entered — none have returned. ' +
  'You are the first team to attempt a full sweep of the manor, armed with nothing but each other. ' +
  'The estate still breathes, they say. Don\'t let it swallow you.';

const TIME_LIMIT_MINUTES = 45;

const SYMBOLS = [
  { id: 'moon',    label: 'Moon'    },
  { id: 'raven',   label: 'Raven'   },
  { id: 'flame',   label: 'Flame'   },
  { id: 'eye',     label: 'Eye'     },
  { id: 'skull',   label: 'Skull'   },
  { id: 'serpent', label: 'Serpent' },
];

const INITIAL_PUZZLES = {
  'entrance-code': {
    status: 'available',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'code_input',
    label: 'The Entrance Door',
    data: {
      pilotPrompt:
        'The heavy oak door is sealed with a rusted combination lock.\nA corroded plaque reads:\n\n"Enter the year this manor was sealed — only the worthy may enter."',
      navigatorPrompt:
        'On the gatehouse wall, barely legible through the moss:\n\n"In the year of the great storm, the Count sealed his estate forever.\nThe servants whispered the year: one-eight-four-seven."',
      correctCode: '1847',
      caseSensitive: false,
      placeholder: 'Enter 4-digit year',
      imageUrl: '/games/haunted-manor/clue-gatehouse.jpg',
    },
    unlocksWhen: [],
    solvedAt: null,
    solvedBy: null,
  },

  'portrait-gems': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'code_input',
    label: 'Portrait Gallery',
    data: {
      pilotPrompt:
        'A grand portrait of the Count hangs in the gallery. His coat is adorned with coloured gems.\nSomething about them feels deliberate.',
      navigatorPrompt:
        "A dusty purchase ledger, dated 1847:\n\n  \"Commissioned for the Count's portrait coat:\n   — 3 rubies (red)\n   — 5 emeralds (green)\n   — 2 sapphires (blue)\"",
      correctCode: '10',
      caseSensitive: false,
      placeholder: 'Enter number',
      imageUrl: '/games/haunted-manor/clue-ledger.jpg',
    },
    unlocksWhen: ['entrance-code'],
    solvedAt: null,
    solvedBy: null,
  },

  'cellar-word': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'symbol_sequence',
    label: 'The Cellar Lock',
    data: {
      pilotPrompt:
        'The cellar door is sealed with an ancient symbol lock.\nFour carved recesses, each waiting for the right symbol.\nThe door yields only to the correct sequence.',
      navigatorPrompt:
        'A parchment cipher key, pinned to the wall.\nIt maps symbols to letters.\n\n"Speak my name. Four letters. It shuns the light."',
      correctCode: 'moon,raven,flame,eye',
      caseSensitive: false,
      symbols: SYMBOLS,
      maxClicks: 4,
      imageUrl: '/games/haunted-manor/clue-cipher.jpg',
    },
    unlocksWhen: ['entrance-code'],
    solvedAt: null,
    solvedBy: null,
  },

  'clock-code': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'combination_lock',
    label: 'The Grandfather Clock',
    data: {
      pilotPrompt:
        'The grandfather clock has stopped.\nIts hands are frozen.\nThe pendulum cabinet is locked.',
      navigatorPrompt:
        'The manor diary, final entry, ink smeared:\n\n  "At half past the eleventh hour of the night,\n   when the old clock chimed its last,\n   the ritual began and the Count was taken."',
      correctCode: '2330',
      caseSensitive: false,
      digits: 4,
      imageUrl: '/games/haunted-manor/clue-diary.jpg',
    },
    unlocksWhen: ['portrait-gems', 'cellar-word'],
    solvedAt: null,
    solvedBy: null,
  },

  'final-vault': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'both',
    kind: 'combination_lock',
    label: "The Count's Vault",
    data: {
      pilotPrompt:
        'THE VAULT.\n\nThree digits are engraved above the combination lock in iron numerals:\n\n  4  —  7  —  2',
      navigatorPrompt:
        'Behind a loose hearthstone — a folded scrap of parchment.\nIt reads only:\n\n  "...8 — 9 — 1"',
      correctCode: '472891',
      caseSensitive: false,
      digits: 6,
      placeholder: 'Enter 6-digit code',
      imageUrl: '/games/haunted-manor/clue-hearthstone.jpg',
    },
    unlocksWhen: ['clock-code'],
    solvedAt: null,
    solvedBy: null,
  },
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default {
  id: 'haunted-manor',
  displayName: 'The Haunted Manor',
  description:
    'The Count sealed his estate in 1847 and was never seen again. You and your partner are trapped inside. Work together — one explores the manor, one deciphers the clues — before the manor claims you too.',
  thumbnailUrl: '/games/haunted-manor/thumb.jpg',
  estimatedMinutes: 30,
  difficulty: 2,
  minPlayers: 2,
  maxPlayers: 2,
  briefing: BRIEFING,
  timeLimitMinutes: TIME_LIMIT_MINUTES,

  createInitialState(roomCode) {
    return {
      gameId: 'haunted-manor',
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

      // Strip secret fields and build role-appropriate data
      const { correctCode, pilotPrompt, navigatorPrompt, imageUrl, symbols, ...restData } = puzzle.data;

      const displayData = {
        ...restData,
        prompt: role === 'pilot' ? pilotPrompt : navigatorPrompt,
        // imageUrl only goes to navigator (pilot sees the room scene, not clue images)
        ...(role === 'navigator' && imageUrl ? { imageUrl } : {}),
        // symbols only go to pilot (they click the symbol grid)
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
