import type { AbilityId } from "./types";

type Tone = {
  frequency: number;
  delay?: number;
  duration?: number;
  volume?: number;
  wave?: OscillatorType;
};

let sharedContext: AudioContext | null = null;
let cachedVoice: SpeechSynthesisVoice | null = null;

async function getReadyContext(): Promise<AudioContext | null> {
  if (typeof window === "undefined") return null;

  const browserWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextConstructor =
    window.AudioContext ?? browserWindow.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  try {
    sharedContext ??= new AudioContextConstructor();
    if (sharedContext.state === "suspended") await sharedContext.resume();
    return sharedContext;
  } catch {
    return null;
  }
}

function pickPreferredVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  try {
    const voices = synth.getVoices();
    if (!voices.length) return null;
    const preferred =
      voices.find(
        (v) =>
          /^en(-|_)?(US|GB|IN)/i.test(v.lang) &&
          /(natural|aria|jenny|zira|samantha|google|daniel|david)/i.test(v.name),
      ) ??
      voices.find((v) => /^en/i.test(v.lang)) ??
      voices[0];
    cachedVoice = preferred ?? null;
    return cachedVoice;
  } catch {
    return null;
  }
}

export function stopAllAudio(): void {
  if (typeof window === "undefined") return;
  try {
    if ("speechSynthesis" in window && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore speech synthesis errors on restricted platforms
  }
}

export function speakCue(
  text: string,
  options: { interrupt?: boolean; rate?: number; pitch?: number; volume?: number } = {},
): void {
  if (typeof window === "undefined") return;
  try {
    if (!("speechSynthesis" in window) || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    if (options.interrupt !== false) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = pickPreferredVoice(synth);
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || "en-US";
    utterance.rate = options.rate ?? 1.04;
    utterance.pitch = options.pitch ?? 1.02;
    utterance.volume = options.volume ?? 0.92;
    synth.speak(utterance);
  } catch {
    // Web Audio fanfare still runs cleanly if speechSynthesis is unavailable
  }
}

export async function playTones(tones: Tone[]): Promise<boolean> {
  const context = await getReadyContext();
  if (!context) return false;

  const now = context.currentTime + 0.012;
  for (const tone of tones) {
    try {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + (tone.delay ?? 0);
      const duration = tone.duration ?? 0.15;
      const volume = tone.volume ?? 0.075;

      oscillator.type = tone.wave ?? "sine";
      oscillator.frequency.setValueAtTime(tone.frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.015);
    } catch {
      return false;
    }
  }
  return true;
}

export function playSoundEnabledChime(): void {
  void playTones([
    { frequency: 523.25, duration: 0.11, volume: 0.06 },
    { frequency: 659.25, delay: 0.09, duration: 0.11, volume: 0.06 },
    { frequency: 783.99, delay: 0.18, duration: 0.2, volume: 0.07 },
  ]);
  speakCue("Audio enabled.", { rate: 1.08, volume: 0.75 });
}

export function playStartSound(): void {
  void playTones([
    { frequency: 392.0, duration: 0.09, volume: 0.055 },
    { frequency: 523.25, delay: 0.08, duration: 0.1, volume: 0.065 },
    { frequency: 659.25, delay: 0.16, duration: 0.12, volume: 0.07 },
    { frequency: 783.99, delay: 0.25, duration: 0.22, volume: 0.075 },
  ]);
  speakCue("Let's play! Sixty seconds on the clock.", { rate: 1.08 });
}

export function playAnswerSound(
  correct: boolean,
  options: { boss?: boolean; streak?: number; shieldAbsorbed?: boolean } = {},
): void {
  if (options.shieldAbsorbed) {
    void playTones([
      { frequency: 440, duration: 0.12, volume: 0.06, wave: "triangle" },
      { frequency: 554.37, delay: 0.08, duration: 0.14, volume: 0.06 },
      { frequency: 659.25, delay: 0.16, duration: 0.22, volume: 0.065 },
    ]);
    speakCue("Shield saved your streak!", { rate: 1.1 });
    return;
  }

  if (correct) {
    const nextStreak = options.streak ?? 1;
    const pitchBoost = Math.min(1.22, 1 + Math.max(0, nextStreak - 1) * 0.025);
    if (options.boss) {
      void playTones([
        { frequency: 587.33, duration: 0.11, volume: 0.07 },
        { frequency: 739.99, delay: 0.085, duration: 0.12, volume: 0.07 },
        { frequency: 880.0, delay: 0.17, duration: 0.24, volume: 0.08 },
      ]);
      return;
    }

    void playTones([
      { frequency: 659.25 * pitchBoost, duration: 0.11, volume: 0.065 },
      { frequency: 880.0 * pitchBoost, delay: 0.095, duration: 0.19, volume: 0.075 },
    ]);

    if (nextStreak === 3) {
      void playTones([
        { frequency: 783.99, delay: 0.18, duration: 0.12, volume: 0.055 },
        { frequency: 1046.5, delay: 0.27, duration: 0.2, volume: 0.06 },
      ]);
      speakCue("Three in a row!", { rate: 1.12 });
    } else if (nextStreak === 5) {
      void playTones([
        { frequency: 880.0, delay: 0.18, duration: 0.11, volume: 0.06 },
        { frequency: 1174.66, delay: 0.27, duration: 0.22, volume: 0.065 },
      ]);
      speakCue("Five streak! On fire!", { rate: 1.12 });
    } else if (nextStreak === 8) {
      speakCue("Unstoppable!", { rate: 1.12 });
    }
    return;
  }

  void playTones([
    { frequency: 246.94, duration: 0.12, volume: 0.065, wave: "triangle" },
    { frequency: 185.0, delay: 0.1, duration: 0.2, volume: 0.07, wave: "triangle" },
  ]);
}

export function playSkipSound(): void {
  void playTones([
    { frequency: 440, duration: 0.06, volume: 0.035 },
    { frequency: 349.23, delay: 0.05, duration: 0.08, volume: 0.03 },
  ]);
}

export function playAbilitySound(ability: AbilityId): void {
  if (ability === "shield") {
    void playTones([
      { frequency: 392.0, duration: 0.12, volume: 0.06, wave: "triangle" },
      { frequency: 587.33, delay: 0.08, duration: 0.18, volume: 0.065 },
    ]);
    speakCue("Shield armed!", { rate: 1.1 });
    return;
  }
  if (ability === "fiftyFifty") {
    void playTones([
      { frequency: 587.33, duration: 0.08, volume: 0.06 },
      { frequency: 880.0, delay: 0.075, duration: 0.14, volume: 0.06 },
    ]);
    speakCue("Two options cleared.", { rate: 1.1 });
    return;
  }
  void playTones([
    { frequency: 523.25, duration: 0.08, volume: 0.055 },
    { frequency: 659.25, delay: 0.065, duration: 0.08, volume: 0.06 },
    { frequency: 783.99, delay: 0.13, duration: 0.09, volume: 0.065 },
    { frequency: 1046.5, delay: 0.2, duration: 0.18, volume: 0.07 },
  ]);
  speakCue("Extra time!", { rate: 1.12 });
}

export function playBossIntroSound(): void {
  void playTones([
    { frequency: 146.83, duration: 0.28, volume: 0.08, wave: "triangle" },
    { frequency: 220.0, delay: 0.05, duration: 0.28, volume: 0.06, wave: "triangle" },
    { frequency: 293.66, delay: 0.14, duration: 0.34, volume: 0.07, wave: "sawtooth" },
  ]);
  speakCue("Time is up! Welcome to the boss round.", { rate: 1.02 });
}

export function playBossStartSound(): void {
  void playTones([
    { frequency: 293.66, duration: 0.1, volume: 0.065, wave: "triangle" },
    { frequency: 349.23, delay: 0.09, duration: 0.1, volume: 0.065, wave: "triangle" },
    { frequency: 440.0, delay: 0.18, duration: 0.12, volume: 0.07, wave: "triangle" },
    { frequency: 587.33, delay: 0.27, duration: 0.24, volume: 0.075 },
  ]);
  speakCue("Boss round! Stay sharp.", { rate: 1.06 });
}

export function playTimerTickSound(): void {
  void playTones([{ frequency: 987.77, duration: 0.045, volume: 0.025 }]);
}

export function playTimeoutSound(): void {
  void playTones([
    { frequency: 220, duration: 0.14, volume: 0.07, wave: "triangle" },
    { frequency: 164.81, delay: 0.12, duration: 0.24, volume: 0.075, wave: "triangle" },
  ]);
  speakCue("Time's up!", { rate: 1.08 });
}

export function playResultVerdictAudio(won: boolean, bossCorrect: number): void {
  if (won) {
    // Triumphant ascending major fanfare + shimmer chord
    void playTones([
      { frequency: 523.25, duration: 0.13, volume: 0.07 },
      { frequency: 659.25, delay: 0.11, duration: 0.13, volume: 0.07 },
      { frequency: 783.99, delay: 0.22, duration: 0.14, volume: 0.075 },
      { frequency: 1046.5, delay: 0.34, duration: 0.34, volume: 0.085 },
      { frequency: 659.25, delay: 0.34, duration: 0.34, volume: 0.045 },
      { frequency: 783.99, delay: 0.34, duration: 0.34, volume: 0.045 },
      { frequency: 1318.51, delay: 0.5, duration: 0.42, volume: 0.07 },
    ]);
    speakCue(
      bossCorrect === 3
        ? "Grand victory! You swept the boss and won the game!"
        : "Congratulations! You won the game!",
      { rate: 1.0, pitch: 1.06 },
    );
    return;
  }

  // Gentle descending minor cadence for loss
  void playTones([
    { frequency: 440.0, duration: 0.18, volume: 0.06, wave: "triangle" },
    { frequency: 349.23, delay: 0.16, duration: 0.18, volume: 0.06, wave: "triangle" },
    { frequency: 293.66, delay: 0.32, duration: 0.22, volume: 0.065, wave: "triangle" },
    { frequency: 220.0, delay: 0.5, duration: 0.38, volume: 0.07, wave: "triangle" },
  ]);
  speakCue("Sorry, you lost. Better luck next run!", { rate: 0.98, pitch: 0.96 });
}