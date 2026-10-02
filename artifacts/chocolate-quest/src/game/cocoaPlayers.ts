import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LEVEL_CONFIG } from "./config";
import { calculateRunLoyalty, getCocoaStanding } from "./cocoaLoyalty";
import type { AcademicLevel, AnswerRecord, GamePhase } from "./types";

const STORAGE_KEY = "chocolate-quest.players.v2";
const LEGACY_LOYALTY_KEY = "chocolate-quest.cocoa-loyalty.v1";
const MAX_USERNAME_LENGTH = 24;

export interface CocoaPlayerProfile {
  username: string;
  normalizedUsername: string;
  beans: number;
  completedRuns: number;
  bestAccuracy: number;
  lastRunId: string | null;
  lastRunBeans: number;
  lastRunAccuracy: number;
  totalAnswers: number;
  totalCorrect: number;
  estimatedSkillByLevel: Record<AcademicLevel, number>;
  lastLevel: AcademicLevel | null;
  lastPlayedAt: string | null;
}

function clampDifficulty(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function normalizeUsername(username: string): string {
  return username
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

export function validateUsername(username: string): string | null {
  const trimmed = username.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!trimmed) return "Enter a username to continue.";
  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return `Use ${MAX_USERNAME_LENGTH} characters or fewer.`;
  }
  if (/[\u0000-\u001f\u007f]/u.test(trimmed)) {
    return "Use a nickname without control characters.";
  }
  return null;
}

function createProfile(username: string): CocoaPlayerProfile {
  return {
    username,
    normalizedUsername: normalizeUsername(username),
    beans: 0,
    completedRuns: 0,
    bestAccuracy: 0,
    lastRunId: null,
    lastRunBeans: 0,
    lastRunAccuracy: 0,
    totalAnswers: 0,
    totalCorrect: 0,
    estimatedSkillByLevel: {
      junior: LEVEL_CONFIG.junior.initialSkill,
      "semi-senior": LEVEL_CONFIG["semi-senior"].initialSkill,
      senior: LEVEL_CONFIG.senior.initialSkill,
      "ultra-advanced": LEVEL_CONFIG["ultra-advanced"].initialSkill,
    },
    lastLevel: null,
    lastPlayedAt: null,
  };
}

function isValidProfile(value: unknown): value is CocoaPlayerProfile {
  if (!value || typeof value !== "object") return false;
  const profile = value as Partial<CocoaPlayerProfile>;
  return (
    typeof profile.username === "string" &&
    validateUsername(profile.username) === null &&
    profile.normalizedUsername === normalizeUsername(profile.username) &&
    typeof profile.beans === "number" &&
    Number.isFinite(profile.beans) &&
    profile.beans >= 0 &&
    typeof profile.completedRuns === "number" &&
    Number.isFinite(profile.completedRuns) &&
    profile.completedRuns >= 0 &&
    typeof profile.bestAccuracy === "number" &&
    Number.isFinite(profile.bestAccuracy) &&
    profile.bestAccuracy >= 0 &&
    profile.bestAccuracy <= 1 &&
    typeof profile.lastRunAccuracy === "number" &&
    Number.isFinite(profile.lastRunAccuracy) &&
    profile.lastRunAccuracy >= 0 &&
    profile.lastRunAccuracy <= 1 &&
    typeof profile.lastRunBeans === "number" &&
    Number.isFinite(profile.lastRunBeans) &&
    profile.lastRunBeans >= 0 &&
    typeof profile.totalAnswers === "number" &&
    Number.isFinite(profile.totalAnswers) &&
    profile.totalAnswers >= 0 &&
    typeof profile.totalCorrect === "number" &&
    Number.isFinite(profile.totalCorrect) &&
    profile.totalCorrect >= 0 &&
    !!profile.estimatedSkillByLevel &&
    (["junior", "semi-senior", "senior", "ultra-advanced"] as const).every(
      (level) =>
        typeof profile.estimatedSkillByLevel?.[level] === "number" &&
        Number.isFinite(profile.estimatedSkillByLevel[level]) &&
        profile.estimatedSkillByLevel[level] >= 0 &&
        profile.estimatedSkillByLevel[level] <= 100,
    )
  );
}

function migrateLegacyProfile(): CocoaPlayerProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(LEGACY_LOYALTY_KEY);
    if (!saved) return [];
    const legacy = JSON.parse(saved) as Record<string, unknown>;
    if (
      typeof legacy.beans !== "number" ||
      !Number.isFinite(legacy.beans) ||
      legacy.beans < 0 ||
      typeof legacy.completedRuns !== "number" ||
      !Number.isFinite(legacy.completedRuns) ||
      legacy.completedRuns < 0
    ) {
      return [];
    }
    const guest = createProfile("Guest");
    return [{
      ...guest,
      beans: legacy.beans,
      completedRuns: legacy.completedRuns,
      bestAccuracy: typeof legacy.bestAccuracy === "number"
        ? Math.min(1, Math.max(0, legacy.bestAccuracy))
        : 0,
      lastRunId: typeof legacy.lastRunId === "string" ? legacy.lastRunId : null,
      lastRunBeans: typeof legacy.lastRunBeans === "number" ? Math.max(0, legacy.lastRunBeans) : 0,
      lastRunAccuracy: typeof legacy.lastRunAccuracy === "number"
        ? Math.min(1, Math.max(0, legacy.lastRunAccuracy))
        : 0,
    }];
  } catch (error) {
    console.warn("[Chocolate Quest] Could not migrate the previous local loyalty profile.", error);
    return [];
  }
}

function readPlayers(): CocoaPlayerProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return migrateLegacyProfile();
    const parsed = JSON.parse(saved) as { players?: unknown };
    if (!Array.isArray(parsed.players)) return [];

    const unique = new Map<string, CocoaPlayerProfile>();
    for (const candidate of parsed.players) {
      if (!isValidProfile(candidate)) continue;
      if (!unique.has(candidate.normalizedUsername)) unique.set(candidate.normalizedUsername, candidate);
    }
    return [...unique.values()].sort(
      (a, b) => (b.lastPlayedAt ?? "").localeCompare(a.lastPlayedAt ?? ""),
    );
  } catch (error) {
    console.warn("[Chocolate Quest] Could not read local player profiles.", error);
    return [];
  }
}

function persistPlayers(players: CocoaPlayerProfile[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ players }));
  } catch (error) {
    console.warn("[Chocolate Quest] Could not save local player profiles.", error);
  }
}

export function useCocoaPlayers(
  phase: GamePhase,
  runId: string | null,
  level: AcademicLevel | null,
  answerHistory: AnswerRecord[],
  finalSkill: number,
) {
  const [players, setPlayers] = useState(readPlayers);
  const playersRef = useRef(players);
  const [activeUsername, setActiveUsername] = useState<string | null>(null);
  const runProgress = useMemo(
    () => calculateRunLoyalty(answerHistory),
    [answerHistory],
  );
  const activePlayer = useMemo(
    () => players.find((player) => player.normalizedUsername === activeUsername) ?? null,
    [activeUsername, players],
  );

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const updatePlayers = useCallback((next: CocoaPlayerProfile[]) => {
    playersRef.current = next;
    setPlayers(next);
    persistPlayers(next);
  }, []);

  const selectPlayer = useCallback((rawUsername: string): CocoaPlayerProfile | null => {
    if (validateUsername(rawUsername)) return null;
    const username = rawUsername.normalize("NFKC").trim().replace(/\s+/g, " ");
    const normalizedUsername = normalizeUsername(username);
    const existing = playersRef.current.find(
      (player) => player.normalizedUsername === normalizedUsername,
    );
    if (existing) {
      setActiveUsername(existing.normalizedUsername);
      return existing;
    }
    const created = createProfile(username);
    updatePlayers([created, ...playersRef.current]);
    setActiveUsername(created.normalizedUsername);
    return created;
  }, [updatePlayers]);

  const leavePlayer = useCallback(() => setActiveUsername(null), []);

  const difficultyFor = useCallback((selectedLevel: AcademicLevel) => {
    if (!activePlayer) return LEVEL_CONFIG[selectedLevel].initialSkill;
    return activePlayer.estimatedSkillByLevel[selectedLevel] ??
      LEVEL_CONFIG[selectedLevel].initialSkill;
  }, [activePlayer]);

  const setPlayerDifficulty = useCallback((
    normalizedUsername: string,
    selectedLevel: AcademicLevel,
    value: number,
  ) => {
    if (!Number.isFinite(value)) return;
    const next = playersRef.current.map((player) =>
      player.normalizedUsername === normalizedUsername
        ? {
            ...player,
            estimatedSkillByLevel: {
              ...player.estimatedSkillByLevel,
              [selectedLevel]: clampDifficulty(value),
            },
          }
        : player,
    );
    updatePlayers(next);
  }, [updatePlayers]);

  useEffect(() => {
    if (phase !== "result" || !runId || !level || !activeUsername) return;
    const currentPlayers = playersRef.current;
    const profile = currentPlayers.find(
      (player) => player.normalizedUsername === activeUsername,
    );
    if (!profile || profile.lastRunId === runId) return;

    const progress = calculateRunLoyalty(answerHistory);
    const nextProfile: CocoaPlayerProfile = {
      ...profile,
      beans: profile.beans + progress.beansEarned,
      completedRuns: profile.completedRuns + 1,
      bestAccuracy: Math.max(profile.bestAccuracy, progress.accuracy),
      lastRunId: runId,
      lastRunBeans: progress.beansEarned,
      lastRunAccuracy: progress.accuracy,
      totalAnswers: profile.totalAnswers + progress.attempts,
      totalCorrect: profile.totalCorrect + progress.correct,
      estimatedSkillByLevel: {
        ...profile.estimatedSkillByLevel,
        [level]: clampDifficulty(finalSkill),
      },
      lastLevel: level,
      lastPlayedAt: new Date().toISOString(),
    };
    const nextPlayers = [
      nextProfile,
      ...currentPlayers.filter(
        (player) => player.normalizedUsername !== activeUsername,
      ),
    ];
    updatePlayers(nextPlayers);
  }, [
    activeUsername,
    answerHistory,
    finalSkill,
    level,
    phase,
    runId,
    updatePlayers,
  ]);

  const standing = useMemo(
    () => (activePlayer ? getCocoaStanding(activePlayer.beans) : null),
    [activePlayer],
  );

  return {
    players,
    activePlayer,
    activeUsername,
    runProgress,
    standing,
    selectPlayer,
    leavePlayer,
    difficultyFor,
    setPlayerDifficulty,
  };
}