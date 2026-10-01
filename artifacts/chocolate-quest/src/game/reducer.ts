import { GAME_CONFIG, INITIAL_ABILITIES, LEVEL_CONFIG } from "./config";
import { createInitialSkill, recordSkip, updateSkill } from "./difficulty";
import { applyScoreBoundary, scoreAnswer } from "./scoring";
import {
  chooseBossQuestions,
  normalizePrompt,
  selectNextQuestion,
} from "./questionSelection";
import type {
  AbilityId,
  AcademicLevel,
  AnswerFeedback,
  AnswerRecord,
  GameQuestion,
  GameState,
} from "./types";

type Action =
  | { type: "SHOW_LEVELS" }
  | { type: "SET_LEVEL"; level: AcademicLevel; seed: number }
  | { type: "START_ROUND"; now: number }
  | { type: "ANSWER"; optionId: string; now: number }
  | { type: "SKIP"; now: number }
  | { type: "USE_ABILITY"; ability: AbilityId; now: number }
  | { type: "TICK"; now: number }
  | { type: "ADVANCE"; now: number }
  | { type: "TOGGLE_SOUND" }
  | { type: "CHANGE_LEVEL" };

const emptyStats = {
  answered: 0,
  correct: 0,
  wrong: 0,
  skipped: 0,
  bestStreak: 0,
  averageSeconds: 0,
  bossCorrect: 0,
  bossWrong: 0,
};

function createInitialState(): GameState {
  return {
    phase: "intro",
    level: null,
    currentQuestion: null,
    questionNumber: 0,
    bossQuestionNumber: 0,
    remainingMs: GAME_CONFIG.mainRoundDurationMs,
    bossRemainingMs: GAME_CONFIG.bossQuestionDurationMs,
    score: 0,
    streak: 0,
    bestStreak: 0,
    skill: 0,
    skillState: createInitialSkill(0),
    feedback: null,
    abilities: { ...INITIAL_ABILITIES, eliminatedOptionIds: [] },
    stats: { ...emptyStats },
    roundKind: null,
    timerDeadline: null,
    questionStartedAt: null,
    bossQuestions: [],
    questionHistory: [],
    answerHistory: [],
    askedPromptKeys: [],
    soundEnabled: false,
    randomSeed: 0x43a2_1f57,
    inputLockedUntil: 0,
  };
}

function createReadyState(
  previous: GameState,
  level: AcademicLevel,
  seed: number,
): GameState {
  const skillState = createInitialSkill(LEVEL_CONFIG[level].initialSkill);
  return {
    ...createInitialState(),
    phase: "ready",
    level,
    skill: skillState.estimatedSkill,
    skillState,
    soundEnabled: previous.soundEnabled,
    randomSeed: seed || 0x43a2_1f57,
  };
}

function rememberQuestion(
  state: GameState,
  question: GameQuestion,
  now: number,
): GameState {
  const promptKey = normalizePrompt(question.prompt);
  return {
    ...state,
    currentQuestion: question,
    questionStartedAt: now,
    feedback: null,
    abilities: { ...state.abilities, eliminatedOptionIds: [] },
    questionHistory: [...state.questionHistory, question],
    askedPromptKeys: [...state.askedPromptKeys, promptKey],
  };
}

function pickMainQuestion(state: GameState, now: number): GameState {
  if (!state.level) return state;
  const selection = selectNextQuestion({
    level: state.level,
    skill: state.skillState,
    askedPromptKeys: state.askedPromptKeys,
    history: state.questionHistory,
    seed: state.randomSeed,
  });
  return {
    ...rememberQuestion(state, selection.question, now),
    randomSeed: selection.seed,
  };
}

function enterBossIntro(state: GameState): GameState {
  if (!state.level) return state;
  const selection = chooseBossQuestions({
    level: state.level,
    skill: state.skillState,
    askedPromptKeys: state.askedPromptKeys,
    history: state.questionHistory,
    seed: state.randomSeed,
  });
  return {
    ...state,
    phase: "boss-intro",
    currentQuestion: null,
    questionStartedAt: null,
    feedback: null,
    roundKind: null,
    timerDeadline: null,
    remainingMs: 0,
    bossRemainingMs: GAME_CONFIG.bossQuestionDurationMs,
    bossQuestionNumber: 0,
    bossQuestions: selection.questions,
    randomSeed: selection.seed,
    abilities: { ...state.abilities, eliminatedOptionIds: [] },
  };
}

function startBoss(state: GameState, now: number): GameState {
  if (state.bossQuestions.length !== GAME_CONFIG.bossQuestionCount) {
    throw new Error(
      `Boss round requires exactly ${GAME_CONFIG.bossQuestionCount} questions; found ${state.bossQuestions.length}.`,
    );
  }
  const question = state.bossQuestions[0];
  return {
    ...rememberQuestion(
      {
        ...state,
        phase: "boss",
        roundKind: "boss",
        bossQuestionNumber: 1,
        timerDeadline: now + GAME_CONFIG.bossQuestionDurationMs,
        bossRemainingMs: GAME_CONFIG.bossQuestionDurationMs,
      },
      question,
      now,
    ),
  };
}

function resolveAnswer(
  state: GameState,
  selectedOptionId: string | null,
  now: number,
  timedOut = false,
): GameState {
  const question = state.currentQuestion;
  if (!question || !state.roundKind || !state.questionStartedAt) return state;
  const boss = state.roundKind === "boss";
  const correct = selectedOptionId === question.correctOptionId && !timedOut;
  const responseSeconds = Math.max(0.1, (now - state.questionStartedAt) / 1000);
  const score = scoreAnswer({
    question,
    responseSeconds,
    streak: state.streak,
    playerSkill: state.skillState.estimatedSkill,
    boss,
    correct,
    shieldArmed: state.abilities.shieldArmed,
  });
  const nextStreak = correct ? state.streak + 1 : 0;
  const skillState = updateSkill(
    state.skillState,
    question,
    correct,
    responseSeconds,
  );
  const feedback: AnswerFeedback = {
    correct,
    points: score.points,
    label: timedOut
      ? "Time's up"
      : score.label,
    selectedOptionId,
    correctOptionId: question.correctOptionId,
    timedOut,
    boss,
  };
  const record: AnswerRecord = {
    questionId: question.id,
    promptKey: normalizePrompt(question.prompt),
    topic: question.topic,
    difficulty: question.difficulty,
    correct,
    skipped: false,
    responseSeconds,
    boss,
  };
  const answered = state.stats.answered + 1;
  const stats = {
    ...state.stats,
    answered,
    correct: state.stats.correct + (correct ? 1 : 0),
    wrong: state.stats.wrong + (correct ? 0 : 1),
    bestStreak: Math.max(state.stats.bestStreak, nextStreak),
    averageSeconds:
      state.stats.averageSeconds +
      (responseSeconds - state.stats.averageSeconds) / answered,
    bossCorrect: state.stats.bossCorrect + (boss && correct ? 1 : 0),
    bossWrong: state.stats.bossWrong + (boss && !correct ? 1 : 0),
  };
  return {
    ...state,
    phase: "feedback",
    score: applyScoreBoundary(state.score + score.points),
    streak: nextStreak,
    bestStreak: Math.max(state.bestStreak, nextStreak),
    skill: skillState.estimatedSkill,
    skillState,
    feedback,
    stats,
    answerHistory: [...state.answerHistory, record],
    abilities: {
      ...state.abilities,
      shieldArmed: score.shieldConsumed ? false : state.abilities.shieldArmed,
      eliminatedOptionIds: [],
    },
  };
}

function advanceAfterFeedback(state: GameState, now: number): GameState {
  if (state.roundKind === "boss") {
    if (state.bossQuestionNumber >= GAME_CONFIG.bossQuestionCount) {
      return {
        ...state,
        phase: "result",
        roundKind: null,
        timerDeadline: null,
        questionStartedAt: null,
        feedback: null,
        bossRemainingMs: 0,
      };
    }
    const nextNumber = state.bossQuestionNumber + 1;
    const question = state.bossQuestions[nextNumber - 1];
    return rememberQuestion(
      {
        ...state,
        phase: "boss",
        bossQuestionNumber: nextNumber,
        bossRemainingMs: GAME_CONFIG.bossQuestionDurationMs,
        timerDeadline: now + GAME_CONFIG.bossQuestionDurationMs,
      },
      question,
      now,
    );
  }

  if (state.roundKind === "main") {
    if (!state.timerDeadline || now >= state.timerDeadline) {
      return enterBossIntro(state);
    }
    return {
      ...pickMainQuestion(state, now),
      phase: "main",
      roundKind: "main",
      questionNumber: state.questionNumber + 1,
    };
  }
  return state;
}

function startMainRound(state: GameState, now: number): GameState {
  const reset: GameState = {
    ...state,
    phase: "main",
    roundKind: "main",
    questionNumber: 1,
    bossQuestionNumber: 0,
    remainingMs: GAME_CONFIG.mainRoundDurationMs,
    bossRemainingMs: GAME_CONFIG.bossQuestionDurationMs,
    timerDeadline: now + GAME_CONFIG.mainRoundDurationMs,
    questionStartedAt: null,
    feedback: null,
    score: 0,
    streak: 0,
    bestStreak: 0,
    skillState: createInitialSkill(
      state.level ? LEVEL_CONFIG[state.level].initialSkill : 0,
    ),
    skill: state.level ? LEVEL_CONFIG[state.level].initialSkill : 0,
    abilities: { ...INITIAL_ABILITIES, eliminatedOptionIds: [] },
    stats: { ...emptyStats },
    bossQuestions: [],
    questionHistory: [],
    answerHistory: [],
    askedPromptKeys: [],
  };
  return pickMainQuestion(reset, now);
}

function nextRandom(seed: number): { value: number; seed: number } {
  let nextSeed = seed >>> 0;
  nextSeed ^= nextSeed << 13;
  nextSeed ^= nextSeed >>> 17;
  nextSeed ^= nextSeed << 5;
  nextSeed >>>= 0;
  return { value: nextSeed / 0x1_0000_0000, seed: nextSeed || 0x43a2_1f57 };
}

function useAbility(
  state: GameState,
  ability: AbilityId,
  now: number,
): GameState {
  if (state.phase !== "main" && state.phase !== "boss") return state;
  if (!state.currentQuestion || state.abilities[ability] < 1) return state;

  if (ability === "shield") {
    return {
      ...state,
      abilities: {
        ...state.abilities,
        shield: state.abilities.shield - 1,
        shieldArmed: true,
      },
    };
  }

  if (ability === "fiftyFifty") {
    const incorrectOptions = state.currentQuestion.options.filter(
      (option) =>
        option.id !== state.currentQuestion?.correctOptionId &&
        !state.abilities.eliminatedOptionIds.includes(option.id),
    );
    if (incorrectOptions.length < 2) return state;

    let seed = state.randomSeed;
    const remaining = [...incorrectOptions];
    const removed: string[] = [];
    for (let count = 0; count < 2; count += 1) {
      const random = nextRandom(seed);
      seed = random.seed;
      const index = Math.floor(random.value * remaining.length);
      removed.push(remaining.splice(index, 1)[0].id);
    }
    return {
      ...state,
      randomSeed: seed,
      abilities: {
        ...state.abilities,
        fiftyFifty: state.abilities.fiftyFifty - 1,
        eliminatedOptionIds: [
          ...state.abilities.eliminatedOptionIds,
          ...removed,
        ],
      },
    };
  }

  const remaining = Math.max(0, (state.timerDeadline ?? now) - now);
  const roundMaximum =
    state.phase === "boss"
      ? GAME_CONFIG.bossQuestionDurationMs + GAME_CONFIG.timeBurstMs
      : GAME_CONFIG.maxMainTimeMs;
  const newRemaining = Math.min(roundMaximum, remaining + GAME_CONFIG.timeBurstMs);
  return {
    ...state,
    timerDeadline: now + newRemaining,
    remainingMs: state.phase === "main" ? newRemaining : state.remainingMs,
    bossRemainingMs: state.phase === "boss" ? newRemaining : state.bossRemainingMs,
    abilities: {
      ...state.abilities,
      timeBurst: state.abilities.timeBurst - 1,
    },
  };
}

function tick(state: GameState, now: number): GameState {
  if (!state.timerDeadline) return state;
  if (
    state.roundKind === "main" &&
    (state.phase === "main" || state.phase === "feedback")
  ) {
    const remainingMs = Math.max(0, state.timerDeadline - now);
    if (remainingMs === 0 && state.phase === "main") return enterBossIntro(state);
    return { ...state, remainingMs };
  }
  if (
    state.roundKind === "boss" &&
    (state.phase === "boss" || state.phase === "feedback")
  ) {
    const bossRemainingMs = Math.max(0, state.timerDeadline - now);
    if (bossRemainingMs === 0 && state.phase === "boss") {
      return resolveAnswer(state, null, now, true);
    }
    return { ...state, bossRemainingMs };
  }
  return state;
}

export function gameReducer(
  state: GameState,
  action: Action,
): GameState {
  switch (action.type) {
    case "SHOW_LEVELS":
    case "CHANGE_LEVEL":
      return {
        ...state,
        phase: "level-select",
        currentQuestion: null,
        feedback: null,
        roundKind: null,
        timerDeadline: null,
      };
    case "SET_LEVEL":
      return createReadyState(state, action.level, action.seed);
    case "START_ROUND":
      if (state.phase === "ready") return startMainRound(state, action.now);
      if (state.phase === "boss-intro") return startBoss(state, action.now);
      if (state.phase === "feedback") {
        return advanceAfterFeedback(state, action.now);
      }
      return state;
    case "ANSWER":
      if (
        (state.phase !== "main" && state.phase !== "boss") ||
        !state.currentQuestion ||
        state.abilities.eliminatedOptionIds.includes(action.optionId) ||
        !state.currentQuestion.options.some(
          (option) => option.id === action.optionId,
        )
      ) {
        return state;
      }
      return resolveAnswer(state, action.optionId, action.now);
    case "SKIP": {
      if (state.phase === "boss" && state.currentQuestion) {
        const skipped = resolveAnswer(state, null, action.now);
        return {
          ...skipped,
          feedback: skipped.feedback
            ? { ...skipped.feedback, label: "Boss question skipped" }
            : null,
          stats: { ...skipped.stats, skipped: skipped.stats.skipped + 1 },
          answerHistory: skipped.answerHistory.map((record, index) =>
            index === skipped.answerHistory.length - 1
              ? { ...record, skipped: true }
              : record,
          ),
        };
      }
      if (
        state.phase !== "main" ||
        action.now < state.inputLockedUntil ||
        !state.currentQuestion
      ) {
        return state;
      }
      const responseSeconds = Math.max(
        0,
        (action.now - (state.questionStartedAt ?? action.now)) / 1000,
      );
      const skippedRecord: AnswerRecord = {
        questionId: state.currentQuestion.id,
        promptKey: normalizePrompt(state.currentQuestion.prompt),
        topic: state.currentQuestion.topic,
        difficulty: state.currentQuestion.difficulty,
        correct: false,
        skipped: true,
        responseSeconds,
        boss: false,
      };
      return {
        ...pickMainQuestion(
          {
            ...state,
            phase: "main",
            skillState: recordSkip(state.skillState),
            streak: 0,
            stats: { ...state.stats, skipped: state.stats.skipped + 1 },
            answerHistory: [...state.answerHistory, skippedRecord],
            questionNumber: state.questionNumber + 1,
            inputLockedUntil: action.now + GAME_CONFIG.skipCooldownMs,
          },
          action.now,
        ),
      };
    }
    case "USE_ABILITY":
      return useAbility(state, action.ability, action.now);
    case "TICK":
      return tick(state, action.now);
    case "ADVANCE":
      return state.phase === "feedback"
        ? advanceAfterFeedback(state, action.now)
        : state;
    case "TOGGLE_SOUND":
      return { ...state, soundEnabled: !state.soundEnabled };
  }
}

export { createInitialState };