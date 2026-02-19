import { useEffect, useRef } from 'react';

/**
 * Manages all in-game audio: ambient loops, solve/error sfx, urgency tick, end stings.
 * Audio is only started after `audioUnlocked` becomes true (requires a user gesture).
 */
export function useGameAudio({ gameId, phase, myPuzzles, remainingMs, audioUnlocked, lastRejection }) {
  const ambientRef = useRef(null);
  const tickRef    = useRef(null);
  const prevPhaseRef   = useRef(phase);
  const prevSolvedRef  = useRef(new Set());

  // ── Ambient loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!audioUnlocked) return;

    if (phase === 'playing') {
      if (!ambientRef.current) {
        const audio = new Audio(`/audio/ambient-${gameId}.mp3`);
        audio.loop = true;
        audio.volume = 0.35;
        audio.play().catch(() => {});
        ambientRef.current = audio;
      }
    } else {
      if (ambientRef.current) {
        ambientRef.current.pause();
        ambientRef.current = null;
      }
    }

    return () => {
      // cleanup runs when deps change; loops are kept intentionally across renders
      // they are stopped in the end-state effect below
    };
  }, [phase, gameId, audioUnlocked]);

  // ── Urgency tick loop (<5 min remaining) ───────────────────────────────────
  useEffect(() => {
    if (!audioUnlocked || phase !== 'playing') {
      if (tickRef.current) {
        tickRef.current.pause();
        tickRef.current = null;
        if (ambientRef.current) ambientRef.current.volume = 0.35;
      }
      return;
    }

    const urgent = remainingMs !== null && remainingMs < 300_000 && remainingMs > 0;

    if (urgent && !tickRef.current) {
      if (ambientRef.current) ambientRef.current.volume = 0.1;
      const tick = new Audio('/audio/tick.mp3');
      tick.loop = true;
      tick.volume = 0.55;
      tick.play().catch(() => {});
      tickRef.current = tick;
    } else if (!urgent && tickRef.current) {
      tickRef.current.pause();
      tickRef.current = null;
      if (ambientRef.current) ambientRef.current.volume = 0.35;
    }
  }, [remainingMs, phase, audioUnlocked]);

  // ── Solve sound ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!audioUnlocked) return;

    const currentSolved = new Set(
      (myPuzzles || []).filter((p) => p.status === 'solved').map((p) => p.puzzleId)
    );
    const prev = prevSolvedRef.current;

    for (const id of currentSolved) {
      if (!prev.has(id)) {
        const sfx = new Audio('/audio/solve.mp3');
        sfx.volume = 0.65;
        sfx.play().catch(() => {});
        break; // one chime per update
      }
    }
    prevSolvedRef.current = currentSolved;
  }, [myPuzzles, audioUnlocked]);

  // ── Error sound ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!audioUnlocked || !lastRejection) return;
    const sfx = new Audio('/audio/error.mp3');
    sfx.volume = 0.55;
    sfx.play().catch(() => {});
  }, [lastRejection, audioUnlocked]);

  // ── Victory / failure stings ───────────────────────────────────────────────
  useEffect(() => {
    if (!audioUnlocked) return;

    const prev = prevPhaseRef.current;
    prevPhaseRef.current = phase;

    if (phase === 'victory' && prev !== 'victory') {
      if (ambientRef.current) { ambientRef.current.pause(); ambientRef.current = null; }
      if (tickRef.current)    { tickRef.current.pause();    tickRef.current = null; }
      const sfx = new Audio('/audio/victory.mp3');
      sfx.volume = 0.8;
      sfx.play().catch(() => {});
    }

    if (phase === 'failed' && prev !== 'failed') {
      if (ambientRef.current) { ambientRef.current.pause(); ambientRef.current = null; }
      if (tickRef.current)    { tickRef.current.pause();    tickRef.current = null; }
      const sfx = new Audio('/audio/failure.mp3');
      sfx.volume = 0.8;
      sfx.play().catch(() => {});
    }
  }, [phase, audioUnlocked]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (ambientRef.current) { ambientRef.current.pause(); ambientRef.current = null; }
      if (tickRef.current)    { tickRef.current.pause();    tickRef.current = null; }
    };
  }, []);
}
