// The Haunted Manor — GameModule implementation
// Pure logic: no side effects, no I/O. All functions are synchronous.

const INITIAL_PUZZLES = {
  'entrance-code': {
    status: 'available',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'code_input',
    label: 'The Entrance Door',
    data: {
      pilotPrompt:
        'The heavy oak door is sealed with a rusted combination lock. A plaque reads:\n"Enter the year this manor was sealed — only the worthy may enter."',
      navigatorPrompt:
        'On the gatehouse wall, barely legible through the moss:\n\n"In the year of the great storm, the Count sealed his estate forever.\nThe servants whispered the year: one-eight-four-seven."\n\nTell your partner the 4-digit year.',
      correctCode: '1847',
      caseSensitive: false,
      placeholder: 'Enter 4-digit year',
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
        'A grand portrait of the Count hangs in the gallery. His coat is adorned with coloured gems.\nHow many gems in total? Enter the number.',
      navigatorPrompt:
        'You find a dusty purchase ledger, dated 1847:\n\n  "Commissioned for the Count\'s portrait coat:\n   — 3 rubies (red)\n   — 5 emeralds (green)\n   — 2 sapphires (blue)"\n\nCount the total and tell your partner.',
      correctCode: '10',
      caseSensitive: false,
      placeholder: 'Enter number',
    },
    unlocksWhen: ['entrance-code'],
    solvedAt: null,
    solvedBy: null,
  },

  'cellar-word': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'code_input',
    label: 'The Cellar Lock',
    data: {
      pilotPrompt:
        'The cellar is sealed with an iron padlock that requires a 4-letter word.\nA faint carving on the door reads: "Speak my name."',
      navigatorPrompt:
        'A note pinned to the pantry wall, written in shaking hand:\n\n  "When shadows fall and ravens call,\n   speak the word that binds us all.\n   It means the void, it means the night —\n   four letters long, it shuns the light."\n\nThe word rhymes with "park". Tell your partner.',
      correctCode: 'dark',
      caseSensitive: false,
      placeholder: 'Enter 4-letter word',
    },
    unlocksWhen: ['entrance-code'],
    solvedAt: null,
    solvedBy: null,
  },

  'clock-code': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'pilot',
    kind: 'code_input',
    label: 'The Grandfather Clock',
    data: {
      pilotPrompt:
        'The grandfather clock has stopped, its hands frozen in time.\nA lock on the pendulum cabinet requires the time displayed — enter as HHMM in 24-hour format.',
      navigatorPrompt:
        'The manor diary, final entry, ink smeared:\n\n  "At half past the eleventh hour of the night,\n   when the old clock chimed its last,\n   the ritual began and the Count was taken."\n\n"Half past the eleventh hour of the night" — work out the 24-hour HHMM and tell your partner.',
      correctCode: '2330',
      caseSensitive: false,
      placeholder: 'e.g. 2330',
    },
    unlocksWhen: ['portrait-gems', 'cellar-word'],
    solvedAt: null,
    solvedBy: null,
  },

  'final-vault': {
    status: 'locked',
    visibleTo: 'both',
    interactableBy: 'both',
    kind: 'code_input',
    label: "The Count's Vault",
    data: {
      pilotPrompt:
        'THE VAULT.\n\nThree digits are engraved above the combination lock in iron numerals:\n\n  4  —  7  —  2\n\nYour partner holds the remaining three digits.\nCombine both halves and enter the full 6-digit code to open the vault — and escape.',
      navigatorPrompt:
        'Behind a loose hearthstone you find a folded scrap of parchment.\nIt reads only:\n\n  "...8 — 9 — 1"\n\nThese are the LAST three digits of the vault code.\nYour partner has the first three. Together, enter the full 6-digit sequence to escape.',
      correctCode: '472891',
      caseSensitive: false,
      placeholder: 'Enter 6-digit code',
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
  minPlayers: 2,
  maxPlayers: 2,

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
    // action: { type, payload, role }
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

      // Strip the correct answer and build role-appropriate data
      const { correctCode, pilotPrompt, navigatorPrompt, ...restData } = puzzle.data;
      const displayData = {
        ...restData,
        prompt: role === 'pilot' ? pilotPrompt : navigatorPrompt,
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

    // Sort partner activity by time
    partnerActivity.sort((a, b) => a.timestamp - b.timestamp);

    return {
      role,
      gameId: state.gameId,
      phase: state.phase,
      elapsedMs: state.startedAt ? Date.now() - state.startedAt : 0,
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
