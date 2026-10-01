import importedData from "./legacyQuestions.generated.json";
import type { AcademicLevel, GameQuestion } from "@/game/types";

interface ImportedQuestionFile {
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

const imported = importedData as unknown as ImportedQuestionFile;

export const ALL_QUESTIONS = imported.questions;
export const QUESTION_IMPORT_DIAGNOSTICS = imported.diagnostics;

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

const levelPoolCounts = Object.fromEntries(
  (["junior", "semi-senior", "senior", "ultra-advanced"] as const).map((level) => [
    level,
    getQuestionsForLevel(level).length,
  ]),
);

for (const [level, count] of Object.entries(levelPoolCounts)) {
  if (count < 5) {
    throw new Error(
      `Question pool for ${level} has only ${count} playable questions; at least 5 are required.`,
    );
  }
}

if (import.meta.env.DEV) {
  console.info("[Chocolate Quest] Legacy question import", {
    classification: QUESTION_IMPORT_DIAGNOSTICS.classificationStatus,
    imported: QUESTION_IMPORT_DIAGNOSTICS.importedCount,
    playable: PLAYABLE_QUESTIONS.length,
    excluded: QUESTION_IMPORT_DIAGNOSTICS.excludedFromPlay,
    duplicatePromptGroups:
      QUESTION_IMPORT_DIAGNOSTICS.promptDuplicateGroups,
    levelPoolCounts,
  });
  const contentReview = QUESTION_IMPORT_DIAGNOSTICS.flaggedQuestions.filter(
    (question) =>
      question.reviewFlags.some((flag) => flag !== "duplicate-prompt"),
  );
  if (contentReview.length > 0) {
    console.warn(
      "[Chocolate Quest] Imported questions needing human content review:",
      contentReview,
    );
  }
}