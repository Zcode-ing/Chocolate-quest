import { useEffect, useRef, useState } from 'react';
import { Award, Crown, Sparkles } from 'lucide-react';
import type { GamePhase } from '@/game/types';

export interface ScoreDeltaBurst {
  id: number;
  points: number;
  correct: boolean;
  label: string;
}

interface CinematicStageProps {
  phase: GamePhase;
  isBoss: boolean;
  bossAct: number;
  streak: number;
  skill: number;
  timerRatio: number;
  victoryIntensity: 'standard' | 'strong' | 'triumph';
}

interface DustParticle {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  alpha: number;
  hue: 'gold' | 'cocoa' | 'amber';
  depth: number;
}

/**
 * Lightweight 2D Canvas + SVG atmospheric background with mouse parallax
 * and phase-reactive particle dynamics. Respects prefers-reduced-motion.
 */
export function CinematicStage({
  phase,
  isBoss,
  bossAct,
  streak,
  skill,
  timerRatio,
  victoryIntensity,
}: CinematicStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef({
    phase,
    isBoss,
    bossAct,
    streak,
    skill,
    timerRatio,
    victoryIntensity,
  });

  useEffect(() => {
    stateRef.current = {
      phase,
      isBoss,
      bossAct,
      streak,
      skill,
      timerRatio,
      victoryIntensity,
    };
  }, [phase, isBoss, bossAct, streak, skill, timerRatio, victoryIntensity]);

  // Subtle camera/parallax tracking via CSS custom properties on documentElement
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMove = (event: MouseEvent) => {
      const nx = (event.clientX / Math.max(1, window.innerWidth) - 0.5) * 2;
      const ny = (event.clientY / Math.max(1, window.innerHeight) - 0.5) * 2;
      targetX = Math.max(-1, Math.min(1, nx));
      targetY = Math.max(-1, Math.min(1, ny));
    };

    const update = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      document.documentElement.style.setProperty('--cam-x', currentX.toFixed(4));
      document.documentElement.style.setProperty('--cam-y', currentY.toFixed(4));
      raf = window.requestAnimationFrame(update);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    raf = window.requestAnimationFrame(update);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  // Lightweight atmospheric particle canvas (<= 24 particles for school PC performance)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize, { passive: true });

    const count = 22;
    const particles: DustParticle[] = Array.from({ length: count }, (_, idx) => ({
      x: ((idx * 137.5) % 100) * 0.01 * width,
      y: ((idx * 73.1) % 100) * 0.01 * height,
      r: 1.2 + (idx % 3) * 0.85,
      vx: ((idx % 5) - 2) * 0.08,
      vy: -0.14 - (idx % 4) * 0.07,
      alpha: 0.14 + (idx % 4) * 0.07,
      hue: idx % 3 === 0 ? 'gold' : idx % 3 === 1 ? 'amber' : 'cocoa',
      depth: 0.4 + (idx % 3) * 0.3,
    }));

    let animId = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const s = stateRef.current;

      const streakBoost = Math.min(2.4, 1 + s.streak * 0.14);
      const urgencyBoost =
        (s.phase === 'main' || s.phase === 'boss') && s.timerRatio < 0.25
          ? 1.55
          : 1;
      const victoryBoost =
        s.phase === 'result' && s.victoryIntensity === 'triumph' ? 1.85 : 1;
      const speedMult = streakBoost * urgencyBoost * victoryBoost;

      for (const p of particles) {
        p.x += p.vx * speedMult;
        p.y += p.vy * speedMult;

        if (p.y < -12) {
          p.y = height + 12;
          p.x = Math.random() * width;
        }
        if (p.x < -12) p.x = width + 12;
        if (p.x > width + 12) p.x = -12;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

        if (s.isBoss || s.phase === 'boss-intro') {
          ctx.fillStyle =
            p.hue === 'gold'
              ? `rgba(229, 182, 107, ${p.alpha * 1.25})`
              : `rgba(181, 121, 56, ${p.alpha * 0.95})`;
        } else {
          ctx.fillStyle =
            p.hue === 'gold'
              ? `rgba(189, 138, 63, ${p.alpha})`
              : p.hue === 'amber'
                ? `rgba(166, 114, 50, ${p.alpha * 0.85})`
                : `rgba(98, 63, 41, ${p.alpha * 0.65})`;
        }
        ctx.fill();
      }

      animId = window.requestAnimationFrame(render);
    };

    animId = window.requestAnimationFrame(render);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="cq-cinema-backdrop" aria-hidden="true">
      <div className="cq-cinema-spotlight" />
      <div className="cq-cinema-vignette" />
      <svg className="cq-cinema-contours" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="cq-warm-glow" cx="50%" cy="28%" r="60%">
            <stop offset="0%" stopColor="rgba(218, 174, 105, 0.22)" />
            <stop offset="60%" stopColor="rgba(168, 116, 54, 0.06)" />
            <stop offset="100%" stopColor="rgba(67, 41, 29, 0)" />
          </radialGradient>
        </defs>
        <circle cx="720" cy="260" r="520" fill="url(#cq-warm-glow)" />
        <ellipse
          className="cq-contour-ring cq-contour-ring--outer"
          cx="720"
          cy="450"
          rx="610"
          ry="340"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeDasharray="4 10"
        />
        <ellipse
          className="cq-contour-ring cq-contour-ring--inner"
          cx="720"
          cy="450"
          rx="440"
          ry="245"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.6"
        />
      </svg>
      <canvas ref={canvasRef} className="cq-cinema-canvas" />
    </div>
  );
}

/**
 * Short 2.4s movie-like opening title card on initial arrival, immediately skippable.
 */
export function CinematicPrelude({ onFinish }: { onFinish: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setExiting(true), 1850);
    const doneTimer = window.setTimeout(onFinish, 2300);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`cq-prelude ${exiting ? 'is-exiting' : ''}`}
      onClick={onFinish}
      role="presentation"
    >
      <div className="cq-prelude__light" />
      <div className="cq-prelude__inner">
        <div className="cq-prelude__monogram">
          <span>CQ</span>
        </div>
        <p className="cq-prelude__kicker">THE KNOWLEDGE ARCADE</p>
        <h2 className="cq-prelude__title display-serif">Chocolate Quest</h2>
        <p className="cq-prelude__subtitle">How far can you go?</p>
      </div>
      <button
        type="button"
        className="cq-prelude__skip mono"
        onClick={(e) => {
          e.stopPropagation();
          onFinish();
        }}
      >
        SKIP INTRO
      </button>
    </div>
  );
}

/**
 * Floating score delta (+184 / -72) that travels toward the score instrument
 * without freezing gameplay.
 */
export function ScoreFlightLayer({ bursts }: { bursts: ScoreDeltaBurst[] }) {
  if (!bursts.length) return null;
  return (
    <div className="cq-score-flights" aria-hidden="true">
      {bursts.map((burst) => (
        <div
          key={burst.id}
          className={`cq-score-flight ${burst.correct ? 'is-gain' : 'is-loss'}`}
        >
          <span className="cq-score-flight__pts display-serif">
            {burst.points === 0
              ? '0'
              : `${burst.points > 0 ? '+' : '−'}${Math.abs(burst.points)}`}
          </span>
          <small className="cq-score-flight__label mono">{burst.label}</small>
        </div>
      ))}
    </div>
  );
}

/**
 * Smoothly interpolates displayed score from 0 to target on the final result scene.
 */
export function useAnimatedScore(target: number, active: boolean, durationMs = 1050): number {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (!active) {
      setValue(target);
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    let raf = 0;
    const start = performance.now();
    setValue(0);

    const step = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - t, 4);
      setValue(Math.round(target * eased));
      if (t < 1) {
        raf = window.requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    raf = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(raf);
  }, [target, active, durationMs]);

  return value;
}

/**
 * Victory / Loss verdict reveal on the result screen showing the 3 official win conditions.
 */
export function ChocolateRewardSeal({
  won,
  hasMinAccuracy,
  hasMinAnswered,
  hasMinBoss,
  answered,
  eligible,
  beansEarned,
  bossCorrect,
  accuracyPercent,
}: {
  won: boolean;
  hasMinAccuracy: boolean;
  hasMinAnswered: boolean;
  hasMinBoss: boolean;
  answered: number;
  eligible: boolean;
  beansEarned: number;
  bossCorrect: number;
  accuracyPercent: number;
}) {
  return (
    <div
      className={`cq-reward-moment ${won ? 'is-win' : 'is-loss'}`}
      data-testid="panel-chocolate-reward"
      data-verdict={won ? 'won' : 'lost'}
    >
      <div className="cq-reward-moment__glow" aria-hidden="true" />
      <div className="cq-reward-moment__seal" aria-hidden="true">
        <div className="cq-reward-moment__seal-ring">
          {won ? (bossCorrect === 3 ? <Crown size={20} /> : <Award size={20} />) : <Sparkles size={20} />}
        </div>
      </div>
      <div className="cq-reward-moment__body">
        <div className="cq-reward-moment__eyebrow mono">
          <Sparkles size={12} />{' '}
          {won
            ? bossCorrect === 3
              ? 'GRAND CONFECTIONER VICTORY'
              : 'QUEST VICTORY UNLOCKED'
            : 'QUEST RESULT · TRY AGAIN'}
        </div>
        <h3 className="cq-reward-moment__title display-serif">
          {won ? 'You won the game!' : 'Sorry, you lost this run.'}
        </h3>
        <p className="cq-reward-moment__copy">
          {won
            ? eligible
              ? `Victory sealed with ${accuracyPercent}% accuracy, ${bossCorrect}/3 Boss acts, and +${beansEarned} Cocoa Beans.`
              : `Victory sealed with ${accuracyPercent}% accuracy and ${bossCorrect}/3 Boss acts cleared!`
            : `Reach 60%+ accuracy, 6+ answers, and at least 2/3 Boss acts to win.`}
        </p>
        <div className="cq-verdict-checks mono" aria-label="Win condition breakdown">
          <span className={hasMinAccuracy ? 'is-met' : 'is-missed'}>
            {hasMinAccuracy ? '✓' : '×'} {accuracyPercent}% / 60% Accuracy
          </span>
          <span className={hasMinAnswered ? 'is-met' : 'is-missed'}>
            {hasMinAnswered ? '✓' : '×'} {answered} / 6 Answered
          </span>
          <span className={hasMinBoss ? 'is-met' : 'is-missed'}>
            {hasMinBoss ? '✓' : '×'} {bossCorrect} / 2 Boss Clear
          </span>
        </div>
      </div>
      <div className="cq-reward-moment__badge mono">
        <span>{won ? 'WINNER' : 'DEFEAT'}</span>
      </div>
    </div>
  );
}
