import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LEVEL_CONFIG } from "./config";
import {
  calculateRunLoyalty,
  evaluateRunVerdict,
  getCocoaStanding,
} from "./cocoaLoyalty";
import {
  createDefaultProfile,
  exportDatabaseSnapshot,
  hydrateFromIndexedDbIfEmpty,
  normalizeUsername,
  parseImportedDatabaseSnapshot,
  persistOfflinePlayers,
  readOfflinePlayers,
  validateUsername,
  type CocoaPlayerProfile,
} from "./offlineDb";
import type { AcademicLevel, AnswerRecord, GamePhase } from "./types";

export { normalizeUsername, validateUsername, type CocoaPlayerProfile };

function clampDifficulty(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function useCocoaPlayers(
  phase: GamePhase,
  runId: string | null,
  level: AcademicLevel | null,
  answerHistory: AnswerRecord[],
  finalSkill: number,
  finalScore = 0,
  answeredCount?: number,
  bossCorrectCount?: number,
) {
  const [players, setPlayers] = useState<CocoaPlayerProfile[]>(readOfflinePlayers);
  const playersRef = useRef(players);
  const [activeUsername, setActiveUsername] = useState<string | null>(null);

  const runProgress = useMemo(
    () => calculateRunLoyalty(answerHistory),
    [answerHistory],
  );
  const runVerdict = useMemo(
    () =>
      evaluateRunVerdict(answerHistory, {
        answered:
          answeredCount ??
          answerHistory.filter((record) => !record.skipped).length,
        correct: answerHistory.filter(
          (record) => record.correct && !record.skipped,
        ).length,
        bossCorrect:
          bossCorrectCount ??
          answerHistory.filter(
            (record) => record.boss && record.correct && !record.skipped,
          ).length,
      }),
    [answerHistory, answeredCount, bossCorrectCount],
  );

  const activePlayer = useMemo(
    () =>
      players.find(
        (player) => player.normalizedUsername === activeUsername,
      ) ?? null,
    [activeUsername, players],
  );

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  useEffect(() => {
    let active = true;
    void hydrateFromIndexedDbIfEmpty().then((restored) => {
      if (!active || !restored) return;
      if (playersRef.current.length === 0) {
        playersRef.current = restored;
        setPlayers(restored);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const updatePlayers = useCallback((next: CocoaPlayerProfile[]) => {
    playersRef.current = next;
    setPlayers(next);
    persistOfflinePlayers(next);
  }, []);

  const selectPlayer = useCallback(
    (rawUsername: string): CocoaPlayerProfile | null => {
      if (validateUsername(rawUsername)) return null;
      const username = rawUsername
        .normalize("NFKC")
        .trim()
        .replace(/\s+/g, " ");
      const normalizedUsername = normalizeUsername(username);
      const existing = playersRef.current.find(
        (player) => player.normalizedUsername === normalizedUsername,
      );
      if (existing) {
        setActiveUsername(existing.normalizedUsername);
        return existing;
      }
      const created = createDefaultProfile(username);
      updatePlayers([created, ...playersRef.current]);
      setActiveUsername(created.normalizedUsername);
      return created;
    },
    [updatePlayers],
  );

  const leavePlayer = useCallback(() => setActiveUsername(null), []);

  const difficultyFor = useCallback(
    (selectedLevel: AcademicLevel) => {
      if (!activePlayer) return LEVEL_CONFIG[selectedLevel].initialSkill;
      return (
        activePlayer.estimatedSkillByLevel[selectedLevel] ??
        LEVEL_CONFIG[selectedLevel].initialSkill
      );
    },
    [activePlayer],
  );

  const setPlayerDifficulty = useCallback(
    (
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
    },
    [updatePlayers],
  );

  const exportDatabase = useCallback(() => {
    return exportDatabaseSnapshot(playersRef.current);
  }, []);

  const importDatabase = useCallback(
    (rawJson: string): { ok: boolean; importedCount: number } => {
      const parsed = parseImportedDatabaseSnapshot(rawJson);
      if (!parsed) return { ok: false, importedCount: 0 };
      updatePlayers(parsed);
      return { ok: true, importedCount: parsed.length };
    },
    [updatePlayers],
  );

  const clearDatabase = useCallback(() => {
    setActiveUsername(null);
    updatePlayers([]);
  }, [updatePlayers]);

  useEffect(() => {
    if (phase !== "result" || !runId || !level || !activeUsername) return;
    const currentPlayers = playersRef.current;
    const profile = currentPlayers.find(
      (player) => player.normalizedUsername === activeUsername,
    );
    if (!profile || profile.lastRunId === runId) return;

    const progress = calculateRunLoyalty(answerHistory);
    const verdict = evaluateRunVerdict(answerHistory, {
      answered:
        answeredCount ??
        answerHistory.filter((record) => !record.skipped).length,
      correct: answerHistory.filter(
        (record) => record.correct && !record.skipped,
      ).length,
      bossCorrect:
        bossCorrectCount ??
        answerHistory.filter(
          (record) => record.boss && record.correct && !record.skipped,
        ).length,
    });
    const playedAt = new Date().toISOString();
    const runEntry = {
      runId,
      level,
      score: Math.round(finalScore),
      accuracy: verdict.accuracy,
      answered: verdict.answered,
      bossCorrect: verdict.bossCorrect,
      won: verdict.won,
      beansEarned: progress.beansEarned,
      playedAt,
    };

    const nextProfile: CocoaPlayerProfile = {
      ...profile,
      beans: profile.beans + progress.beansEarned,
      completedRuns: profile.completedRuns + 1,
      wins: profile.wins + (verdict.won ? 1 : 0),
      losses: profile.losses + (verdict.won ? 0 : 1),
      bestScore: Math.max(profile.bestScore, Math.round(finalScore)),
      bestAccuracy: Math.max(profile.bestAccuracy, progress.accuracy),
      lastRunId: runId,
      lastRunBeans: progress.beansEarned,
      lastRunAccuracy: progress.accuracy,
      lastRunWon: verdict.won,
      totalAnswers: profile.totalAnswers + progress.attempts,
      totalCorrect: profile.totalCorrect + progress.correct,
      estimatedSkillByLevel: {
        ...profile.estimatedSkillByLevel,
        [level]: clampDifficulty(finalSkill),
      },
      lastLevel: level,
      lastPlayedAt: playedAt,
      recentRuns: [runEntry, ...(profile.recentRuns ?? [])].slice(0, 10),
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
    answeredCount,
    bossCorrectCount,
    finalScore,
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
    runVerdict,
    standing,
    selectPlayer,
    leavePlayer,
    difficultyFor,
    setPlayerDifficulty,
    exportDatabase,
    importDatabase,
    clearDatabase,
  };
}