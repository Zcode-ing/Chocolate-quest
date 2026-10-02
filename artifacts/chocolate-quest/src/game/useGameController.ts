import { useCallback, useEffect, useReducer } from "react";
import { GAME_CONFIG } from "./config";
import { createInitialState, gameReducer } from "./reducer";
import {
  playAnswerSound,
  playSkipSound,
  playStartSound,
  playTimeoutSound,
} from "./sound";
import type {
  AbilityId,
  AcademicLevel,
  GameController,
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
    dispatch({ type: "START_ROUND", now: Date.now() });
    if (state.soundEnabled) playStartSound();
  }, [state.soundEnabled]);

  const answer = useCallback(
    (optionId: string) => {
      const correct =
        state.currentQuestion?.correctOptionId === optionId;
      dispatch({ type: "ANSWER", optionId, now: Date.now() });
      if (state.soundEnabled) playAnswerSound(correct);
    },
    [state.currentQuestion, state.soundEnabled],
  );

  const skip = useCallback(() => {
    dispatch({ type: "SKIP", now: Date.now() });
    if (state.soundEnabled) playSkipSound();
  }, [state.soundEnabled]);

  const useAbility = useCallback((ability: AbilityId) => {
    dispatch({ type: "USE_ABILITY", ability, now: Date.now() });
  }, []);

  const playAgain = useCallback((startingSkill?: number) => {
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
  }, [state.level]);

  const changeLevel = useCallback(() => {
    dispatch({ type: "CHANGE_LEVEL" });
  }, []);

  const toggleSound = useCallback(() => {
    dispatch({ type: "TOGGLE_SOUND" });
  }, []);

  useEffect(() => {
    if (state.roundKind === null) return;
    const timer = window.setInterval(() => {
      dispatch({ type: "TICK", now: Date.now() });
    }, 100);
    return () => window.clearInterval(timer);
  }, [state.phase, state.roundKind]);

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