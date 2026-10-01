import { GAME_CONFIG } from "./config";
import type { GameQuestion } from "./types";

export interface ScoreInput {
  question: GameQuestion;
  responseSeconds: number;
  streak: number;
  wrongStreak: number;
  playerSkill: number;
  boss: boolean;
  correct: boolean;
  skipped: boolean;
  timedOut: boolean;
  shieldArmed: boolean;
}

export interface ScoreResult {
  points: number;
  label: string;
  shieldConsumed: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function scoreAnswer(input: ScoreInput): ScoreResult {
  const {
    question,
    responseSeconds,
    streak,
    wrongStreak,
    playerSkill,
    boss,
    correct,
    skipped,
    timedOut,
    shieldArmed,
  } = input;

  const base =
    GAME_CONFIG.scoreBasePoints +
    question.difficulty * GAME_CONFIG.scoreDifficultyStep;
  const speedRatio = clamp(
    responseSeconds / Math.max(1, question.estimatedSeconds),
    0,
    2,
  );
  const speedMultiplier =
    speedRatio <= GAME_CONFIG.fastAnswerRatio
      ? GAME_CONFIG.quickAnswerMultiplier
      : speedRatio <= GAME_CONFIG.slowAnswerRatio
        ? GAME_CONFIG.steadyAnswerMultiplier
        : GAME_CONFIG.slowAnswerMultiplier;
  const streakMultiplier = Math.min(
    GAME_CONFIG.maxStreakMultiplier,
    1 + Math.max(0, streak) * GAME_CONFIG.streakMultiplierStep,
  );
  const challengeMultiplier = clamp(
    1.12 - Math.abs(question.difficulty - playerSkill) / 100,
    0.82,
    1.12,
  );
  const bossMultiplier = boss ? 1.45 : 1;

  if (correct) {
    const points = Math.round(
      base *
        speedMultiplier *
        streakMultiplier *
        challengeMultiplier *
        bossMultiplier,
    );
    return {
      points,
      label:
        speedRatio <= GAME_CONFIG.fastAnswerRatio
          ? "Quick and correct"
          : streak >= 2
            ? "Knowledge streak"
            : "Correct",
      shieldConsumed: false,
    };
  }

  if (skipped) {
    const penalty = Math.max(
      1,
      Math.round(base * GAME_CONFIG.skipPenaltyMultiplier),
    );
    return {
      points: -penalty,
      label: "Passed with a small penalty",
      shieldConsumed: false,
    };
  }

  if (shieldArmed) {
    return {
      points: 0,
      label: "Safety net absorbed the hit",
      shieldConsumed: true,
    };
  }

  const escalation = Math.min(
    1 + Math.max(0, wrongStreak) * GAME_CONFIG.wrongStreakPenaltyStep,
    GAME_CONFIG.maxWrongStreakPenaltyMultiplier,
  );
  const severity = timedOut
    ? GAME_CONFIG.timeoutPenaltyMultiplier
    : GAME_CONFIG.wrongPenaltyMultiplier;
  const roundRisk = boss ? GAME_CONFIG.bossWrongPenaltyMultiplier : 1;
  const penalty = Math.max(1, Math.round(base * severity * roundRisk * escalation));
  return {
    points: -penalty,
    label: timedOut ? "No answer before time ran out" : "Incorrect answer",
    shieldConsumed: false,
  };
}

export function applyScoreBoundary(score: number): number {
  return Number.isFinite(score) ? Math.round(score) : 0;
}