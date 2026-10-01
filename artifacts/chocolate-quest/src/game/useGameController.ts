import { useCallback, useEffect, useReducer } from "react";
import { GAME_CONFIG } from "./config";
import { createInitialState, gameReducer } from "./reducer";
import type {
  AbilityId,
  AcademicLevel,
  GameController,
} from "./types";

function playAnswerTone(correct: boolean): void {
  if (typeof window === "undefined" || !("AudioContext" in window)) return;
  try {
    const audio = new AudioContext();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = correct ? 660 : 245;
    gain.gain.setValueAtTime(0.0001, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.07, audio.currentTime + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.17);
    oscillator.onended = () => void audio.close();
  } catch {
    // Sound is optional; browser audio restrictions must not interrupt play.
  }
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

  const startRun = useCallback((level: AcademicLevel) => {
    dispatch({
      type: "SET_LEVEL",
      level,
      seed: Math.floor(Math.random() * 0xffff_ffff) || 0x43a2_1f57,
    });
  }, []);

  const startRound = useCallback(() => {
    dispatch({ type: "START_ROUND", now: Date.now() });
  }, []);

  const answer = useCallback(
    (optionId: string) => {
      const correct =
        state.currentQuestion?.correctOptionId === optionId;
      dispatch({ type: "ANSWER", optionId, now: Date.now() });
      if (state.soundEnabled && correct !== undefined) {
        playAnswerTone(correct);
      }
    },
    [state.currentQuestion, state.soundEnabled],
  );

  const skip = useCallback(() => {
    dispatch({ type: "SKIP", now: Date.now() });
  }, []);

  const useAbility = useCallback((ability: AbilityId) => {
    dispatch({ type: "USE_ABILITY", ability, now: Date.now() });
  }, []);

  const playAgain = useCallback(() => {
    if (state.level) {
      dispatch({
        type: "SET_LEVEL",
        level: state.level,
        seed: Math.floor(Math.random() * 0xffff_ffff) || 0x43a2_1f57,
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