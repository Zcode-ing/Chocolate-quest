import { GAME_CONFIG, LEVEL_CONFIG } from "./config";
import { getQuestionsForLevel } from "@/questions/questionData";
import type {
  AcademicLevel,
  GameQuestion,
  PlayerSkillState,
} from "./types";

export interface SelectionResult {
  question: GameQuestion;
  seed: number;
}

export function normalizePrompt(prompt: string): string {
  return prompt
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function nextRandom(seed: number): { value: number; seed: number } {
  let nextSeed = seed >>> 0;
  nextSeed ^= nextSeed << 13;
  nextSeed ^= nextSeed >>> 17;
  nextSeed ^= nextSeed << 5;
  nextSeed >>>= 0;
  return { value: nextSeed / 0x1_0000_0000, seed: nextSeed || 0x6d2b79f5 };
}

function shuffleOptions(
  question: GameQuestion,
  seed: number,
): SelectionResult {
  const options = [...question.options];
  let nextSeed = seed;
  for (let index = options.length - 1; index > 0; index -= 1) {
    const random = nextRandom(nextSeed);
    nextSeed = random.seed;
    const swapIndex = Math.floor(random.value * (index + 1));
    [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
  }
  return { question: { ...question, options }, seed: nextSeed };
}

function makeUniqueByPrompt(
  questions: GameQuestion[],
  targetDifficulty: number,
): GameQuestion[] {
  const byPrompt = new Map<string, GameQuestion>();
  for (const question of questions) {
    const key = normalizePrompt(question.prompt);
    const existing = byPrompt.get(key);
    if (
      !existing ||
      Math.abs(question.difficulty - targetDifficulty) <
        Math.abs(existing.difficulty - targetDifficulty)
    ) {
      byPrompt.set(key, question);
    }
  }
  return [...byPrompt.values()];
}

function chooseWeighted(
  questions: GameQuestion[],
  targetDifficulty: number,
  history: GameQuestion[],
  seed: number,
): SelectionResult {
  if (questions.length === 0) {
    throw new Error("No eligible questions remain for the selected round.");
  }

  const recentTopics = history.slice(-4).map((question) => question.topic);
  const weighted = questions.map((question) => {
    const distance = Math.abs(question.difficulty - targetDifficulty);
    const topicRepeatCount = recentTopics.filter(
      (topic) => topic === question.topic,
    ).length;
    const difficultyWeight = Math.exp(-distance / 20);
    const varietyWeight = 1 / (1 + topicRepeatCount * 0.45);
    return {
      question,
      weight: Math.max(0.015, difficultyWeight * varietyWeight),
    };
  });

  const totalWeight = weighted.reduce((sum, item) => sum + item.weight, 0);
  const random = nextRandom(seed);
  let cursor = random.value * totalWeight;
  let selected: GameQuestion | undefined;
  for (const item of weighted) {
    cursor -= item.weight;
    if (cursor <= 0) {
      selected = item.question;
      break;
    }
  }
  return shuffleOptions(
    selected ?? weighted[weighted.length - 1].question,
    random.seed,
  );
}

export function selectNextQuestion(input: {
  level: AcademicLevel;
  skill: PlayerSkillState;
  askedPromptKeys: string[];
  history: GameQuestion[];
  seed: number;
  boss?: boolean;
  additionalDifficulty?: number;
}): SelectionResult {
  const levelQuestions = getQuestionsForLevel(input.level, Boolean(input.boss));
  const target = Math.max(
    0,
    Math.min(
      100,
      input.skill.estimatedSkill + (input.additionalDifficulty ?? 0),
    ),
  );
  const uniqueQuestions = makeUniqueByPrompt(levelQuestions, target);
  const notAsked = uniqueQuestions.filter(
    (question) =>
      !input.askedPromptKeys.includes(normalizePrompt(question.prompt)),
  );
  const minPool = Math.min(GAME_CONFIG.questionPoolMinimum, uniqueQuestions.length);
  const nonBossNotAsked = !input.boss
    ? notAsked.filter((question) => !question.bossEligible)
    : notAsked;
  const pool =
    nonBossNotAsked.length >= minPool
      ? nonBossNotAsked
      : notAsked.length >= minPool
        ? notAsked
        : notAsked.length > 0
          ? notAsked
          : uniqueQuestions;

  return chooseWeighted(pool, target, input.history, input.seed);
}

export function chooseBossQuestions(input: {
  level: AcademicLevel;
  skill: PlayerSkillState;
  askedPromptKeys: string[];
  history: GameQuestion[];
  seed: number;
}): { questions: GameQuestion[]; seed: number } {
  const bossPool = makeUniqueByPrompt(
    getQuestionsForLevel(input.level, true),
    Math.min(
      100,
      Math.max(
        LEVEL_CONFIG[input.level].initialSkill,
        input.skill.estimatedSkill + GAME_CONFIG.bossDifficultyBonus,
      ),
    ),
  );
  const unused = bossPool.filter(
    (question) =>
      !input.askedPromptKeys.includes(normalizePrompt(question.prompt)),
  );
  const canAvoidMainRepeats = unused.length >= GAME_CONFIG.bossQuestionCount;
  const candidatePool = canAvoidMainRepeats ? unused : bossPool;

  if (candidatePool.length < GAME_CONFIG.bossQuestionCount) {
    throw new Error(
      `The ${input.level} boss pool needs at least ${GAME_CONFIG.bossQuestionCount} unique eligible questions; found ${candidatePool.length}.`,
    );
  }

  let seed = input.seed;
  const questions: GameQuestion[] = [];
  let recentHistory = input.history;
  const asked = new Set(input.askedPromptKeys);
  for (let index = 0; index < GAME_CONFIG.bossQuestionCount; index += 1) {
    const available = candidatePool.filter(
      (question) =>
        (!canAvoidMainRepeats ||
          !asked.has(normalizePrompt(question.prompt))) &&
        !questions.some(
          (selected) =>
            normalizePrompt(selected.prompt) === normalizePrompt(question.prompt),
        ),
    );
    const result = chooseWeighted(
      available,
      Math.min(100, input.skill.estimatedSkill + GAME_CONFIG.bossDifficultyBonus),
      recentHistory,
      seed,
    );
    questions.push(result.question);
    recentHistory = [...recentHistory, result.question];
    seed = result.seed;
  }

  return { questions, seed };
}