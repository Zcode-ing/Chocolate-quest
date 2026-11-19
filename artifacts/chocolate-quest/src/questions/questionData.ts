import curatedData from "./curatedQuestions.generated.json";
import type { AcademicLevel, GameQuestion } from "@/game/types";

interface CuratedQuestionFile {
  questions: GameQuestion[];
  diagnostics: {
    classificationStatus: string;
    importedCount: number;
    sourceCounts: Record<string, number>;
    excludedFromPlay: number;
    flaggedCount: number;
    promptDuplicateGroups: number;
    flaggedQuestions: Array<{
      id: string;
      prompt: string;
      reviewFlags: string[];
      eligibleForPlay: boolean;
    }>;
  };
}

const curated = curatedData as unknown as CuratedQuestionFile;

export const ALL_QUESTIONS = curated.questions;
export const QUESTION_IMPORT_DIAGNOSTICS = curated.diagnostics;

export const PLAYABLE_QUESTIONS = ALL_QUESTIONS.filter(
  (question) => question.eligibleForPlay,
);

export function getQuestionsForLevel(
  level: AcademicLevel,
  bossOnly = false,
): GameQuestion[] {
  return PLAYABLE_QUESTIONS.filter(
    (question) =>
      question.gradeBands.includes(level) &&
      (!bossOnly || question.bossEligible),
  );
}

export const QUESTION_POOL_COUNTS = Object.fromEntries(
  (["junior", "semi-senior", "senior", "ultra-advanced"] as const).map((level) => [
    level,
    getQuestionsForLevel(level).length,
  ]),
);

for (const [level, count] of Object.entries(QUESTION_POOL_COUNTS)) {
  if (count < 5) {
    throw new Error(
      `Question pool for ${level} has only ${count} playable questions; at least 5 are required.`,
    );
  }
}