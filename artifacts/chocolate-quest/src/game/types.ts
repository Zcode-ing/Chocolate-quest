export const ACADEMIC_LEVELS = [
  "junior",
  "semi-senior",
  "senior",
  "ultra-advanced",
] as const;

export type AcademicLevel = (typeof ACADEMIC_LEVELS)[number];
export type AbilityId = "shield" | "fiftyFifty" | "timeBurst";
export type QuestionType = "mcq";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface MultipleChoiceQuestion {
  id: string;
  prompt: string;
  originalPrompt: string;
  topic: string;
  difficulty: number;
  estimatedSeconds: number;
  type: "mcq";
  options: QuestionOption[];
  correctOptionId: string;
  gradeBands: AcademicLevel[];
  sourceBank: string;
  sourceIndex: number;
  calibrationStatus: "provisional";
  reviewFlags: string[];
  eligibleForPlay: boolean;
  bossEligible: boolean;
  tags: string[];
  originalAnswer: string;
}

export type GameQuestion = MultipleChoiceQuestion;

export type GamePhase =
  | "intro"
  | "level-select"
  | "ready"
  | "main"
  | "feedback"
  | "boss-intro"
  | "boss"
  | "result";

export type RoundKind = "main" | "boss" | null;

export interface PlayerSkillState {
  estimatedSkill: number;
  recentAccuracy: number;
  recentSpeed: number;
  currentStreak: number;
  wrongStreak: number;
  skippedCount: number;
  questionsAnswered: number;
  averageResponseTime: number;
  confidenceTrend: number;
  recentOutcomes: number[];
}

export interface AbilityInventory {
  shield: number;
  fiftyFifty: number;
  timeBurst: number;
  shieldArmed: boolean;
  eliminatedOptionIds: string[];
}

export interface GameStats {
  answered: number;
  correct: number;
  wrong: number;
  skipped: number;
  bestStreak: number;
  averageSeconds: number;
  bossCorrect: number;
  bossWrong: number;
}

export interface AnswerFeedback {
  correct: boolean;
  points: number;
  label: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  timedOut: boolean;
  boss: boolean;
}

export interface AnswerRecord {
  questionId: string;
  promptKey: string;
  topic: string;
  difficulty: number;
  correct: boolean;
  skipped: boolean;
  responseSeconds: number;
  boss: boolean;
}

export interface GameState {
  phase: GamePhase;
  runId: string | null;
  level: AcademicLevel | null;
  currentQuestion: GameQuestion | null;
  questionNumber: number;
  bossQuestionNumber: number;
  remainingMs: number;
  bossRemainingMs: number;
  score: number;
  streak: number;
  bestStreak: number;
  skill: number;
  skillState: PlayerSkillState;
  feedback: AnswerFeedback | null;
  abilities: AbilityInventory;
  stats: GameStats;
  roundKind: RoundKind;
  timerDeadline: number | null;
  questionStartedAt: number | null;
  bossQuestions: GameQuestion[];
  questionHistory: GameQuestion[];
  answerHistory: AnswerRecord[];
  askedPromptKeys: string[];
  soundEnabled: boolean;
  randomSeed: number;
  inputLockedUntil: number;
}

export interface GameController {
  state: GameState;
  showLevelSelect: () => void;
  startRun: (level: AcademicLevel, startingSkill?: number) => void;
  startRound: () => void;
  answer: (optionId: string) => void;
  skip: () => void;
  useAbility: (ability: AbilityId) => void;
  playAgain: (startingSkill?: number) => void;
  changeLevel: () => void;
  toggleSound: () => void;
}