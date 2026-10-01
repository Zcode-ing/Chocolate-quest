import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ArrowDownRight, ArrowLeft, ArrowRight, AudioLines, Bolt, Check, ChevronRight,
  Clock3, Crown, Flame, Keyboard, Lightbulb, LockKeyhole, Play, RotateCcw,
  Shield, Sparkles, X, Zap,
} from 'lucide-react';
import { useGameController } from '@/game/useGameController';
import { GAME_CONFIG } from '@/game/config';
import { GameHeader } from '@/components/GameHeader';
import { AnswerOption } from '@/components/AnswerOption';

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
  const [soundOn, setSoundOn] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const flipSound = useCallback(() => {
    setSoundOn((current) => !current);
    game.toggleSound();
  }, [game]);

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
      if (event.key === 'Enter' && state.phase === 'level-select' && state.level) game.startRun(state.level as LevelId);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [chooseAnswer, continueRound, game, skipQuestion, state.abilities.eliminatedOptionIds, state.currentQuestion, state.level, state.phase]);

  const selectedLevel = LEVELS.find((level) => level.id === state.level);
  const isPlay = state.phase === 'main' || state.phase === 'boss' || state.phase === 'feedback';
  const isBoss = state.phase === 'boss' || (state.phase === 'feedback' && Boolean(state.feedback?.boss));
  const question = state.currentQuestion;
  const activeTimerMs = isBoss ? state.bossRemainingMs : state.remainingMs;
  const activeTimerTotalMs = isBoss
    ? GAME_CONFIG.bossQuestionDurationMs
    : GAME_CONFIG.mainRoundDurationMs;
  const activeBossQuestion = Math.max(1, Math.min(3, state.bossQuestionNumber || 1));

  return (
    <main className="game-frame flex min-h-[100dvh] flex-col">
      <GameHeader soundOn={soundOn} onToggleSound={flipSound} />
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col px-5 pb-8 sm:px-8 lg:px-12">
        {(state.phase === 'intro' || showIntro) && (
          <section className="intro-layout enter-up mx-auto grid w-full max-w-6xl flex-1 items-center gap-9 py-9 lg:grid-cols-[1fr_.83fr] lg:gap-20">
            <div className="relative z-10 py-5">
              <div className="eyebrow"><span className="eyebrow-dot" /> CBSE EXHIBITION • KNOWLEDGE ARCADE</div>
              <h1 className="display-serif mt-7 max-w-[720px] text-[clamp(4rem,9vw,8.4rem)] leading-[.82] tracking-[-.065em] text-[#38241b]">
                Think fast.<br /><span className="text-[#a97030]">Taste</span> victory.
              </h1>
              <p className="mt-7 max-w-[460px] text-lg leading-7 text-[#705c4b] sm:text-xl">
                A minute on the clock. A little knowledge goes a long way. Then meet the three-question boss.
              </p>
              <button type="button" data-testid="button-start-quest" onClick={() => { setShowIntro(false); game.changeLevel(); }} className="primary-button mt-9">
                Choose your level <ArrowRight size={18} strokeWidth={2.2} />
              </button>
              <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold uppercase tracking-[.14em] text-[#8a7662]">
                <span className="inline-flex items-center gap-2"><Clock3 size={14} /> 60 seconds</span>
                <span className="inline-flex items-center gap-2"><Crown size={14} /> 3-question boss</span>
                <span className="inline-flex items-center gap-2"><Keyboard size={14} /> Keys 1–4</span>
              </div>
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

        {state.phase === 'level-select' && !showIntro && (
          <section className="enter-up mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center py-10">
            <button type="button" data-testid="button-back-intro" className="back-link mb-9 w-fit" onClick={() => setShowIntro(true)}>
              <ArrowLeft size={16} /> Back to the beginning
            </button>
            <div className="eyebrow"><span className="eyebrow-dot" /> PICK YOUR PLAYING FIELD</div>
            <h1 className="display-serif mt-4 text-5xl tracking-[-.04em] sm:text-7xl">How sharp are<br className="sm:hidden" /> we feeling?</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-[#705c4b]">Choose the level that feels right. Your round will be tuned just for you.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {LEVELS.map((level) => {
                const active = state.level === level.id;
                return (
                  <button type="button" key={level.id} data-testid={`button-level-${level.id}`} aria-pressed={active}
                    onClick={() => game.startRun(level.id)}
                    className={`level-choice ${active ? 'is-selected' : ''}`}>
                    <span className="level-mark mono">{level.mark}</span>
                    <span className="level-copy"><strong>{level.title}</strong><span>{level.classes} · {level.note}</span></span>
                    <span className="level-arrow"><ArrowDownRight size={19} /></span>
                  </button>
                );
              })}
            </div>
            <div className="mt-7 flex items-center gap-2 text-sm text-[#826e5a]"><LockKeyhole size={14} /> Just for fun. No grades, no pressure.</div>
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
                <div className="question-card">
                  {state.phase === 'feedback' && state.feedback && (
                    <div className={`feedback-ribbon ${state.feedback.correct ? 'feedback-good' : 'feedback-miss'}`} role="status" data-testid="status-answer-feedback">
                      <span className="feedback-symbol">{state.feedback.correct ? <Check size={16} /> : <X size={16} />}</span>
                      <span><b>{state.feedback.label || (state.feedback.correct ? 'Well played!' : 'Not quite')}</b>{state.feedback.correct && state.feedback.points ? ` · +${state.feedback.points} points` : ''}</span>
                    </div>
                  )}
                  <div className="question-ornament">Q<span>·</span></div>
                  <h1 data-testid="text-question-prompt" className="display-serif question-prompt">{question?.prompt ?? 'Your next question is on its way…'}</h1>
                </div>
                {question?.options?.length ? (
                  <div className="answer-list" role="group" aria-label="Answer choices">
                    {question.options.map((option, index) => (
                      <AnswerOption key={option.id} option={option} index={index}
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
                  <ResultStat label="Average answer" value={`${state.stats.averageSeconds.toFixed(1)}s`} icon={<Clock3 size={17} />} />
                </div>
              </div>
              <div className="result-actions">
                <button type="button" data-testid="button-play-again" onClick={game.playAgain} className="primary-button"><RotateCcw size={17} /> Play again</button>
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

export default App;