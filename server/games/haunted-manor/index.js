// The Haunted Manor — GameModule implementation
// Pure logic: no side effects, no I/O. All functions are synchronous.

const BRIEFING =
  'The Count sealed his estate on a moonless November night in 1847, and vanished without a trace. ' +
  'What no investigator knew — and what your partner has found in the county archives — is that ' +
  'the Count hid something in his vault before he disappeared. Something he didn\'t want found. ' +
  'One of you is inside. The other holds the records. Together you must retrace his final night: ' +
  'what he valued most, what ritual he performed, and at precisely what hour the clock last chimed. ' +
  'The vault will open for nothing less.';

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
        'The front door is sealed. A corroded plaque above the lock reads:\n\n"ENTER THE YEAR I LOCKED MY SECRETS AWAY."\n\nBeyond this door — the portrait hall, the cellar, and somewhere deeper: the vault.',
      navigatorPrompt: '',
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
        "The Count's portrait fills the hall. His coat is studded with coloured gems.\nA brass plate at the base of the frame reads:\n\n\"THE SUM OF MY COLLECTION — NO MORE, NO LESS — IS THE WEIGHT THE CLOCK REQUIRES.\"",
      navigatorPrompt: '',
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
        'A hatch in the floor. A symbol lock guards the cellar where the Count conducted his rituals.\nScratched into the stone above it:\n\n"THE NAME SPOKEN IN THE CELLAR IS THE SAME NAME THE CLOCK LAST HEARD."',
      navigatorPrompt: '',
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
        'The grandfather clock. Frozen. Its pendulum cabinet is sealed with a four-digit lock.\n\nA tarnished plate below the face reads:\n"I CHIMED ONCE — AT THE HOUR THE RITUAL DEMANDED AND THE COUNT\'S COLLECTION CONFIRMED.\nSET ME TO THAT MOMENT."\n\nBehind this clock is the vault.',
      navigatorPrompt: '',
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
        'THE VAULT — hidden behind the clock mechanism.\n\nSix digits seal what the Count locked away. Three are engraved in iron above the dial:\n\n  4  —  7  —  2\n\nThe other three were entrusted to someone outside.\nThey are somewhere in your partner\'s documents.',
      navigatorPrompt: '',
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
