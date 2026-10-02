import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import {
  ArrowLeft, ArrowRight, AudioLines, BadgeCheck, Bean, ChevronDown,
  CircleHelp, Code2, Coins, Crown, LockKeyhole, ShieldCheck, X,
} from 'lucide-react';
import { verifyDeveloperAccess } from '@workspace/api-client-react';
import {
  normalizeUsername,
  validateUsername,
  type CocoaPlayerProfile,
} from '@/game/cocoaPlayers';
import type { AcademicLevel } from '@/game/types';
import './pre-game-gate.css';

type PreGameGateProps = {
  players: CocoaPlayerProfile[];
  onSelectPlayer: (username: string) => void;
  onExit: () => void;
  onDifficultyChange: (normalizedUsername: string, level: AcademicLevel, value: number) => void;
  questionCounts: Partial<Record<AcademicLevel, number>>;
  totalQuestions: number;
  importedQuestionCount: number;
  soundEnabled: boolean;
};

const LEVELS: { id: AcademicLevel; title: string; grade: string }[] = [
  { id: 'junior', title: 'Junior', grade: 'Classes 7–8' },
  { id: 'semi-senior', title: 'Semi-Senior', grade: 'Classes 9–10' },
  { id: 'senior', title: 'Senior', grade: 'Classes 11–12' },
  { id: 'ultra-advanced', title: 'Ultra Advanced', grade: 'B.Tech' },
];

const displayLevel = (level?: AcademicLevel | null) =>
  LEVELS.find((item) => item.id === level)?.title ?? 'Not played yet';
const displayLastPlayed = (value: string | null) => {
  if (!value) return 'No run recorded';
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'No run recorded';
};

export function PreGameGate({
  players,
  onSelectPlayer,
  onExit,
  onDifficultyChange,
  questionCounts,
  totalQuestions,
  importedQuestionCount,
  soundEnabled,
}: PreGameGateProps) {
  const [username, setUsername] = useState('');
  const [view, setView] = useState<'players' | 'code' | 'developer'>('players');
  const [accessCode, setAccessCode] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [developerReady, setDeveloperReady] = useState(false);

  const matches = useMemo(() => {
    const query = normalizeUsername(username);
    if (!query) return [];
    return players.filter((player) => normalizeUsername(player.username).includes(query));
  }, [players, username]);

  const exactMatch = useMemo(() => {
    const query = normalizeUsername(username);
    return query
      ? players.find((player) => normalizeUsername(player.username) === query)
      : undefined;
  }, [players, username]);
  const usernameError = username.trim() ? validateUsername(username) : null;

  const submitPlayer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = username.trim();
    if (!name || validateUsername(name)) return;
    onSelectPlayer(exactMatch?.username ?? name);
  };

  const chooseSuggestion = (name: string) => {
    setUsername(name);
    onSelectPlayer(name);
  };

  const submitCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submittedCode = accessCode;
    if (submittedCode.trim().length < 8 || verifying) return;
    setVerifying(true);
    setCodeError('');
    setAccessCode('');
    try {
      const result = await verifyDeveloperAccess({ accessCode: submittedCode });
      if (result.verified) {
        setDeveloperReady(true);
        setView('developer');
      } else {
        setCodeError('That code did not unlock developer access. Try again.');
      }
    } catch {
      setCodeError('Could not check the code right now. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const returnToPlayers = () => {
    setView('players');
    setCodeError('');
    setAccessCode('');
  };

  return (
    <main className="cq-gate" data-testid="panel-pregame-gate">
      <header className="cq-gate__topbar">
        <div className="cq-gate__brand" aria-label="Chocolate Quest">
          <span className="cq-gate__seal">CQ</span>
          <span className="cq-gate__brand-name">CHOCOLATE<br />QUEST</span>
        </div>
        <div className="cq-gate__top-note"><span /> KNOWLEDGE ARCADE <i /> PRE-GAME</div>
        <button type="button" className="cq-gate__exit" data-testid="button-exit-gate" onClick={onExit}>
          Exit <X size={15} />
        </button>
      </header>

      {view === 'players' && (
        <section className="cq-gate__main cq-gate__player-view" aria-labelledby="cq-player-title">
          <div className="cq-gate__intro">
            <div className="cq-gate__eyebrow"><span /> BEFORE THE FIRST QUESTION</div>
            <h1 id="cq-player-title">Who’s taking<br /><em>the challenge?</em></h1>
            <p>Pick up where you left off, or make a name for this device.</p>
          </div>
          <div className="cq-gate__player-card">
            <div className="cq-gate__card-heading">
              <div><span className="cq-gate__step">01 / PLAYER</span><h2>Your name, your run.</h2></div>
              <div className="cq-gate__count">{players.length.toString().padStart(2, '0')}<small> SAVED</small></div>
            </div>
            <form className="cq-gate__name-form" onSubmit={submitPlayer}>
              <label htmlFor="cq-username">Player username</label>
              <div className="cq-gate__name-control">
                <input
                  id="cq-username"
                  data-testid="input-player-username"
                  autoComplete="nickname"
                  maxLength={24}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Type a name to begin"
                  aria-invalid={Boolean(usernameError)}
                  aria-describedby={usernameError ? 'cq-name-error' : 'cq-name-help'}
                />
                <button type="submit" data-testid="button-continue-player" disabled={!username.trim() || Boolean(usernameError)}>
                  {exactMatch ? 'Play as saved player' : 'Continue'} <ArrowRight size={17} />
                </button>
              </div>
              {usernameError
                ? <p id="cq-name-error" className="cq-gate__error" role="alert" data-testid="status-player-name-error">{usernameError}</p>
                : <p id="cq-name-help">Saved names match regardless of capitalization. New names create a local profile.</p>}
            </form>

            {username.trim() && matches.length > 0 && (
              <div className="cq-gate__suggestions" role="listbox" aria-label="Matching saved players" data-testid="list-player-suggestions">
                <div className="cq-gate__list-label">MATCHING PLAYERS <span>{matches.length}</span></div>
                {matches.slice(0, 5).map((player) => (
                  <button
                    type="button"
                    role="option"
                    aria-selected={exactMatch?.normalizedUsername === player.normalizedUsername}
                    className="cq-gate__suggestion"
                    key={player.normalizedUsername}
                    data-testid={`button-suggestion-${player.normalizedUsername}`}
                    onClick={() => chooseSuggestion(player.username)}
                  >
                    <span className="cq-gate__initial">{player.username.slice(0, 1).toUpperCase()}</span>
                    <span className="cq-gate__suggestion-name">{player.username}<small>{player.completedRuns} {player.completedRuns === 1 ? 'run' : 'runs'} · {player.beans} beans</small></span>
                    <ArrowRight size={16} />
                  </button>
                ))}
              </div>
            )}

            {!players.length && (
              <div className="cq-gate__first-visit" data-testid="empty-saved-players">
                <div className="cq-gate__first-mark"><Bean size={18} /></div>
                <div><b>A fresh start.</b><span>Your player name and Cocoa Loyalty stay on this device.</span></div>
              </div>
            )}
            <div className="cq-gate__card-foot"><ShieldCheck size={15} /> Profiles stay on this device <span className="cq-gate__foot-rule" /> COCOA LOYALTY</div>
          </div>
          <div className="cq-gate__bottom-row">
            <p><span className="cq-gate__tiny-seal">CQ</span> Fast questions. Earn beans. Find your rhythm.</p>
            <button type="button" className="cq-gate__dev-entry" data-testid="button-open-developer-access" onClick={() => { setView('code'); setCodeError(''); }}>
              <LockKeyhole size={14} /> Developer access
            </button>
          </div>
        </section>
      )}

      {view === 'code' && (
        <section className="cq-gate__main cq-gate__access-view" aria-labelledby="cq-access-title">
          <button type="button" className="cq-gate__back" data-testid="button-back-to-players" onClick={returnToPlayers}>
            <ArrowLeft size={15} /> Player selection
          </button>
          <div className="cq-gate__access-card">
            <div className="cq-gate__access-icon"><Code2 size={21} /></div>
            <div className="cq-gate__eyebrow"><span /> PRE-GAME ONLY</div>
            <h1 id="cq-access-title">Developer<br /><em>check-in.</em></h1>
            <p className="cq-gate__access-copy">Enter the access code to inspect local profiles and tune the question mix.</p>
            <form onSubmit={submitCode} className="cq-gate__code-form">
              <label htmlFor="cq-access-code">Access code</label>
              <input
                id="cq-access-code"
                data-testid="input-developer-access-code"
                type="password"
                autoComplete="off"
                minLength={8}
                maxLength={128}
                value={accessCode}
                aria-invalid={Boolean(codeError)}
                onChange={(event) => { setAccessCode(event.target.value); setCodeError(''); }}
                placeholder="Enter developer code"
                aria-describedby={codeError ? 'cq-code-error' : undefined}
              />
              {codeError && <p id="cq-code-error" className="cq-gate__error" role="alert" data-testid="status-developer-access-error">{codeError}</p>}
              <button type="submit" data-testid="button-verify-developer-access" disabled={accessCode.trim().length < 8 || verifying}>
                {verifying ? <><span className="cq-gate__button-dots" aria-hidden="true" /> Checking access</> : <>Verify code <ArrowRight size={16} /></>}
              </button>
              <p className="cq-gate__privacy"><LockKeyhole size={13} /> Code is checked securely and never saved.</p>
            </form>
          </div>
        </section>
      )}

      {view === 'developer' && developerReady && (
        <section className="cq-gate__developer-view" aria-labelledby="cq-dev-title">
          <div className="cq-gate__dev-head">
            <button type="button" className="cq-gate__back" data-testid="button-dev-back-to-players" onClick={returnToPlayers}>
              <ArrowLeft size={15} /> Player selection
            </button>
            <div className="cq-gate__dev-status" data-testid="status-developer-unlocked"><BadgeCheck size={15} /> DEVELOPER ACCESS ACTIVE</div>
          </div>
          <div className="cq-gate__dev-title-row">
            <div><div className="cq-gate__eyebrow"><span /> LOCAL ARCADE INSPECTOR</div><h1 id="cq-dev-title">Behind the<br /><em>chocolate.</em></h1></div>
            <div className="cq-gate__dev-summary"><strong>{players.length.toString().padStart(2, '0')}</strong><span>PLAYER PROFILES<br />ON THIS DEVICE</span></div>
          </div>
          <div className="cq-gate__dev-grid">
            <section className="cq-gate__dev-panel cq-gate__profiles-panel" aria-labelledby="cq-profiles-heading">
              <div className="cq-gate__panel-head"><div><span className="cq-gate__step">LOCAL ROSTER</span><h2 id="cq-profiles-heading">Player profiles</h2></div><span className="cq-gate__panel-count">{players.length}</span></div>
              {!players.length ? (
                <div className="cq-gate__dev-empty" data-testid="empty-developer-profiles"><CircleHelp size={20} /><b>No local players yet</b><span>Profiles appear here after a player name is saved.</span></div>
              ) : (
                <div className="cq-gate__profiles-list" data-testid="list-developer-profiles">
                  {players.map((player) => {
                    const active = selectedProfile === player.normalizedUsername;
                    return (
                      <article className={`cq-gate__profile ${active ? 'is-open' : ''}`} key={player.normalizedUsername} data-testid={`card-profile-${player.normalizedUsername}`}>
                        <button type="button" className="cq-gate__profile-trigger" data-testid={`button-profile-${player.normalizedUsername}`} aria-expanded={active} onClick={() => setSelectedProfile(active ? null : player.normalizedUsername)}>
                          <span className="cq-gate__initial">{player.username.slice(0, 1).toUpperCase()}</span>
                          <span className="cq-gate__profile-name">{player.username}<small>{player.completedRuns} {player.completedRuns === 1 ? 'run' : 'runs'} · {player.totalAnswers} answers</small></span>
                          <span className="cq-gate__bean-total"><Bean size={14} /> {player.beans}</span>
                          <ChevronDown size={16} className="cq-gate__profile-chevron" />
                        </button>
                        {active && <div className="cq-gate__profile-detail" data-testid={`details-profile-${player.normalizedUsername}`}>
                          <div className="cq-gate__loyalty-line"><span><Coins size={14} /> Cocoa Loyalty</span><b>{player.beans} beans banked</b></div>
                          <div className="cq-gate__stats-grid">
                            <div><span>COMPLETED RUNS</span><b>{player.completedRuns}</b></div>
                            <div><span>BEST ACCURACY</span><b>{Math.round(player.bestAccuracy * 100)}%</b></div>
                            <div><span>LAST RUN</span><b>{player.lastRunBeans} beans</b></div>
                            <div><span>LAST ACCURACY</span><b>{Math.round(player.lastRunAccuracy * 100)}%</b></div>
                            <div><span>ANSWERS CORRECT</span><b>{player.totalCorrect} / {player.totalAnswers}</b></div>
                            <div><span>LAST LEVEL</span><b>{displayLevel(player.lastLevel)}</b></div>
                          </div>
                          <div className="cq-gate__history"><Crown size={14} /><span>Last played</span><b>{displayLastPlayed(player.lastPlayedAt)}</b></div>
                        </div>}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="cq-gate__dev-panel cq-gate__tuning-panel" aria-labelledby="cq-tuning-heading">
              <div className="cq-gate__panel-head"><div><span className="cq-gate__step">QUESTION MIX</span><h2 id="cq-tuning-heading">Difficulty tuning</h2></div><span className="cq-gate__tuning-mark">0—100</span></div>
              <p className="cq-gate__panel-copy">Set estimated skill for each level. Changes apply to the selected local profile.</p>
              {players.length ? (
                <>
                  <label className="cq-gate__select-label" htmlFor="cq-profile-select">Tune profile</label>
                  <select id="cq-profile-select" data-testid="select-difficulty-profile" value={selectedProfile ?? players[0].normalizedUsername} onChange={(event) => setSelectedProfile(event.target.value)}>
                    {players.map((player) => <option key={player.normalizedUsername} value={player.normalizedUsername}>{player.username}</option>)}
                  </select>
                  {(() => {
                    const target = players.find((player) => player.normalizedUsername === (selectedProfile ?? players[0].normalizedUsername)) ?? players[0];
                    return <div className="cq-gate__sliders" data-testid="list-difficulty-controls">
                      {LEVELS.map((level) => {
                        const value = Math.max(0, Math.min(100, Math.round(target.estimatedSkillByLevel[level.id] ?? 0)));
                        return <div className="cq-gate__slider-row" key={level.id}>
                          <div className="cq-gate__slider-title"><span><b>{level.title}</b><small>{level.grade}</small></span><output htmlFor={`cq-level-${level.id}`} data-testid={`value-difficulty-${level.id}`}>{value}</output></div>
                          <input id={`cq-level-${level.id}`} type="range" min="0" max="100" step="1" value={value} aria-label={`${target.username} ${level.title} difficulty`} data-testid={`input-difficulty-${level.id}`} style={{ '--cq-range': `${value}%` } as CSSProperties} onChange={(event) => onDifficultyChange(target.normalizedUsername, level.id, Number(event.target.value))} />
                          <div className="cq-gate__range-labels"><span>Foundations</span><span>Advanced</span></div>
                        </div>;
                      })}
                    </div>;
                  })()}
                </>
              ) : <div className="cq-gate__tuning-empty" data-testid="empty-difficulty-profiles">Create a player profile before tuning levels.</div>}
            </section>
          </div>

          <section className="cq-gate__diagnostics" aria-labelledby="cq-diagnostics-heading">
            <div className="cq-gate__diag-heading"><span className="cq-gate__step">SYSTEM NOTES</span><h2 id="cq-diagnostics-heading">Diagnostics</h2></div>
            <div className="cq-gate__diag-grid">
              <div className="cq-gate__diag-item"><div className="cq-gate__diag-icon"><ShieldCheck size={16} /></div><span>PROFILE STORAGE</span><b>Device-local only</b><small>Player data stays in this browser</small></div>
              <div className="cq-gate__diag-item"><div className="cq-gate__diag-icon"><AudioLines size={16} /></div><span>SOUND</span><b data-testid="text-diagnostic-sound">{soundEnabled ? 'Enabled' : 'Muted'}</b><small>Current game setting</small></div>
              <div className="cq-gate__diag-item cq-gate__question-counts"><div className="cq-gate__diag-icon"><CircleHelp size={16} /></div><span>TECH QUESTIONS</span><b data-testid="text-diagnostic-question-total">{totalQuestions} total <i>·</i> {importedQuestionCount} imported</b><small>{LEVELS.map((level) => `${level.title}: ${questionCounts[level.id] ?? 0}`).join('  /  ')}</small></div>
            </div>
          </section>
        </section>
      )}

      <footer className="cq-gate__footer"><span>CHOCOLATE QUEST</span><i /> A LITTLE PLAY. A LOT OF BRAIN.<span className="cq-gate__footer-right">CBSE EXHIBITION <b>VISITOR MODE</b></span></footer>
    </main>
  );
}

export default PreGameGate;