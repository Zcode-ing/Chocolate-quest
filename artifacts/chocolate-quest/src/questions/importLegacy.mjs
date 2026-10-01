import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const legacyDir = resolve(here, "legacy/raw");
const outputPath = resolve(here, "legacyQuestions.generated.json");

const sources = [
  { bank: "active-script", file: "script.js", variable: "questions" },
  { bank: "easy", file: "easy.txt", variable: "questions" },
  { bank: "medium", file: "medium.txt", variable: "questions" },
  { bank: "mixed", file: "mixed.txt", variable: "mixedQuestions" },
  {
    bank: "extreme",
    file: "extreme.txt",
    variable: "extremeLevelQuestions",
  },
];

const sourceCalibration = {
  "active-script": { difficulty: 38, gradeBands: ["junior", "semi-senior", "senior"] },
  easy: { difficulty: 29, gradeBands: ["junior", "semi-senior"] },
  medium: { difficulty: 54, gradeBands: ["semi-senior", "senior", "ultra-advanced"] },
  mixed: { difficulty: 42, gradeBands: ["junior", "semi-senior", "senior"] },
  extreme: { difficulty: 81, gradeBands: ["ultra-advanced"] },
};

const manualReviewFlags = {
  "active-script:55": ["answer-key-needs-review"],
  "active-script:60": ["question-answer-category-mismatch"],
  "easy:41": ["answer-key-needs-review"],
  "easy:61": ["factual-claim-needs-review"],
  "medium:39": ["answer-key-needs-review"],
  "medium:46": ["answer-key-needs-review"],
  "extreme:37": ["nonstandard-term-and-answer-needs-review"],
};

function extractArray(sourceText, variableName) {
  const closingLine = /(?:\r?\n)\s*\](?:;)?/.exec(sourceText);
  if (!closingLine) {
    throw new Error(`Could not find the end of ${variableName} array`);
  }
  const arrayEnd = closingLine.index + closingLine[0].lastIndexOf("]");
  const arrayStart = sourceText.indexOf("[");
  if (arrayStart < 0 || arrayStart > arrayEnd) {
    throw new Error(`Could not find the start of ${variableName} array`);
  }
  const expression = sourceText.slice(arrayStart, arrayEnd + 1);
  const sandbox = Object.create(null);
  runInNewContext(
    `globalThis.__result = (${expression});`,
    sandbox,
    { timeout: 250 },
  );
  if (!Array.isArray(sandbox.__result)) {
    throw new Error(`${variableName} did not evaluate to an array`);
  }
  return sandbox.__result;
}

function promptKey(prompt) {
  return prompt
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function inferTopic(prompt) {
  const text = prompt.toLowerCase();
  if (
    /\b(triangle|square root|perimeter|area|percent|solve for|sum of|angles|pi)\b/.test(
      text,
    ) ||
    /\b\d+\s*[×÷+]\s*\d+\b/.test(text)
  ) {
    return "Mathematics";
  }
  if (
    /\b(chemical|element|planet|mammal|blood|gravity|earth's atmosphere|atomic number|organ|gas found)\b/.test(
      text,
    )
  ) {
    return "Science";
  }
  if (
    /\b(president|river|world war|capital city|capital of|discovered america|country|civilization|nobel|barrier reef|india gain independence|titanic)\b/.test(
      text,
    )
  ) {
    return "Social studies";
  }
  return "Computing";
}

function deriveDifficulty(bank, prompt) {
  const base = sourceCalibration[bank].difficulty;
  const words = prompt.trim().split(/\s+/).length;
  const technicalTerms =
    /\b(distributed|consensus|microservices|eventual consistency|vector clocks|bloom filter|paxos|mapreduce|sharding|time complexity|CAP theorem|database systems)\b/i.test(
      prompt,
    );
  const lengthAdjustment = Math.min(8, Math.max(0, Math.floor((words - 8) / 5)));
  return Math.max(0, Math.min(100, base + lengthAdjustment + (technicalTerms ? 7 : 0)));
}

function deriveEstimatedSeconds(prompt, options) {
  const totalWords =
    prompt.trim().split(/\s+/).length +
    options.reduce((sum, option) => sum + option.trim().split(/\s+/).length, 0);
  return Math.max(6, Math.min(14, 5 + Math.ceil(totalWords / 22)));
}

const rawQuestions = [];
for (const source of sources) {
  const sourceText = await readFile(resolve(legacyDir, source.file), "utf8");
  const entries = extractArray(sourceText, source.variable);
  entries.forEach((entry, index) => {
    const sourceIndex = index + 1;
    const sourceId = `${source.bank}:${sourceIndex}`;
    const prompt =
      typeof entry?.question === "string" ? entry.question : String(entry?.question ?? "");
    const options = Array.isArray(entry?.options)
      ? entry.options.map((option) => String(option))
      : [];
    const originalAnswer =
      typeof entry?.answer === "string" ? entry.answer : String(entry?.answer ?? "");
    const reviewFlags = [
      ...(manualReviewFlags[sourceId] ?? []),
      ...(prompt.includes("\uFFFD") ||
      options.some((option) => option.includes("\uFFFD")) ||
      originalAnswer.includes("\uFFFD")
        ? ["encoding-corruption"]
        : []),
      ...(options.length !== new Set(options).size ? ["duplicate-options"] : []),
      ...(options.length !== 4 ? ["malformed-option-count"] : []),
      ...(!options.includes(originalAnswer) ? ["answer-not-present-in-options"] : []),
      ...(!prompt.trim() ? ["missing-prompt"] : []),
    ];
    const optionIds = options.map((_, optionIndex) => `${source.bank}-${sourceIndex}-o${optionIndex + 1}`);
    const correctOptionIndex = options.indexOf(originalAnswer);
    const difficulty = deriveDifficulty(source.bank, prompt);

    rawQuestions.push({
      id: `${source.bank}-${String(sourceIndex).padStart(3, "0")}`,
      prompt,
      originalPrompt: prompt,
      topic: inferTopic(prompt),
      difficulty,
      estimatedSeconds: deriveEstimatedSeconds(prompt, options),
      type: "mcq",
      options: options.map((text, optionIndex) => ({
        id: optionIds[optionIndex],
        text,
      })),
      correctOptionId:
        correctOptionIndex >= 0 ? optionIds[correctOptionIndex] : "",
      gradeBands: sourceCalibration[source.bank].gradeBands,
      sourceBank: source.bank,
      sourceIndex,
      calibrationStatus: "provisional",
      reviewFlags,
      eligibleForPlay: !reviewFlags.some((flag) => flag !== "duplicate-prompt"),
      bossEligible: difficulty >= sourceCalibration[source.bank].difficulty,
      tags: [source.bank],
      originalAnswer,
    });
  });
}

const byPrompt = new Map();
for (const question of rawQuestions) {
  const key = promptKey(question.prompt);
  if (!key) continue;
  byPrompt.set(key, [...(byPrompt.get(key) ?? []), question]);
}
for (const group of byPrompt.values()) {
  if (group.length < 2) continue;
  for (const question of group) {
    if (!question.reviewFlags.includes("duplicate-prompt")) {
      question.reviewFlags.push("duplicate-prompt");
    }
  }
}

const diagnostics = {
  classificationStatus: "provisional; derived from source banks and prompt text",
  importedCount: rawQuestions.length,
  sourceCounts: Object.fromEntries(
    sources.map((source) => [
      source.bank,
      rawQuestions.filter((question) => question.sourceBank === source.bank).length,
    ]),
  ),
  excludedFromPlay: rawQuestions.filter((question) => !question.eligibleForPlay).length,
  flaggedCount: rawQuestions.filter((question) => question.reviewFlags.length > 0).length,
  promptDuplicateGroups: [...byPrompt.values()].filter((group) => group.length > 1).length,
  flaggedQuestions: rawQuestions
    .filter((question) => question.reviewFlags.length > 0)
    .map(({ id, prompt, reviewFlags, eligibleForPlay }) => ({
      id,
      prompt,
      reviewFlags,
      eligibleForPlay,
    })),
};

await writeFile(
  outputPath,
  `${JSON.stringify({ questions: rawQuestions, diagnostics }, null, 2)}\n`,
  "utf8",
);

console.info(
  `Imported ${diagnostics.importedCount} questions from ${Object.keys(diagnostics.sourceCounts).length} preserved sources.`,
);
console.info(
  `Marked ${diagnostics.flaggedCount} records for review; ${diagnostics.excludedFromPlay} are withheld from gameplay until repaired. Found ${diagnostics.promptDuplicateGroups} exact prompt-duplicate groups.`,
);
console.info(`Output: ${outputPath}`);