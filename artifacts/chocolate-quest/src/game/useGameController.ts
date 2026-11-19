import { useCallback, useEffect, useReducer, useRef } from "react";
import { GAME_CONFIG } from "./config";
import { evaluateRunVerdict } from "./cocoaLoyalty";
import { createInitialState, gameReducer } from "./reducer";
import {
  playAbilitySound,
  playAnswerSound,
  playBossIntroSound,
  playBossStartSound,
  playResultVerdictAudio,
  playSkipSound,
  playSoundEnabledChime,
  playStartSound,
  playTimerTickSound,
  playTimeoutSound,
  stopAllAudio,
} from "./sound";
import type {
  AbilityId,
  AcademicLevel,
  GameController,
  GamePhase,
} from "./types";

function createRunId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function useGameController(): GameController {
  const [state, dispatch] = useReducer(
    gameReducer,
    undefined,
    createInitialState,
  );
  const prevPhaseRef = useRef<GamePhase>(state.phase);
  const lastTickSecondRef = useRef<number | null>(null);

  const showLevelSelect = useCallback(() => {
    dispatch({ type: "SHOW_LEVELS" });
  }, []);

  const startRun = useCallback((level: AcademicLevel, startingSkill?: number) => {
    dispatch({
      type: "SET_LEVEL",
      level,
      seed: Math.floor(Math.random() * 0xffff_ffff) || 0x43a2_1f57,
      runId: createRunId(),
      startingSkill,
    });
  }, []);

  const startRound = useCallback(() => {
    const phaseBefore = state.phase;
    dispatch({ type: "START_ROUND", now: Date.now() });
    if (!state.soundEnabled) return;
    if (phaseBefore === "ready") playStartSound();
    else if (phaseBefore === "boss-intro") playBossStartSound();
  }, [state.phase, state.soundEnabled]);

  const answer = useCallback(
    (optionId: string) => {
      const now = Date.now();
      const canAnswer =
        (state.phase === "main" || state.phase === "boss") &&
        (state.phase !== "main" || now >= state.inputLockedUntil) &&
        Boolean(state.currentQuestion) &&
        !state.abilities.eliminatedOptionIds.includes(optionId) &&
        (!state.timerDeadline || now < state.timerDeadline);

      const correct = state.currentQuestion?.correctOptionId === optionId;
      dispatch({ type: "ANSWER", optionId, now });
      if (!canAnswer || !state.soundEnabled) return;

      playAnswerSound(correct, {
        boss: state.phase === "boss",
        streak: correct ? state.streak + 1 : 0,
        shieldAbsorbed: !correct && state.abilities.shieldArmed,
      });
    },
    [
      state.abilities.eliminatedOptionIds,
      state.abilities.shieldArmed,
      state.currentQuestion,
      state.inputLockedUntil,
      state.phase,
      state.soundEnabled,
      state.streak,
      state.timerDeadline,
    ],
  );

  const skip = useCallback(() => {
    const now = Date.now();
    const canSkip =
      state.phase === "main" &&
      now >= state.inputLockedUntil &&
      Boolean(state.currentQuestion) &&
      (!state.timerDeadline || now < state.timerDeadline);
    dispatch({ type: "SKIP", now });
    if (canSkip && state.soundEnabled) playSkipSound();
  }, [
    state.currentQuestion,
    state.inputLockedUntil,
    state.phase,
    state.soundEnabled,
    state.timerDeadline,
  ]);

  const useAbility = useCallback(
    (ability: AbilityId) => {
      const now = Date.now();
      const canUse =
        (state.phase === "main" || state.phase === "boss") &&
        Boolean(state.currentQuestion) &&
        state.abilities[ability] >= 1 &&
        !(ability === "shield" && state.abilities.shieldArmed) &&
        !(ability === "fiftyFifty" && state.abilities.eliminatedOptionIds.length > 0) &&
        (!state.timerDeadline || now < state.timerDeadline);

      dispatch({ type: "USE_ABILITY", ability, now });
      if (canUse && state.soundEnabled) {
        playAbilitySound(ability);
      }
    },
    [
      state.abilities,
      state.currentQuestion,
      state.phase,
      state.soundEnabled,
      state.timerDeadline,
    ],
  );

  const playAgain = useCallback(
    (startingSkill?: number) => {
      stopAllAudio();
      if (state.level) {
        dispatch({
          type: "SET_LEVEL",
          level: state.level,
          seed: Math.floor(Math.random() * 0xffff_ffff) || 0x43a2_1f57,
          runId: createRunId(),
          startingSkill,
        });
      } else {
        dispatch({ type: "SHOW_LEVELS" });
      }
    },
    [state.level],
  );

  const changeLevel = useCallback(() => {
    stopAllAudio();
    dispatch({ type: "CHANGE_LEVEL" });
  }, []);

  const toggleSound = useCallback(() => {
    if (state.soundEnabled) {
      stopAllAudio();
    } else {
      playSoundEnabledChime();
    }
    dispatch({ type: "TOGGLE_SOUND" });
  }, [state.soundEnabled]);

  useEffect(() => {
    if (state.roundKind === null) return;
    const timer = window.setInterval(() => {
      dispatch({ type: "TICK", now: Date.now() });
    }, 100);
    return () => window.clearInterval(timer);
  }, [state.phase, state.roundKind]);

  // Subtle final-5s countdown pulse when sound is enabled
  useEffect(() => {
    if (!state.soundEnabled || (state.phase !== "main" && state.phase !== "boss")) {
      lastTickSecondRef.current = null;
      return;
    }
    const activeMs =
      state.phase === "boss" ? state.bossRemainingMs : state.remainingMs;
    const sec = Math.ceil(activeMs / 1000);
    if (sec >= 1 && sec <= 5 && sec !== lastTickSecondRef.current) {
      lastTickSecondRef.current = sec;
      playTimerTickSound();
    } else if (sec > 5) {
      lastTickSecondRef.current = null;
    }
  }, [state.bossRemainingMs, state.phase, state.remainingMs, state.soundEnabled]);

  // Phase transition audio: Boss intro & Result Win/Loss voiceover + fanfare
  useEffect(() => {
    const prev = prevPhaseRef.current;
    prevPhaseRef.current = state.phase;
    if (!state.soundEnabled || prev === state.phase) return;

    if (state.phase === "boss-intro") {
      playBossIntroSound();
    } else if (state.phase === "result") {
      const verdict = evaluateRunVerdict(state.answerHistory, state.stats);
      playResultVerdictAudio(verdict.won, verdict.bossCorrect);
    }
  }, [state.answerHistory, state.phase, state.soundEnabled, state.stats]);

  useEffect(() => {
    if (
      state.phase === "feedback" &&
      state.soundEnabled &&
      state.feedback?.timedOut
    ) {
      playTimeoutSound();
    }
  }, [state.phase, state.soundEnabled, state.feedback]);

  useEffect(() => {
    if (state.phase !== "feedback") return;
    const timer = window.setTimeout(() => {
      dispatch({ type: "ADVANCE", now: Date.now() });
    }, GAME_CONFIG.feedbackDurationMs);
    return () => window.clearTimeout(timer);
  }, [state.phase, state.feedback]);

  return {
    state,
    showLevelSelect,
    startRun,
    startRound,
    answer,
    skip,
    useAbility,
    playAgain,
    changeLevel,
    toggleSound,
  };
}