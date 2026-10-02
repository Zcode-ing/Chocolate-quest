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

const NON_TECH_COMPUTING_QUESTION_IDS = new Set([
  "mixed-003",
  "mixed-006",
  "mixed-010",
  "mixed-011",
  "mixed-015",
  "mixed-016",
  "mixed-017",
  "mixed-018",
  "mixed-030",
  "mixed-046",
  "mixed-055",
]);

function isTechnologyQuestion(question: GameQuestion): boolean {
  if (NON_TECH_COMPUTING_QUESTION_IDS.has(question.id)) return false;
  const topic = question.topic.trim().toLowerCase();
  return (
    /^(computing|computer science|technology|tech|hardware|software|programming|coding|networking|internet|robotics|electronics)$/.test(
      topic,
    ) ||
    /\bjavascript\b/i.test(question.prompt)
  );
}

export const PLAYABLE_QUESTIONS = ALL_QUESTIONS.filter(
  (question) => question.eligibleForPlay && isTechnologyQuestion(question),
).map((question) =>
  /\bjavascript\b/i.test(question.prompt) &&
  !/program|javascript|comput/i.test(question.topic)
    ? { ...question, topic: "Programming" }
    : question,
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

if (import.meta.env.DEV) {
  console.info("[Chocolate Quest] Legacy question import", {
    classification: QUESTION_IMPORT_DIAGNOSTICS.classificationStatus,
    imported: QUESTION_IMPORT_DIAGNOSTICS.importedCount,
    playable: PLAYABLE_QUESTIONS.length,
    excluded: QUESTION_IMPORT_DIAGNOSTICS.excludedFromPlay,
    duplicatePromptGroups:
      QUESTION_IMPORT_DIAGNOSTICS.promptDuplicateGroups,
    levelPoolCounts: QUESTION_POOL_COUNTS,
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