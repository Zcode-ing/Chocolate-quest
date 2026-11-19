import type { AcademicLevel } from "./types";

export const GAME_CONFIG = {
  mainRoundDurationMs: 60_000,
  bossQuestionDurationMs: 12_000,
  bossQuestionCount: 3,
  feedbackDurationMs: 850,
  skipCooldownMs: 340,
  timeBurstMs: 8_000,
  maxMainTimeMs: 68_000,
  questionPoolMinimum: 5,
  fastAnswerRatio: 0.42,
  slowAnswerRatio: 0.9,
  recentPerformanceWindow: 7,
  bossDifficultyBonus: 8,
  scoreBasePoints: 110,
  scoreDifficultyStep: 1.4,
  quickAnswerMultiplier: 1.14,
  steadyAnswerMultiplier: 1,
  slowAnswerMultiplier: 0.82,
  wrongPenaltyMultiplier: 1.25,
  timeoutPenaltyMultiplier: 1.55,
  bossWrongPenaltyMultiplier: 1.35,
  skipPenaltyMultiplier: 0.35,
  wrongStreakPenaltyStep: 0.16,
  maxWrongStreakPenaltyMultiplier: 1.48,
  streakMultiplierStep: 0.045,
  maxStreakMultiplier: 1.3,
  loyaltyMinimumAnswers: 6,
  loyaltyAccuracyThreshold: 0.7,
  winnerMinAnswered: 6,
  winnerAccuracyThreshold: 0.6,
  winnerMinBossCorrect: 2,
} as const;

export const LEVEL_CONFIG: Record<
  AcademicLevel,
  { label: string; schoolBand: string; title: string; initialSkill: number }
> = {
  junior: {
    label: "Junior",
    schoolBand: "Classes 7–8",
    title: "Curious Explorer",
    initialSkill: 30,
  },
  "semi-senior": {
    label: "Semi-Senior",
    schoolBand: "Classes 9–10",
    title: "Knowledge Runner",
    initialSkill: 46,
  },
  senior: {
    label: "Senior",
    schoolBand: "Classes 11–12",
    title: "Challenge Mode",
    initialSkill: 62,
  },
  "ultra-advanced": {
    label: "Ultra Advanced",
    schoolBand: "B.Tech",
    title: "Master Architect",
    initialSkill: 78,
  },
};

export const INITIAL_ABILITIES = {
  shield: 1,
  fiftyFifty: 1,
  timeBurst: 1,
  shieldArmed: false,
  eliminatedOptionIds: [] as string[],
};