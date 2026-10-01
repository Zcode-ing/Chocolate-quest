import type { AcademicLevel } from "./types";

export const GAME_CONFIG = {
  mainRoundDurationMs: 60_000,
  bossQuestionDurationMs: 12_000,
  bossQuestionCount: 3,
  feedbackDurationMs: 620,
  skipCooldownMs: 260,
  timeBurstMs: 8_000,
  maxMainTimeMs: 68_000,
  negativeScoreFloor: -500,
  allowNegativeScore: true,
  questionPoolMinimum: 5,
  fastAnswerRatio: 0.42,
  slowAnswerRatio: 0.9,
  recentPerformanceWindow: 7,
  bossDifficultyBonus: 8,
  streakMultiplierStep: 0.08,
  maxStreakMultiplier: 1.4,
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