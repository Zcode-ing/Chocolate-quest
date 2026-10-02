import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, AudioLines, Award, Bolt, Check, ChevronRight,
  Clock3, Crown, Flame, Keyboard, Lightbulb, LockKeyhole, Play, RotateCcw,
  Shield, Sparkles, X, Zap,
} from 'lucide-react';
import { useGameController } from '@/game/useGameController';
import { playSoundEnabledChime } from '@/game/sound';
import { GAME_CONFIG } from '@/game/config';
import { getCocoaStanding } from '@/game/cocoaLoyalty';
import { useCocoaPlayers } from '@/game/cocoaPlayers';
import { PLAYABLE_QUESTIONS, QUESTION_IMPORT_DIAGNOSTICS, QUESTION_POOL_COUNTS } from '@/questions/questionData';
import { GameHeader } from '@/components/GameHeader';
import { AnswerOption } from '@/components/AnswerOption';
import { PreGameGate } from '@/components/PreGameGate';

type LevelId = 'junior' | 'semi-senior' | 'senior' | 'ultra-advanced';
type AbilityId = 'shield' | 'fiftyFifty' | 'timeBurst';
type LevelInfo = { id: LevelId; title: string; classes: string; note: string; mark: string };

const LEVELS: LevelInfo[] = [
  { id: 'junior', title: 'Junior', classes: 'Classes 7–8', note: 'Curious minds, quick sparks', mark: '01' },
  { id: 'semi-senior', title: 'Semi-Senior', classes: 'Classes 9–10', note: 'Build on what you know', mark: '02' },
  { id: 'senior', title: 'Senior', classes: 'Classes 11–12', note: 'Make every second count', mark: '03' },
  { id: 'ultra-advanced', title: 'Ultra Advanced', classes: 'B.Tech', note: 'For the beautifully brainy', mark: '04' },
];

function App() {
  const game = useGameController();
  const { state } = game;
  const loyalty = useCocoaPlayers(
    state.phase,
    state.runId,
    state.level,
    state.answerHistory,
    state.skillState.estimatedSkill,
  );
  const [showIntro, setShowIntro] = useState(false);
  const [showPlayerGate, setShowPlayerGate] = useState(false);

  const flipSound = useCallback(() => {
    if (!state.soundEnabled) playSoundEnabledChime();
    game.toggleSound();
  }, [game.toggleSound, state.soundEnabled]);

  const selectPlayer = useCallback((username: string) => {
    if (!loyalty.selectPlayer(username)) return;
    setShowPlayerGate(false);
    setShowIntro(false);
    game.showLevelSelect();
  }, [game.showLevelSelect, loyalty.selectPlayer]);

  const exitPlayerGate = useCallback(() => {
    setShowPlayerGate(false);
    setShowIntro(true);
  }, []);

  const playAgain = useCallback(() => {
    if (state.level) game.playAgain(loyalty.difficultyFor(state.level));
    else game.playAgain();
  }, [game.playAgain, loyalty.difficultyFor, state.level]);

  const chooseAnswer = useCallback((optionId: string) => {
    if (state.phase === 'main' || state.phase === 'boss') game.answer(optionId);
  }, [game, state.phase]);

  const continueRound = useCallback(() => {
    if (state.phase === 'ready') game.startRound();
    else if (state.phase === 'boss-intro' || state.phase === 'feedback') game.startRound();
  }, [game, state.phase]);

  const skipQuestion = useCallback(() => {
    if (state.phase === 'main') game.skip();
  }, [game, state.phase]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '')) return;
      if (/^[1-4]$/.test(event.key) && (state.phase === 'main' || state.phase === 'boss')) {
        const option = state.currentQuestion?.options[Number(event.key) - 1];
        if (option && !state.abilities.eliminatedOptionIds.includes(option.id)) chooseAnswer(option.id);
      }
      if (event.key === ' ' && ['ready', 'boss-intro', 'feedback'].includes(state.phase)) {
        event.preventDefault();
        continueRound();
      }
       if ((event.key.toLowerCase() === 's' || event.key === 'Escape') && state.phase === 'main') {
        skipQuestion();
      }
       if (event.key === 'Enter' && state.phase === 'level-select' && state.level) {
         game.startRun(state.level as LevelId, loyalty.difficultyFor(state.level));
       }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [chooseAnswer, continueRound, game, loyalty.difficultyFor, skipQuestion, state.abilities.eliminatedOptionIds, state.currentQuestion, state.level, state.phase]);

  const selectedLevel = LEVELS.find((level) => level.id === state.level);
  const isPlay = state.phase === 'main' || state.phase === 'boss' || state.phase === 'feedback';
  const isBoss = state.phase === 'boss' || (state.phase === 'feedback' && Boolean(state.feedback?.boss));
  const question = state.currentQuestion;
  const activeTimerMs = isBoss ? state.bossRemainingMs : state.remainingMs;
  const activeTimerTotalMs = isBoss
    ? GAME_CONFIG.bossQuestionDurationMs
    : GAME_CONFIG.mainRoundDurationMs;
  const activeBossQuestion = Math.max(1, Math.min(3, state.bossQuestionNumber || 1));
  const resultBeans = loyalty.activePlayer
    ? loyalty.activePlayer.beans +
      (loyalty.activePlayer.lastRunId === state.runId
        ? 0
        : loyalty.runProgress.beansEarned)
    : 0;
  const resultStanding = loyalty.activePlayer ? getCocoaStanding(resultBeans) : null;

  return (
    <main className="game-frame flex min-h-[100dvh] flex-col">
      <GameHeader soundOn={state.soundEnabled} onToggleSound={flipSound} />
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 pb-8 sm:px-8 lg:px-12">
        {showPlayerGate && (
          <PreGameGate
            players={loyalty.players}
            onSelectPlayer={selectPlayer}
            onExit={exitPlayerGate}
            onDifficultyChange={loyalty.setPlayerDifficulty}
            questionCounts={QUESTION_POOL_COUNTS}
            totalQuestions={PLAYABLE_QUESTIONS.length}
            importedQuestionCount={QUESTION_IMPORT_DIAGNOSTICS.importedCount}
            soundEnabled={state.soundEnabled}
          />
        )}

        {!showPlayerGate && (state.phase === 'intro' || showIntro) && (
          <section className="intro-layout enter-up mx-auto grid w-full max-w-6xl flex-1 items-center gap-9 py-9 lg:grid-cols-[1fr_.83fr] lg:gap-20">
            <div className="relative z-10 py-5">
              <div className="eyebrow"><span className="eyebrow-dot" /> CBSE EXHIBITION • KNOWLEDGE ARCADE</div>
              <h1 className="display-serif mt-7 max-w-[720px] text-[clamp(4rem,9vw,8.4rem)] leading-[.82] tracking-[-.065em] text-[#38241b]">
                Think fast.<br /><span className="text-[#a97030]">Taste</span> victory.
              </h1>
              <p className="mt-7 max-w-[460px] text-lg leading-7 text-[#705c4b] sm:text-xl">
                Computers, software, hardware, and the ideas behind them. One minute on the clock, then meet the three-question boss.
              </p>
              <button type="button" data-testid="button-start-quest" onClick={() => { setShowIntro(false); setShowPlayerGate(true); }} className="primary-button mt-9">
                Choose your player <ArrowRight size={18} strokeWidth={2.2} />
              </button>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-[.14em] text-[#8a7662]">
                <span className="inline-flex items-center gap-2"><Clock3 size={14} /> 60 seconds</span>
                <span className="inline-flex items-center gap-2"><Crown size={14} /> 3-question boss</span>
                <span className="inline-flex items-center gap-2"><Keyboard size={14} /> Keys 1–4</span>
              </div>
              <CocoaEntryCard loyalty={loyalty} />
            </div>
            <div className="hero-art relative mx-auto flex min-h-[330px] w-full max-w-[530px] items-center justify-center lg:min-h-[500px]">
              <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
              <div className="chocolate-seal">
                <div className="seal-inner">
                  <span className="seal-stamp">CQ</span>
                  <div className="seal-lines" />
                  <span className="seal-caption">BRAIN<br />FOOD</span>
                </div>
              </div>
              <div className="art-note note-top"><Sparkles size={15} /> THE QUICK THINKER</div>
              <div className="art-note note-bottom"><span className="mini-square" /> FRESHLY MINTED CHALLENGES</div>
              <div className="orbit-number">60<span>SEC</span></div>
            </div>
          </section>
        )}

        {state.phase === 'level-select' && !showIntro && !showPlayerGate && (
          <section className="enter-up mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-10">
            <button type="button" data-testid="button-back-intro" className="back-link mb-9 w-fit" onClick={() => setShowIntro(true)}>
              <ArrowLeft size={16} /> Back to the beginning
            </button>
            <div className="eyebrow"><span className="eyebrow-dot" /> PICK YOUR PLAYING FIELD</div>
            <h1 className="display-serif mt-4 text-5xl tracking-[-.04em] sm:text-7xl">How sharp are<br className="sm:hidden" /> we feeling?</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#705c4b]">
              Playing as <strong className="text-[#38241b]">{loyalty.activePlayer?.username}</strong>. Choose a level; your saved skill will tune its difficulty.
            </p>
            <button
              type="button"
              data-testid="button-switch-player"
              className="back-link mt-4 w-fit"
              onClick={() => {
                loyalty.leavePlayer();
                setShowPlayerGate(true);
              }}
            >
              Switch player
            </button>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {LEVELS.map((level) => {
                const active = state.level === level.id;
                return (
                  <button type="button" key={level.id} data-testid={`button-level-${level.id}`} aria-pressed={active}
                    onClick={() => game.startRun(level.id, loyalty.difficultyFor(level.id))}
                    className={`level-choice ${active ? 'is-selected' : ''}`}>
                    <span className="level-mark mono">{level.mark}</span>
                    <span className="level-copy"><strong>{level.title}</strong><span>{level.classes} · {level.note}</span></span>
                    <span className="level-arrow"><ArrowDownRight size={19} /></span>
                  </button>
                );
              })}
            </div>
            <div className="mt-7 flex items-center gap-2 text-sm text-[#826e5a]"><LockKeyhole size={14} /> Just for fun. No grades, no pressure.</div>
            <CocoaEntryCard loyalty={loyalty} compact />
          </section>
        )}

        {state.phase === 'ready' && (
          <section className="enter-up flex flex-1 items-center justify-center py-8">
            <div className="ready-panel w-full max-w-[740px] text-center">
              <div className="ready-topline"><span>LEVEL SELECTED</span><span className="ready-line" /><span>{selectedLevel?.classes ?? selectedLevel?.title ?? 'YOUR LEVEL'}</span></div>
              <div className="ready-emblem mx-auto mt-10"><Bolt size={34} fill="currentColor" /></div>
              <p className="eyebrow mt-8 justify-center"><span className="eyebrow-dot" /> YOUR RUN IS READY</p>
              <h1 className="display-serif mt-4 text-6xl leading-[.98] tracking-[-.05em] sm:text-8xl">One minute.<br /><span className="text-[#a97030]">Make it count.</span></h1>
              <p className="mx-auto mt-5 max-w-md text-lg leading-7 text-[#705c4b]">Answer as many as you can. Save a little nerve for the boss round.</p>
              <div className="mt-8 flex justify-center gap-3">
                <div className="ready-chip"><Clock3 size={16} /><b>60</b><span>SECONDS</span></div>
                <div className="ready-chip"><Crown size={16} /><b>03</b><span>BOSS Qs</span></div>
              </div>
              <button type="button" data-testid="button-begin-run" onClick={game.startRound} className="primary-button mx-auto mt-9">
                <Play size={17} fill="currentColor" /> Start the clock <span className="keycap">SPACE</span>
              </button>
              <button type="button" data-testid="button-change-level" className="back-link mx-auto mt-5" onClick={game.changeLevel}><ArrowLeft size={14} /> Change level</button>
            </div>
          </section>
        )}

        {isPlay && (
          <section className={`play-layout enter-up mx-auto flex w-full max-w-6xl flex-1 flex-col py-5 ${isBoss ? 'boss-mode' : ''}`}>
            <div className="play-topline">
              <div className="play-level"><span className="live-mark" /> {isBoss ? 'BOSS ROUND' : 'QUICKFIRE ROUND'} <i /> {selectedLevel?.title ?? 'CHALLENGE'}</div>
              <div className="score-display"><span>SCORE</span><strong data-testid="text-score">{state.score.toLocaleString()}</strong></div>
            </div>
            <div className="timer-row">
              <div className="timer-clock"><Clock3 size={17} /><span className="mono">{`${Math.ceil(activeTimerMs / 1000).toString().padStart(2, '0')}s`}</span></div>
              <div className="timer-track"><div className="timer-fill" style={{ transform: `scaleX(${Math.max(0, Math.min(1, activeTimerMs / activeTimerTotalMs))})` }} /></div>
              <div className="streak-count"><Flame size={16} /><strong>{state.streak}</strong><span>STREAK</span></div>
            </div>
            <div className="play-columns">
              <div className="question-column">
                <div className="question-meta">
                  <span className="question-index mono">{isBoss ? `BOSS • ${activeBossQuestion} / 03` : `QUESTION ${String(state.questionNumber).padStart(2, '0')}`}</span>
                  {question?.topic && <span className="topic-tag">{question.topic}</span>}
                  {question?.type && <span className="type-tag">{question.type}</span>}
                </div>
                <div
                  key={`${state.roundKind ?? 'run'}-${question?.id ?? 'loading'}-${isBoss ? activeBossQuestion : state.questionNumber}`}
                  className="question-card"
                >
                  {state.phase === 'feedback' && state.feedback && (
                    <div className={`feedback-ribbon ${state.feedback.correct ? 'feedback-good' : 'feedback-miss'}`} role="status" data-testid="status-answer-feedback">
                      <span className="feedback-symbol">{state.feedback.correct ? <Check size={16} /> : <X size={16} />}</span>
                      <span>
                        <b>{state.feedback.label || (state.feedback.correct ? 'Well played!' : 'Not quite')}</b>
                        {` · ${state.feedback.points === 0 ? '0' : `${state.feedback.correct ? '+' : '−'}${Math.abs(state.feedback.points)}`} points`}
                      </span>
                    </div>
                  )}
                  <div className="question-ornament">Q<span>·</span></div>
                  <h1 data-testid="text-question-prompt" className="display-serif question-prompt">{question?.prompt ?? 'Your next question is on its way…'}</h1>
                </div>
                {question?.options?.length ? (
                  <div className="answer-list" role="group" aria-label="Answer choices">
                    {question.options.map((option, index) => (
                      <AnswerOption key={`${question.id}-${option.id}`} option={option} index={index}
                        eliminated={state.abilities.eliminatedOptionIds.includes(option.id)}
                        disabled={state.phase === 'feedback'}
                        feedback={state.phase === 'feedback' && state.feedback
                          ? option.id === state.feedback.correctOptionId
                            ? 'correct'
                            : option.id === state.feedback.selectedOptionId
                              ? 'wrong'
                              : null
                          : null}
                        onClick={() => chooseAnswer(option.id)} />
                    ))}
                  </div>
                ) : (
                  <div className="question-loading" aria-label="Loading question"><span /><span /><span /></div>
                )}
                <div className="play-controls">
                  <div className="keyboard-hint"><Keyboard size={15} /> Answer with <b>1–4</b>{!isBoss && <><span className="hint-divider" /> Skip <kbd>S</kbd></>}</div>
                  {state.phase === 'feedback' ? (
                    <button type="button" data-testid="button-next-question" className="next-button" onClick={continueRound}>Next question <ChevronRight size={17} /><kbd>SPACE</kbd></button>
                  ) : !isBoss ? (
                    <button type="button" data-testid="button-skip-question" className="skip-button" onClick={skipQuestion}>Skip <ArrowRight size={15} /></button>
                  ) : <span className="keyboard-hint">BOSS ROUND</span>}
                </div>
              </div>
              <aside className="tool-column">
                <div className="skill-card">
                  <div className="skill-title"><span>YOUR SKILL</span><Sparkles size={15} /></div>
                  <div className="skill-score" aria-label={`Skill rating ${Math.round(state.skill)} out of 100`}>
                    {Math.round(state.skill)}<small> / 100</small>
                  </div>
                  <div className="skill-meter"><span style={{ transform: `scaleX(${Math.max(0, Math.min(1, state.skill / 100))})` }} /></div>
                  <p>Keep your rhythm. Build that streak.</p>
                </div>
                <div className="ability-card">
                  <div className="ability-head"><span>POCKET POWERS</span><span>USE ONE</span></div>
                  <AbilityButton id="shield" label="Safety net" note={state.abilities.shieldArmed ? 'Shield armed' : 'Protect your streak'} count={state.abilities.shield} icon={<Shield size={17} />} onUse={game.useAbility} />
                  <AbilityButton id="fiftyFifty" label="Narrow it down" note="Remove two answers" count={state.abilities.fiftyFifty} icon={<Lightbulb size={17} />} onUse={game.useAbility} />
                  <AbilityButton id="timeBurst" label="Time burst" note="Add a little time" count={state.abilities.timeBurst} icon={<Zap size={17} />} onUse={game.useAbility} />
                </div>
                <div className="mini-stat"><span><AudioLines size={16} /> ANSWERED</span><b>{state.stats.answered}</b></div>
              </aside>
            </div>
          </section>
        )}

        {state.phase === 'boss-intro' && (
          <section className="boss-intro enter-up flex flex-1 items-center justify-center py-10">
            <div className="boss-card">
              <div className="boss-seal"><Crown size={31} /></div>
              <div className="eyebrow justify-center"><span className="eyebrow-dot" /> THE LAST LITTLE HURDLE</div>
              <h1 className="display-serif mt-5 text-6xl leading-[.94] tracking-[-.05em] sm:text-8xl">The boss<br /><span className="text-[#b88339]">is waiting.</span></h1>
              <p className="mx-auto mt-5 max-w-md text-lg leading-7 text-[#705c4b]">Three questions. Each has its own 12-second clock. Give every one your best shot.</p>
              <div className="boss-progress" aria-label="Three boss questions">
                {[1, 2, 3].map((item) => <span key={item}><i>0{item}</i><b /></span>)}
              </div>
              <button type="button" data-testid="button-enter-boss" onClick={game.startRound} className="primary-button mx-auto mt-9">
                Meet the boss <ArrowRight size={17} /><span className="keycap">SPACE</span>
              </button>
            </div>
          </section>
        )}

        {state.phase === 'result' && (
          <section className="enter-up flex flex-1 items-center justify-center py-8">
            <div className="result-panel w-full max-w-4xl">
              <div className="result-top"><span className="eyebrow"><span className="eyebrow-dot" /> QUEST COMPLETE</span><span className="result-level">{selectedLevel?.title ?? 'CHOCOLATE QUEST'}</span></div>
              <div className="result-main">
                <div>
                  <p className="result-kicker">A very fine run.</p>
                  <h1 className="display-serif result-score" data-testid="text-result-score">{state.score.toLocaleString()}<span>pts</span></h1>
                  <p className="result-copy">You brought the brainpower. Take a bow, then go again.</p>
                </div>
                <div className="result-stats">
                  <ResultStat label="Correct answers" value={`${state.stats.correct}`} icon={<Check size={17} />} />
                  <ResultStat label="Best streak" value={`${state.stats.bestStreak}`} icon={<Flame size={17} />} />
                  <ResultStat label="Boss answers" value={`${state.stats.bossCorrect} / 3`} icon={<Crown size={17} />} />
                  <ResultStat label="Run accuracy" value={`${Math.round(loyalty.runProgress.accuracy * 100)}%`} icon={<Check size={17} />} />
                  <ResultStat label="Average answer" value={`${state.stats.averageSeconds.toFixed(1)}s`} icon={<Clock3 size={17} />} />
                </div>
              </div>
              {loyalty.activePlayer && resultStanding && <section className="cocoa-result" aria-labelledby="cocoa-result-title" data-testid="panel-cocoa-result">
                <div className="cocoa-result-emblem"><Award size={21} /></div>
                <div className="cocoa-result-copy">
                  <p className="cocoa-overline">YOUR COCOA LOYALTY</p>
                  <h2 id="cocoa-result-title" className="cocoa-result-title">
                    {loyalty.runProgress.eligible
                      ? `+${loyalty.runProgress.beansEarned} Cocoa Beans`
                      : 'A little more practice, a lot more cocoa'}
                  </h2>
                  <p>
                    {loyalty.runProgress.eligible
                     ? `A ${Math.round(loyalty.runProgress.accuracy * 100)}% run earns beans. Keep going toward ${resultStanding.nextRank?.name ?? 'the top rank'}.`
                      : `${loyalty.runProgress.attempts < 6 ? `${Math.max(0, 6 - loyalty.runProgress.attempts)} more decisions` : 'Reach 70% accuracy'} to qualify next run. Every run counts as practice.`}
                  </p>
                </div>
                <div className="cocoa-result-total">
                   <strong>{resultBeans}</strong>
                  <span>BEANS BANKED</span>
                </div>
                <div className="cocoa-result-progress">
                   <div><span>{resultStanding.rank.name}</span><span>{resultStanding.nextRank ? `${resultStanding.beansToNext} to ${resultStanding.nextRank.name}` : 'Highest rank'}</span></div>
                   <div className="cocoa-meter"><i style={{ transform: `scaleX(${resultStanding.progress})` }} /></div>
                </div>
                <p className="cocoa-footnote">Saved in this browser only. Beans are for fun; there is no real-world redemption.</p>
              </section>}
              <div className="result-actions">
                <button type="button" data-testid="button-play-again" onClick={playAgain} className="primary-button"><RotateCcw size={17} /> Play again</button>
                <button type="button" data-testid="button-result-change-level" onClick={game.changeLevel} className="secondary-button">Choose another level <ArrowRight size={16} /></button>
              </div>
              <div className="result-footer">CHOCOLATE QUEST <span>·</span> CBSE EXHIBITION ARCADE <span>·</span> NICELY DONE</div>
            </div>
          </section>
        )}
      </div>
      <footer className="site-footer"><span>CHOCOLATE QUEST</span><i /> <span>A LITTLE PLAY. A LOT OF BRAIN.</span><span className="footer-right">CBSE EXHIBITION <b>VISITOR MODE</b></span></footer>
    </main>
  );
}

function AbilityButton({ id, label, note, count, icon, onUse }: {
  id: AbilityId; label: string; note: string; count: number; icon: ReactNode; onUse: (ability: AbilityId) => void;
}) {
  return <button type="button" data-testid={`button-ability-${id}`} disabled={count < 1} onClick={() => onUse(id)} className="ability-button">
    <span className="ability-icon">{icon}</span><span className="ability-copy"><b>{label}</b><small>{note}</small></span><span className="ability-count">{count}</span>
  </button>;
}

function ResultStat({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return <div className="result-stat"><span className="result-stat-icon">{icon}</span><span>{label}</span><b>{value}</b></div>;
}

function CocoaEntryCard({ loyalty, compact = false }: {
  loyalty: ReturnType<typeof useCocoaPlayers>;
  compact?: boolean;
}) {
  const profile = loyalty.activePlayer;
  const standing = loyalty.standing;
  if (!profile || !standing) return null;
  return (
    <aside className={`cocoa-entry ${compact ? 'cocoa-entry-compact' : ''}`} aria-label="Cocoa loyalty progress" data-testid="panel-cocoa-entry">
      <div className="cocoa-entry-mark"><Award size={17} /></div>
      <div className="cocoa-entry-body">
        <div className="cocoa-entry-heading"><span>{profile.username.toUpperCase()} · COCOA LOYALTY</span><b>{standing.rank.name}</b></div>
        <div className="cocoa-entry-stats">
          <strong>{profile.beans}<small> beans</small></strong>
          <span>{profile.completedRuns} {profile.completedRuns === 1 ? 'run' : 'runs'} played</span>
          <span>Best accuracy {Math.round(profile.bestAccuracy * 100)}%</span>
        </div>
        <div className="cocoa-meter" aria-label={`${Math.round(standing.progress * 100)} percent to next rank`}>
          <i style={{ transform: `scaleX(${standing.progress})` }} />
        </div>
        <p>
          {standing.nextRank
            ? `${standing.beansToNext} beans to ${standing.nextRank.name}. Earn beans with 6+ decisions and 70%+ accuracy.`
            : 'You have reached the highest rank. Keep playing for your own best.'}
          {' '}Saved on this device; no real-world redemption.
        </p>
      </div>
    </aside>
  );
}

export default App;