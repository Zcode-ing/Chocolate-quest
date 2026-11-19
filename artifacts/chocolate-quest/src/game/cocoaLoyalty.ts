import { useEffect, useMemo, useRef, useState } from "react";
import { GAME_CONFIG } from "./config";
import type { AnswerRecord, GamePhase } from "./types";

const STORAGE_KEY = "chocolate-quest.cocoa-loyalty.v1";

export const COCOA_RANKS = [
  { name: "Cocoa Seed", minimumBeans: 0 },
  { name: "Cocoa Scout", minimumBeans: 100 },
  { name: "Cacao Keeper", minimumBeans: 300 },
  { name: "Chocolate Artisan", minimumBeans: 650 },
  { name: "Grand Chocolatier", minimumBeans: 1_200 },
] as const;

export interface CocoaLoyaltyProfile {
  beans: number;
  completedRuns: number;
  bestAccuracy: number;
  lastRunId: string | null;
  lastRunBeans: number;
  lastRunAccuracy: number;
}

export interface RunLoyaltyProgress {
  attempts: number;
  correct: number;
  accuracy: number;
  eligible: boolean;
  beansEarned: number;
}

export interface RunVerdict {
  won: boolean;
  answered: number;
  attempts: number;
  correct: number;
  accuracy: number;
  bossCorrect: number;
  hasMinAnswered: boolean;
  hasMinAccuracy: boolean;
  hasMinBoss: boolean;
}

const INITIAL_PROFILE: CocoaLoyaltyProfile = {
  beans: 0,
  completedRuns: 0,
  bestAccuracy: 0,
  lastRunId: null,
  lastRunBeans: 0,
  lastRunAccuracy: 0,
};

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function readProfile(): CocoaLoyaltyProfile {
  if (typeof window === "undefined") return INITIAL_PROFILE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return INITIAL_PROFILE;
    const value = JSON.parse(stored) as Partial<CocoaLoyaltyProfile>;
    if (
      !isFiniteNonNegative(value.beans) ||
      !isFiniteNonNegative(value.completedRuns) ||
      typeof value.bestAccuracy !== "number" ||
      !Number.isFinite(value.bestAccuracy) ||
      !isFiniteNonNegative(value.lastRunBeans) ||
      typeof value.lastRunAccuracy !== "number" ||
      !Number.isFinite(value.lastRunAccuracy)
    ) {
      console.warn("[Chocolate Quest] Saved loyalty data was invalid; starting a fresh local profile.");
      return INITIAL_PROFILE;
    }
    return {
      beans: value.beans,
      completedRuns: value.completedRuns,
      bestAccuracy: Math.min(1, Math.max(0, value.bestAccuracy)),
      lastRunId: typeof value.lastRunId === "string" ? value.lastRunId : null,
      lastRunBeans: value.lastRunBeans,
      lastRunAccuracy: Math.min(1, Math.max(0, value.lastRunAccuracy)),
    };
  } catch (error) {
    console.warn("[Chocolate Quest] Could not read local loyalty progress.", error);
    return INITIAL_PROFILE;
  }
}

function saveProfile(profile: CocoaLoyaltyProfile): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn("[Chocolate Quest] Could not save local loyalty progress.", error);
  }
}

export function calculateRunLoyalty(
  records: AnswerRecord[],
): RunLoyaltyProgress {
  const correctRecords = records.filter((record) => record.correct && !record.skipped);
  const attempts = records.length;
  const correct = correctRecords.length;
  const accuracy = attempts > 0 ? correct / attempts : 0;
  const eligible =
    attempts >= GAME_CONFIG.loyaltyMinimumAnswers &&
    accuracy >= GAME_CONFIG.loyaltyAccuracyThreshold;

  let streak = 0;
  let bestStreak = 0;
  for (const record of records) {
    streak = record.correct && !record.skipped ? streak + 1 : 0;
    bestStreak = Math.max(bestStreak, streak);
  }

  const beansEarned = eligible
    ? correctRecords.reduce(
        (total, record) =>
          total +
          5 +
          Math.floor(Math.max(0, record.difficulty) / 30) +
          (record.boss ? 4 : 0),
        0,
      ) + Math.min(20, Math.max(0, bestStreak - 2) * 2)
    : 0;

  return {
    attempts,
    correct,
    accuracy,
    eligible,
    beansEarned,
  };
}

export function evaluateRunVerdict(
  records: AnswerRecord[],
  stats?: { answered: number; correct: number; bossCorrect: number },
): RunVerdict {
  const attempts = records.length;
  const answered =
    stats?.answered ?? records.filter((record) => !record.skipped).length;
  const correct =
    stats?.correct ??
    records.filter((record) => record.correct && !record.skipped).length;
  const bossCorrect =
    stats?.bossCorrect ??
    records.filter((record) => record.boss && record.correct && !record.skipped).length;
  const accuracy = attempts > 0 ? correct / attempts : 0;

  const hasMinAnswered = answered >= GAME_CONFIG.winnerMinAnswered;
  const hasMinAccuracy = accuracy >= GAME_CONFIG.winnerAccuracyThreshold;
  const hasMinBoss = bossCorrect >= GAME_CONFIG.winnerMinBossCorrect;

  return {
    won: hasMinAnswered && hasMinAccuracy && hasMinBoss,
    answered,
    attempts,
    correct,
    accuracy,
    bossCorrect,
    hasMinAnswered,
    hasMinAccuracy,
    hasMinBoss,
  };
}

export function getCocoaStanding(beans: number) {
  let rankIndex = 0;
  for (let index = 1; index < COCOA_RANKS.length; index += 1) {
    if (beans >= COCOA_RANKS[index].minimumBeans) rankIndex = index;
    else break;
  }
  const rank = COCOA_RANKS[rankIndex];
  const nextRank = COCOA_RANKS[rankIndex + 1] ?? null;
  const span = nextRank
    ? nextRank.minimumBeans - rank.minimumBeans
    : 1;
  const progress = nextRank
    ? Math.min(1, Math.max(0, (beans - rank.minimumBeans) / span))
    : 1;

  return {
    rank,
    nextRank,
    progress,
    beansToNext: nextRank ? Math.max(0, nextRank.minimumBeans - beans) : 0,
  };
}

export function useCocoaLoyalty(
  phase: GamePhase,
  runId: string | null,
  answerHistory: AnswerRecord[],
) {
  const [profile, setProfile] = useState(readProfile);
  const profileRef = useRef(profile);
  const runProgress = useMemo(
    () => calculateRunLoyalty(answerHistory),
    [answerHistory],
  );
  const standing = useMemo(
    () => getCocoaStanding(profile.beans),
    [profile.beans],
  );

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    const current = profileRef.current;
    if (phase !== "result" || !runId || current.lastRunId === runId) return;

    const nextProfile: CocoaLoyaltyProfile = {
      ...current,
      beans: current.beans + runProgress.beansEarned,
      completedRuns: current.completedRuns + 1,
      bestAccuracy: Math.max(current.bestAccuracy, runProgress.accuracy),
      lastRunId: runId,
      lastRunBeans: runProgress.beansEarned,
      lastRunAccuracy: runProgress.accuracy,
    };
    profileRef.current = nextProfile;
    setProfile(nextProfile);
    saveProfile(nextProfile);
  }, [phase, runId, runProgress]);

  return { profile, runProgress, standing };
}