import { GAME_CONFIG, INITIAL_ABILITIES, LEVEL_CONFIG } from "./config";
import { createInitialSkill, recordSkip, updateSkill } from "./difficulty";
import { readSoundPreference, saveSoundPreference } from "./offlineDb";
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
  | {
      type: "SET_LEVEL";
      level: AcademicLevel;
      seed: number;
      runId: string;
      startingSkill?: number;
    }
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
    runId: null,
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
    feedbackStartedAt: null,
    bossQuestions: [],
    questionHistory: [],
    answerHistory: [],
    askedPromptKeys: [],
    soundEnabled: readSoundPreference(true),
    randomSeed: 0x43a2_1f57,
    inputLockedUntil: 0,
  };
}

function createReadyState(
  previous: GameState,
  level: AcademicLevel,
  seed: number,
  runId: string,
  startingSkill?: number,
): GameState {
  const initialSkill = Number.isFinite(startingSkill)
    ? Math.min(100, Math.max(0, Math.round(startingSkill as number)))
    : LEVEL_CONFIG[level].initialSkill;
  const skillState = createInitialSkill(initialSkill);
  return {
    ...createInitialState(),
    phase: "ready",
    runId,
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
    feedbackStartedAt: null,
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
        feedbackStartedAt: null,
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
  skipped = false,
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
    wrongStreak: state.skillState.wrongStreak,
    playerSkill: state.skillState.estimatedSkill,
    boss,
    correct,
    skipped,
    timedOut,
    shieldArmed: state.abilities.shieldArmed,
  });
  const nextStreak = correct ? state.streak + 1 : 0;
  const skillState = skipped
    ? recordSkip(state.skillState)
    : updateSkill(state.skillState, question, correct, responseSeconds);
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
    skipped,
    responseSeconds,
    boss,
  };
  const answered = state.stats.answered + (skipped ? 0 : 1);
  const timedAnswersAfter = state.stats.answered + (skipped ? 0 : 1);
  const stats = {
    ...state.stats,
    answered,
    correct: state.stats.correct + (correct ? 1 : 0),
    wrong: state.stats.wrong + (correct || skipped ? 0 : 1),
    skipped: state.stats.skipped + (skipped ? 1 : 0),
    bestStreak: Math.max(state.stats.bestStreak, nextStreak),
    averageSeconds: skipped
      ? state.stats.averageSeconds
      : state.stats.averageSeconds +
        (responseSeconds - state.stats.averageSeconds) /
          Math.max(1, timedAnswersAfter),
    bossCorrect: state.stats.bossCorrect + (boss && correct ? 1 : 0),
    bossWrong: state.stats.bossWrong + (boss && !correct && !skipped ? 1 : 0),
  };
  return {
    ...state,
    phase: "feedback",
    feedbackStartedAt: now,
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
        feedbackStartedAt: null,
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
        feedbackStartedAt: null,
      },
      question,
      now,
    );
  }

  if (state.roundKind === "main") {
    if (!state.timerDeadline) {
      return enterBossIntro(state);
    }
    const pausedMs = state.feedbackStartedAt
      ? Math.max(0, now - state.feedbackStartedAt)
      : 0;
    const shiftedDeadline = state.timerDeadline + pausedMs;
    if (now >= shiftedDeadline) {
      return enterBossIntro(state);
    }
    return {
      ...pickMainQuestion(state, now),
      phase: "main",
      roundKind: "main",
      questionNumber: state.questionNumber + 1,
      timerDeadline: shiftedDeadline,
      remainingMs: Math.max(0, shiftedDeadline - now),
      feedbackStartedAt: null,
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
    feedbackStartedAt: null,
    feedback: null,
    score: 0,
    streak: 0,
    bestStreak: 0,
    skillState: createInitialSkill(state.skillState.estimatedSkill),
    skill: state.skillState.estimatedSkill,
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
    if (state.abilities.shieldArmed) return state;
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
    if (state.abilities.eliminatedOptionIds.length > 0) return state;
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
  if (remaining <= 0) {
    return tick(state, now);
  }
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
  if (state.roundKind === "main" && state.phase === "main") {
    const remainingMs = Math.max(0, state.timerDeadline - now);
    if (remainingMs === 0) return enterBossIntro(state);
    return { ...state, remainingMs };
  }
  if (state.roundKind === "boss" && state.phase === "boss") {
    const bossRemainingMs = Math.max(0, state.timerDeadline - now);
    if (bossRemainingMs === 0) {
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
        feedbackStartedAt: null,
        roundKind: null,
        timerDeadline: null,
      };
    case "SET_LEVEL":
      return createReadyState(
        state,
        action.level,
        action.seed,
        action.runId,
        action.startingSkill,
      );
    case "START_ROUND":
      if (state.phase === "ready") return startMainRound(state, action.now);
      if (state.phase === "boss-intro") return startBoss(state, action.now);
      if (state.phase === "feedback") {
        return advanceAfterFeedback(state, action.now);
      }
      return state;
    case "ANSWER": {
      if (
        (state.phase !== "main" && state.phase !== "boss") ||
        (state.phase === "main" && action.now < state.inputLockedUntil) ||
        !state.currentQuestion ||
        state.abilities.eliminatedOptionIds.includes(action.optionId) ||
        !state.currentQuestion.options.some(
          (option) => option.id === action.optionId,
        )
      ) {
        return state;
      }
      if (state.timerDeadline && action.now >= state.timerDeadline) {
        return tick(state, action.now);
      }
      return resolveAnswer(state, action.optionId, action.now);
    }
    case "SKIP": {
      if (
        state.phase !== "main" ||
        action.now < state.inputLockedUntil ||
        !state.currentQuestion
      ) {
        return state;
      }
      if (state.timerDeadline && action.now >= state.timerDeadline) {
        return enterBossIntro(state);
      }
      const skipped = resolveAnswer(state, null, action.now, false, true);
      return {
        ...pickMainQuestion(
          {
            ...skipped,
            phase: "main",
            feedbackStartedAt: null,
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
    case "TOGGLE_SOUND": {
      const next = !state.soundEnabled;
      saveSoundPreference(next);
      return { ...state, soundEnabled: next };
    }
  }
}

export { createInitialState };