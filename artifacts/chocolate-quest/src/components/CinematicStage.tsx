import { useEffect, useRef, useState } from 'react';
import { Award, Crown, PartyPopper, Sparkles } from 'lucide-react';
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

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  aspect: number;
  rotation: number;
  spin: number;
  tilt: number;
  tiltSpeed: number;
  swayPhase: number;
  swayFreq: number;
  alpha: number;
  decay: number;
  shape: 'rect' | 'ribbon' | 'star';
  color: string;
}

const CONFETTI_PALETTE = [
  '#F5CA7B', // Metallic Gold
  '#FFE9B8', // Warm Champagne
  '#D98A3C', // Caramel Amber
  '#E0565B', // Confection Berry
  '#4EA86B', // Mint Emerald
  '#FFFDF7', // Ivory Cream
  '#A56734', // Milk Chocolate
];

/**
 * Grand fullscreen confetti & twin party-popper cannon celebration overlay.
 * Automatically fires choreographed salvos when active, and re-fires whenever burstKey increments.
 */
export function VictoryCelebrationStage({
  active,
  triumph,
  burstKey,
}: {
  active: boolean;
  triumph: boolean;
  burstKey: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<ConfettiPiece[]>([]);
  const [cannonPulse, setCannonPulse] = useState<'idle' | 'left' | 'right' | 'both'>('idle');

  useEffect(() => {
    if (!active) {
      particlesRef.current = [];
      setCannonPulse('idle');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize, { passive: true });

    const spawnCannon = (originX: number, originY: number, baseAngleDeg: number, count: number, powerMult = 1) => {
      const cap = 140;
      const list = particlesRef.current;
      if (list.length > cap) {
        list.splice(0, list.length - cap + count);
      }

      for (let i = 0; i < count; i += 1) {
        const spread = (Math.random() - 0.5) * 46;
        const rad = ((baseAngleDeg + spread) * Math.PI) / 180;
        const speed = (9.5 + Math.random() * 11.5) * powerMult;
        const roll = Math.random();
        const shape: ConfettiPiece['shape'] =
          roll < 0.2 ? 'star' : roll < 0.55 ? 'ribbon' : 'rect';

        list.push({
          x: originX + (Math.random() - 0.5) * 16,
          y: originY + (Math.random() - 0.5) * 16,
          vx: Math.cos(rad) * speed,
          vy: Math.sin(rad) * speed,
          size: shape === 'star' ? 6.5 + Math.random() * 4.5 : 7 + Math.random() * 7,
          aspect: shape === 'ribbon' ? 2.4 + Math.random() * 1.4 : 0.55 + Math.random() * 0.45,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.2,
          tilt: Math.random() * Math.PI * 2,
          tiltSpeed: 0.08 + Math.random() * 0.14,
          swayPhase: Math.random() * Math.PI * 2,
          swayFreq: 0.04 + Math.random() * 0.04,
          alpha: 0.96,
          decay: 0.0022 + Math.random() * 0.0024,
          shape,
          color: CONFETTI_PALETTE[Math.floor(Math.random() * CONFETTI_PALETTE.length)],
        });
      }
    };

    const spawnZenithShower = (count: number) => {
      const list = particlesRef.current;
      for (let i = 0; i < count; i += 1) {
        const shape: ConfettiPiece['shape'] = i % 5 === 0 ? 'star' : i % 2 === 0 ? 'ribbon' : 'rect';
        list.push({
          x: width * (0.12 + Math.random() * 0.76),
          y: -16 - Math.random() * 50,
          vx: (Math.random() - 0.5) * 3.4,
          vy: 1.6 + Math.random() * 3.2,
          size: shape === 'star' ? 6 + Math.random() * 4 : 7 + Math.random() * 6,
          aspect: shape === 'ribbon' ? 2.6 : 0.65,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.14,
          tilt: Math.random() * Math.PI * 2,
          tiltSpeed: 0.07 + Math.random() * 0.1,
          swayPhase: Math.random() * Math.PI * 2,
          swayFreq: 0.035 + Math.random() * 0.03,
          alpha: 0.94,
          decay: 0.002 + Math.random() * 0.0018,
          shape,
          color: CONFETTI_PALETTE[Math.floor(Math.random() * CONFETTI_PALETTE.length)],
        });
      }
    };

    // Choreographed dual-popper launch + zenith confetti drop
    const baseCount = triumph ? 44 : 34;
    const timers: number[] = [];

    setCannonPulse('left');
    spawnCannon(Math.max(48, width * 0.06), height - 38, -56, baseCount, 1.05);

    timers.push(
      window.setTimeout(() => {
        setCannonPulse('right');
        spawnCannon(Math.min(width - 48, width * 0.94), height - 38, -124, baseCount, 1.05);
      }, 170),
    );

    timers.push(
      window.setTimeout(() => {
        setCannonPulse('both');
        spawnZenithShower(triumph ? 36 : 24);
      }, 420),
    );

    if (triumph) {
      timers.push(
        window.setTimeout(() => {
          spawnCannon(Math.max(48, width * 0.08), height - 42, -48, 22, 1.15);
          spawnCannon(Math.min(width - 48, width * 0.92), height - 42, -132, 22, 1.15);
        }, 880),
      );
    }

    timers.push(
      window.setTimeout(() => setCannonPulse('idle'), 1150),
    );

    let animId = 0;
    const drawStar = (xSize: number) => {
      ctx.beginPath();
      for (let i = 0; i < 4; i += 1) {
        const angle = (i * Math.PI) / 2;
        const inner = angle + Math.PI / 4;
        if (i === 0) ctx.moveTo(Math.cos(angle) * xSize, Math.sin(angle) * xSize);
        else ctx.lineTo(Math.cos(angle) * xSize, Math.sin(angle) * xSize);
        ctx.lineTo(Math.cos(inner) * (xSize * 0.36), Math.sin(inner) * (xSize * 0.36));
      }
      ctx.closePath();
      ctx.fill();
    };

    const tick = () => {
      ctx.clearRect(0, 0, width, height);
      const list = particlesRef.current;

      for (let i = list.length - 1; i >= 0; i -= 1) {
        const p = list[i];
        p.swayPhase += p.swayFreq;
        p.vx = p.vx * 0.985 + Math.cos(p.swayPhase) * 0.09;
        p.vy = p.vy * 0.988 + 0.19; // buoyant paper gravity
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.spin;
        p.tilt += p.tiltSpeed;
        if (p.y > height * 0.55 || p.vy > 0) {
          p.alpha -= p.decay;
        }

        if (p.alpha <= 0.02 || p.y > height + 40) {
          list.splice(i, 1);
          continue;
        }

        const scaleY = Math.max(0.18, Math.abs(Math.cos(p.tilt)));
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(1, scaleY);
        ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
        ctx.fillStyle = p.color;

        if (p.shape === 'star') {
          drawStar(p.size);
        } else if (p.shape === 'ribbon') {
          ctx.fillRect(-p.size * 0.9, -p.size * 0.24, p.size * 1.8, p.size * 0.48);
        } else {
          ctx.fillRect(-p.size * 0.5, (-p.size * p.aspect) / 2, p.size, p.size * p.aspect);
        }
        ctx.restore();
      }

      if (list.length > 0) {
        animId = window.requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', onResize);
      window.cancelAnimationFrame(animId);
      for (const t of timers) window.clearTimeout(t);
    };
  }, [active, triumph, burstKey]);

  if (!active) return null;

  return (
    <div className="cq-celebration-layer" aria-hidden="true" data-testid="victory-celebration-layer">
      <canvas ref={canvasRef} className="cq-confetti-canvas" />
      <div
        className={`cq-popper-cannon cq-popper-cannon--left ${
          cannonPulse === 'left' || cannonPulse === 'both' ? 'is-firing' : ''
        }`}
      >
        <PartyPopperCannonSvg />
      </div>
      <div
        className={`cq-popper-cannon cq-popper-cannon--right ${
          cannonPulse === 'right' || cannonPulse === 'both' ? 'is-firing' : ''
        }`}
      >
        <PartyPopperCannonSvg />
      </div>
    </div>
  );
}

function PartyPopperCannonSvg() {
  return (
    <svg viewBox="0 0 88 88" className="cq-popper-svg" fill="none">
      <defs>
        <linearGradient id="cq-cone-gold" x1="14" y1="74" x2="54" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B2216" />
          <stop offset="50%" stopColor="#8E5B24" />
          <stop offset="100%" stopColor="#F2C879" />
        </linearGradient>
      </defs>
      {/* Confetti burst streaks out of cone mouth */}
      <path d="M52 34 C60 22, 70 16, 80 12" stroke="#F5CA7B" strokeWidth="3" strokeLinecap="round" />
      <path d="M56 42 C68 38, 76 34, 84 28" stroke="#E0565B" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 28 C46 16, 52 10, 62 6" stroke="#4EA86B" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="72" cy="18" r="2.8" fill="#FFE9B8" />
      <circle cx="80" cy="36" r="2.2" fill="#F5CA7B" />
      <circle cx="58" cy="12" r="2.2" fill="#E0565B" />
      {/* Party popper cone body */}
      <path d="M14 74 L34 26 L62 54 Z" fill="url(#cq-cone-gold)" stroke="#FFE4B0" strokeWidth="1.5" />
      <path d="M22 61 L48 39" stroke="#FFE9B8" strokeOpacity="0.6" strokeWidth="2.5" />
      <path d="M28 46 L42 33" stroke="#2D1B13" strokeOpacity="0.55" strokeWidth="2.2" />
      <ellipse cx="48" cy="40" rx="19" ry="7" transform="rotate(45 48 40)" fill="#2D1B13" stroke="#F5CA7B" strokeWidth="1.5" />
    </svg>
  );
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
  onCelebrate,
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
  onCelebrate?: () => void;
}) {
  return (
    <div
      className={`cq-reward-moment ${won ? 'is-win' : 'is-loss'} ${won && bossCorrect === 3 ? 'is-grand' : ''}`}
      data-testid="panel-chocolate-reward"
      data-verdict={won ? 'won' : 'lost'}
    >
      <div className="cq-reward-moment__glow" aria-hidden="true" />
      <div className="cq-reward-moment__seal" aria-hidden="true">
        <div className="cq-reward-moment__seal-ring">
          {won ? (bossCorrect === 3 ? <Crown size={22} /> : <Award size={22} />) : <Sparkles size={20} />}
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
      <div className="cq-reward-moment__actions">
        <div className="cq-reward-moment__badge mono">
          <span>{won ? 'WINNER' : 'DEFEAT'}</span>
        </div>
        {won && onCelebrate && (
          <button
            type="button"
            className="cq-popper-btn"
            data-testid="button-pop-confetti"
            onClick={onCelebrate}
          >
            <PartyPopper size={14} />
            <span>Pop confetti</span>
          </button>
        )}
      </div>
    </div>
  );
}

