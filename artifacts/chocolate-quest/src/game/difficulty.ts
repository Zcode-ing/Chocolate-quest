import { GAME_CONFIG } from "./config";
import type { GameQuestion, PlayerSkillState } from "./types";

export function createInitialSkill(estimatedSkill: number): PlayerSkillState {
  return {
    estimatedSkill,
    recentAccuracy: 0.5,
    recentSpeed: 0.5,
    currentStreak: 0,
    wrongStreak: 0,
    skippedCount: 0,
    questionsAnswered: 0,
    averageResponseTime: 0,
    confidenceTrend: 0,
    recentOutcomes: [],
  };
}

export function updateSkill(
  previous: PlayerSkillState,
  question: GameQuestion,
  correct: boolean,
  responseSeconds: number,
): PlayerSkillState {
  const expectedSuccess =
    1 / (1 + Math.exp((question.difficulty - previous.estimatedSkill) / 13));
  const speedRatio = responseSeconds / Math.max(1, question.estimatedSeconds);
  const speedQuality = Math.max(0, Math.min(1, 1.1 - speedRatio));
  const speedWeight = correct ? 0.62 + speedQuality * 0.42 : 0.72;
  const observed = correct ? 1 : 0;
  const delta = (observed - expectedSuccess) * 8 * speedWeight;
  const estimatedSkill = Math.max(
    0,
    Math.min(100, previous.estimatedSkill + delta),
  );
  const recentOutcomes = [
    ...previous.recentOutcomes,
    correct ? 1 : 0,
  ].slice(-GAME_CONFIG.recentPerformanceWindow);
  const recentAccuracy =
    recentOutcomes.reduce((total, value) => total + value, 0) /
    Math.max(1, recentOutcomes.length);
  const questionsAnswered = previous.questionsAnswered + 1;
  const averageResponseTime =
    previous.averageResponseTime +
    (responseSeconds - previous.averageResponseTime) / questionsAnswered;
  const recentSpeed = previous.recentSpeed * 0.72 + speedQuality * 0.28;

  return {
    ...previous,
    estimatedSkill,
    recentAccuracy,
    recentSpeed,
    questionsAnswered,
    averageResponseTime,
    currentStreak: correct ? previous.currentStreak + 1 : 0,
    wrongStreak: correct ? 0 : previous.wrongStreak + 1,
    confidenceTrend: Math.max(
      -1,
      Math.min(1, recentAccuracy - 0.5 + (recentSpeed - 0.5) * 0.35),
    ),
    recentOutcomes,
  };
}

export function recordSkip(skill: PlayerSkillState): PlayerSkillState {
  return {
    ...skill,
    skippedCount: skill.skippedCount + 1,
    currentStreak: 0,
  };
}