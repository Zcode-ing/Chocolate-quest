import { GAME_CONFIG } from "./config";
import type { GameQuestion } from "./types";

export interface ScoreInput {
  question: GameQuestion;
  responseSeconds: number;
  streak: number;
  playerSkill: number;
  boss: boolean;
  correct: boolean;
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
    playerSkill,
    boss,
    correct,
    shieldArmed,
  } = input;

  const base = 56 + question.difficulty * 1.18;
  const speedRatio = clamp(
    responseSeconds / Math.max(1, question.estimatedSeconds),
    0,
    2,
  );
  const speedMultiplier =
    speedRatio <= GAME_CONFIG.fastAnswerRatio
      ? 1.28
      : speedRatio <= GAME_CONFIG.slowAnswerRatio
        ? 1
        : 0.82;
  const streakMultiplier = Math.min(
    GAME_CONFIG.maxStreakMultiplier,
    1 + Math.max(0, streak) * GAME_CONFIG.streakMultiplierStep,
  );
  const challengeMultiplier = clamp(
    1.18 - Math.abs(question.difficulty - playerSkill) / 90,
    0.82,
    1.18,
  );
  const bossMultiplier = boss ? 1.55 : 1;

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
          ? "Lightning"
          : streak >= 2
            ? "On a streak"
            : "Correct",
      shieldConsumed: false,
    };
  }

  if (shieldArmed) {
    return { points: 0, label: "Shield saved you", shieldConsumed: true };
  }

  const penalty = Math.min(
    boss ? 90 : 62,
    Math.max(18, Math.round(base * (boss ? 0.36 : 0.27))),
  );
  return {
    points: -penalty,
    label: boss ? "Boss hit" : "Keep going",
    shieldConsumed: false,
  };
}

export function applyScoreBoundary(score: number): number {
  return GAME_CONFIG.allowNegativeScore
    ? Math.max(GAME_CONFIG.negativeScoreFloor, score)
    : Math.max(0, score);
}