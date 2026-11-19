import type { AbilityId } from "./types";

type WaveFlavor = "warm" | "marimba" | "harp" | "brass" | "chime" | "triangle";

type Tone = {
  frequency: number;
  delay?: number;
  duration?: number;
  volume?: number;
  flavor?: WaveFlavor;
};

interface SpokenPhrase {
  text: string;
  pauseBeforeMs?: number;
  rate?: number;
  pitch?: number;
  volume?: number;
}

let sharedContext: AudioContext | null = null;
let masterInput: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceListenerAttached = false;
let speechEpoch = 0;
let pendingSpeechTimers: number[] = [];

function clearPendingSpeechTimers(): void {
  if (typeof window === "undefined") return;
  for (const id of pendingSpeechTimers) {
    window.clearTimeout(id);
  }
  pendingSpeechTimers = [];
}

function buildWarmImpulse(context: AudioContext, seconds = 0.85): AudioBuffer {
  const sampleRate = context.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * seconds));
  const impulse = context.createBuffer(2, length, sampleRate);
  for (let ch = 0; ch < 2; ch += 1) {
    const channelData = impulse.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < length; i += 1) {
      const progress = i / length;
      const decay = Math.pow(1 - progress, 2.7);
      const white = Math.random() * 2 - 1;
      lp = lp * 0.72 + white * 0.28;
      channelData[i] = lp * decay * 0.42;
    }
  }
  return impulse;
}

function getNoiseBuffer(context: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === context.sampleRate) {
    return noiseBuffer;
  }
  const length = Math.floor(context.sampleRate * 0.65);
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  noiseBuffer = buffer;
  return buffer;
}

function ensureMasterBus(context: AudioContext): GainNode {
  if (masterInput) return masterInput;

  const input = context.createGain();
  input.gain.value = 0.9;

  const warmthFilter = context.createBiquadFilter();
  warmthFilter.type = "lowpass";
  warmthFilter.frequency.value = 6400;
  warmthFilter.Q.value = 0.55;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 18;
  compressor.ratio.value = 3.2;
  compressor.attack.value = 0.008;
  compressor.release.value = 0.16;

  const dryGain = context.createGain();
  dryGain.gain.value = 0.88;

  const wetGain = context.createGain();
  wetGain.gain.value = 0.22;

  try {
    const convolver = context.createConvolver();
    convolver.buffer = buildWarmImpulse(context, 0.9);
    input.connect(warmthFilter);
    warmthFilter.connect(dryGain);
    warmthFilter.connect(convolver);
    convolver.connect(wetGain);
    dryGain.connect(compressor);
    wetGain.connect(compressor);
    compressor.connect(context.destination);
  } catch {
    input.connect(warmthFilter);
    warmthFilter.connect(compressor);
    compressor.connect(context.destination);
  }

  masterInput = input;
  return input;
}

async function getReadyContext(): Promise<AudioContext | null> {
  if (typeof window === "undefined") return null;

  const browserWindow = window as Window & {
    webkitAudioContext?: typeof AudioContext;
  };
  const AudioContextConstructor =
    window.AudioContext ?? browserWindow.webkitAudioContext;
  if (!AudioContextConstructor) return null;

  try {
    if (!sharedContext) {
      sharedContext = new AudioContextConstructor();
      masterInput = null;
      noiseBuffer = null;
    }
    if (sharedContext.state === "suspended") {
      await sharedContext.resume();
    }
    ensureMasterBus(sharedContext);
    return sharedContext;
  } catch {
    return null;
  }
}

function scoreVoiceHumanQuality(voice: SpeechSynthesisVoice): number {
  const name = voice.name || "";
  const lang = voice.lang || "";
  let score = 0;

  // Strongly prefer English voices matching natural regional dialects
  if (/^en(-|_)?(US|GB|AU|CA|IN|IE|NZ)$/i.test(lang)) score += 60;
  else if (/^en/i.test(lang)) score += 35;
  else score -= 120;

  // Tier 1: Neural / Natural / Online / Studio / Siri / macOS Enhanced voices
  if (/(natural|neural|online|wavenet|studio|enhanced|premium)/i.test(name)) {
    score += 120;
  }

  // Tier 2: High-quality modern human desktop voices (Edge/Win11/macOS/ChromeOS)
  if (
    /(aria|jenny|ava|emma|andrew|brian|guy|sonia|libby|ryan|samantha|daniel|serena|karen|moira|tessa|oliver|claire|allison|alex|nicky|kate)/i.test(
      name,
    )
  ) {
    score += 55;
  }

  // Google Chrome OS / Google US-UK voices sound substantially warmer than raw SAPI
  if (/google (us|uk) english/i.test(name)) {
    score += 65;
  }

  // Penalize robotic legacy synthesizers & novelty voices
  if (
    /(espeak|festival|mbrola|albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|fred|hysterical|organ|trinoids|whisper|zarvox|jester|superstar)/i.test(
      name,
    )
  ) {
    score -= 110;
  }

  // Deprioritize older robotic desktop voices if a neural voice is installed
  if (/microsoft (david|zira|mark)( desktop)?$/i.test(name)) {
    score -= 15;
  }

  if (voice.localService) score += 8;
  return score;
}

function pickPreferredVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | null {
  try {
    if (!voiceListenerAttached && typeof synth.addEventListener === "function") {
      voiceListenerAttached = true;
      synth.addEventListener("voiceschanged", () => {
        cachedVoice = null;
      });
    }
    if (cachedVoice) return cachedVoice;
    const voices = synth.getVoices();
    if (!voices.length) return null;

    let best: SpeechSynthesisVoice | null = null;
    let bestScore = -Infinity;
    for (const voice of voices) {
      const score = scoreVoiceHumanQuality(voice);
      if (score > bestScore) {
        bestScore = score;
        best = voice;
      }
    }
    cachedVoice = best ?? voices[0] ?? null;
    return cachedVoice;
  } catch {
    return null;
  }
}

export function stopAllAudio(): void {
  speechEpoch += 1;
  clearPendingSpeechTimers();
  if (typeof window === "undefined") return;
  try {
    if ("speechSynthesis" in window && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // Ignore speech synthesis errors on restricted platforms
  }
}

function speakPhrases(
  phrases: SpokenPhrase[],
  initialDelayMs = 0,
  interrupt = true,
): void {
  if (typeof window === "undefined" || phrases.length === 0) return;
  try {
    if (!("speechSynthesis" in window) || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    if (interrupt) {
      speechEpoch += 1;
      clearPendingSpeechTimers();
      synth.cancel();
    }
    const token = speechEpoch;
    const voice = pickPreferredVoice(synth);

    const speakNext = (index: number) => {
      if (token !== speechEpoch || index >= phrases.length) return;
      const item = phrases[index];
      const delay = index === 0 ? initialDelayMs + (item.pauseBeforeMs ?? 0) : item.pauseBeforeMs ?? 90;

      const scheduleId = window.setTimeout(() => {
        if (token !== speechEpoch) return;
        const utterance = new SpeechSynthesisUtterance(item.text);
        if (voice) utterance.voice = voice;
        utterance.lang = voice?.lang || "en-US";
        utterance.rate = item.rate ?? 0.99;
        utterance.pitch = item.pitch ?? 1.02;
        utterance.volume = item.volume ?? 0.94;
        if (index + 1 < phrases.length) {
          utterance.onend = () => speakNext(index + 1);
          utterance.onerror = () => speakNext(index + 1);
        }
        synth.speak(utterance);
      }, delay);

      pendingSpeechTimers.push(scheduleId);
    };

    speakNext(0);
  } catch {
    // Web Audio fanfare still runs cleanly if speechSynthesis is unavailable
  }
}

export function speakCue(
  text: string,
  options: {
    interrupt?: boolean;
    rate?: number;
    pitch?: number;
    volume?: number;
    delayMs?: number;
  } = {},
): void {
  speakPhrases(
    [
      {
        text,
        rate: options.rate ?? 0.99,
        pitch: options.pitch ?? 1.02,
        volume: options.volume ?? 0.94,
      },
    ],
    options.delayMs ?? 0,
    options.interrupt !== false,
  );
}

function scheduleAcousticNote(
  context: AudioContext,
  bus: GainNode,
  tone: Tone,
  baseTime: number,
): void {
  const start = baseTime + (tone.delay ?? 0);
  const duration = tone.duration ?? 0.22;
  const volume = tone.volume ?? 0.08;
  const flavor = tone.flavor ?? "warm";

  const noteGain = context.createGain();
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";

  if (flavor === "brass") {
    filter.frequency.setValueAtTime(Math.min(2600, tone.frequency * 4.5), start);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(500, tone.frequency * 2.1),
      start + duration,
    );
    noteGain.gain.setValueAtTime(0.0001, start);
    noteGain.gain.linearRampToValueAtTime(volume, start + 0.045);
    noteGain.gain.exponentialRampToValueAtTime(volume * 0.72, start + duration * 0.55);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  } else if (flavor === "marimba") {
    filter.frequency.setValueAtTime(Math.min(4800, tone.frequency * 6), start);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(700, tone.frequency * 2.2),
      start + duration * 0.7,
    );
    noteGain.gain.setValueAtTime(0.0001, start);
    noteGain.gain.linearRampToValueAtTime(volume * 1.15, start + 0.008);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  } else if (flavor === "harp") {
    filter.frequency.setValueAtTime(Math.min(5400, tone.frequency * 7), start);
    filter.frequency.exponentialRampToValueAtTime(
      Math.max(800, tone.frequency * 2.4),
      start + duration,
    );
    noteGain.gain.setValueAtTime(0.0001, start);
    noteGain.gain.linearRampToValueAtTime(volume * 1.05, start + 0.012);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 1.15);
  } else {
    filter.frequency.setValueAtTime(Math.min(4200, tone.frequency * 5), start);
    noteGain.gain.setValueAtTime(0.0001, start);
    noteGain.gain.linearRampToValueAtTime(volume, start + 0.02);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  }

  filter.connect(noteGain);
  noteGain.connect(bus);

  // Layer fundamental + warm harmonic overtone so it sounds acoustic, not like a square/sine beep
  const osc1 = context.createOscillator();
  const osc2 = context.createOscillator();
  const subGain = context.createGain();

  if (flavor === "brass") {
    osc1.type = "sawtooth";
    osc2.type = "triangle";
    osc2.detune.value = 6;
    subGain.gain.value = 0.55;
  } else if (flavor === "marimba") {
    osc1.type = "sine";
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(tone.frequency * 4, start);
    subGain.gain.value = 0.12;
  } else if (flavor === "harp" || flavor === "chime") {
    osc1.type = "triangle";
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(tone.frequency * 2, start);
    osc2.detune.value = 4;
    subGain.gain.value = 0.24;
  } else {
    osc1.type = flavor === "triangle" ? "triangle" : "sine";
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(tone.frequency * 2, start);
    osc2.detune.value = 3;
    subGain.gain.value = 0.16;
  }

  osc1.frequency.setValueAtTime(tone.frequency, start);
  if (flavor === "brass") {
    osc2.frequency.setValueAtTime(tone.frequency, start);
  }

  osc1.connect(filter);
  osc2.connect(subGain);
  subGain.connect(filter);

  const stopTime = start + duration * 1.2 + 0.03;
  osc1.start(start);
  osc2.start(start);
  osc1.stop(stopTime);
  osc2.stop(stopTime);
}

function schedulePartyPopperCannon(
  context: AudioContext,
  bus: GainNode,
  startAt: number,
  pitchMult = 1,
): void {
  // 1. Acoustic cork/membrane pop ("THWUMP")
  const popOsc = context.createOscillator();
  const popGain = context.createGain();
  popOsc.type = "sine";
  popOsc.frequency.setValueAtTime(195 * pitchMult, startAt);
  popOsc.frequency.exponentialRampToValueAtTime(52 * pitchMult, startAt + 0.085);
  popGain.gain.setValueAtTime(0.0001, startAt);
  popGain.gain.linearRampToValueAtTime(0.24, startAt + 0.005);
  popGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.11);
  popOsc.connect(popGain);
  popGain.connect(bus);
  popOsc.start(startAt);
  popOsc.stop(startAt + 0.13);

  // 2. Crisp paper confetti flutter burst (bandpass-filtered white noise)
  const noiseSrc = context.createBufferSource();
  noiseSrc.buffer = getNoiseBuffer(context);
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.setValueAtTime(2400 * pitchMult, startAt);
  band.frequency.exponentialRampToValueAtTime(950, startAt + 0.28);
  band.Q.value = 0.85;

  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.0001, startAt);
  noiseGain.gain.linearRampToValueAtTime(0.18, startAt + 0.012);
  noiseGain.gain.exponentialRampToValueAtTime(0.028, startAt + 0.14);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.34);

  noiseSrc.connect(band);
  band.connect(noiseGain);
  noiseGain.connect(bus);
  noiseSrc.start(startAt);
  noiseSrc.stop(startAt + 0.36);

  // 3. Glittering foil sparkles rising from the pop
  const sparkles = [1046.5, 1318.51, 1567.98, 2093.0];
  sparkles.forEach((freq, idx) => {
    scheduleAcousticNote(
      context,
      bus,
      {
        frequency: freq * (0.98 + pitchMult * 0.02),
        delay: 0.03 + idx * 0.045,
        duration: 0.22,
        volume: 0.036,
        flavor: "harp",
      },
      startAt,
    );
  });
}

export async function playTones(tones: Tone[]): Promise<boolean> {
  const context = await getReadyContext();
  if (!context) return false;

  const bus = ensureMasterBus(context);
  const now = context.currentTime + 0.015;
  for (const tone of tones) {
    try {
      scheduleAcousticNote(context, bus, tone, now);
    } catch {
      return false;
    }
  }
  return true;
}

export async function playCelebrationBurstSound(grand = false): Promise<void> {
  const context = await getReadyContext();
  if (!context) return;
  const bus = ensureMasterBus(context);
  const now = context.currentTime + 0.015;

  // Dual party popper cannons (Left + Right)
  schedulePartyPopperCannon(context, bus, now, 1.0);
  schedulePartyPopperCannon(context, bus, now + 0.18, 1.12);
  if (grand) {
    schedulePartyPopperCannon(context, bus, now + 0.38, 1.24);
  }
}

export function playSoundEnabledChime(): void {
  void playTones([
    { frequency: 523.25, duration: 0.18, volume: 0.065, flavor: "harp" },
    { frequency: 659.25, delay: 0.08, duration: 0.2, volume: 0.065, flavor: "harp" },
    { frequency: 783.99, delay: 0.16, duration: 0.32, volume: 0.075, flavor: "harp" },
  ]);
  speakCue("Sound is on. Good luck!", { delayMs: 180, rate: 0.98, pitch: 1.04 });
}

export function playStartSound(): void {
  void playTones([
    { frequency: 392.0, duration: 0.15, volume: 0.06, flavor: "marimba" },
    { frequency: 523.25, delay: 0.08, duration: 0.16, volume: 0.07, flavor: "marimba" },
    { frequency: 659.25, delay: 0.16, duration: 0.2, volume: 0.075, flavor: "harp" },
    { frequency: 783.99, delay: 0.25, duration: 0.34, volume: 0.085, flavor: "harp" },
  ]);
  speakPhrases(
    [
      { text: "Alright, let's play.", rate: 0.99, pitch: 1.04 },
      { text: "Sixty seconds on the clock!", pauseBeforeMs: 110, rate: 1.01, pitch: 1.06 },
    ],
    220,
  );
}

export function playAnswerSound(
  correct: boolean,
  options: { boss?: boolean; streak?: number; shieldAbsorbed?: boolean } = {},
): void {
  if (options.shieldAbsorbed) {
    void playTones([
      { frequency: 440, duration: 0.16, volume: 0.065, flavor: "harp" },
      { frequency: 554.37, delay: 0.08, duration: 0.18, volume: 0.065, flavor: "harp" },
      { frequency: 659.25, delay: 0.16, duration: 0.3, volume: 0.075, flavor: "harp" },
    ]);
    speakCue("Nice save! Your shield kept the streak alive.", {
      delayMs: 150,
      rate: 0.99,
      pitch: 1.04,
    });
    return;
  }

  if (correct) {
    const nextStreak = options.streak ?? 1;
    const pitchBoost = Math.min(1.18, 1 + Math.max(0, nextStreak - 1) * 0.02);
    if (options.boss) {
      void playTones([
        { frequency: 587.33, duration: 0.14, volume: 0.075, flavor: "marimba" },
        { frequency: 739.99, delay: 0.08, duration: 0.18, volume: 0.075, flavor: "harp" },
        { frequency: 880.0, delay: 0.16, duration: 0.32, volume: 0.085, flavor: "harp" },
      ]);
      return;
    }

    void playTones([
      { frequency: 587.33 * pitchBoost, duration: 0.14, volume: 0.068, flavor: "marimba" },
      { frequency: 880.0 * pitchBoost, delay: 0.085, duration: 0.24, volume: 0.078, flavor: "harp" },
    ]);

    if (nextStreak === 3) {
      void playTones([
        { frequency: 783.99, delay: 0.17, duration: 0.16, volume: 0.06, flavor: "harp" },
        { frequency: 1046.5, delay: 0.26, duration: 0.26, volume: 0.068, flavor: "harp" },
      ]);
      speakCue("Three in a row! Keep that rhythm going.", {
        delayMs: 210,
        rate: 1.01,
        pitch: 1.06,
      });
    } else if (nextStreak === 5) {
      void playTones([
        { frequency: 880.0, delay: 0.17, duration: 0.16, volume: 0.065, flavor: "harp" },
        { frequency: 1174.66, delay: 0.26, duration: 0.28, volume: 0.072, flavor: "harp" },
      ]);
      speakCue("Five streak! You are on fire!", {
        delayMs: 210,
        rate: 1.02,
        pitch: 1.08,
      });
    } else if (nextStreak === 8) {
      speakCue("Eight straight! Simply unstoppable!", {
        delayMs: 200,
        rate: 1.01,
        pitch: 1.08,
      });
    }
    return;
  }

  void playTones([
    { frequency: 246.94, duration: 0.15, volume: 0.06, flavor: "marimba" },
    { frequency: 196.0, delay: 0.1, duration: 0.26, volume: 0.065, flavor: "warm" },
  ]);
}

export function playSkipSound(): void {
  void playTones([
    { frequency: 440, duration: 0.09, volume: 0.04, flavor: "marimba" },
    { frequency: 349.23, delay: 0.055, duration: 0.12, volume: 0.035, flavor: "marimba" },
  ]);
}

export function playAbilitySound(ability: AbilityId): void {
  if (ability === "shield") {
    void playTones([
      { frequency: 392.0, duration: 0.15, volume: 0.065, flavor: "harp" },
      { frequency: 587.33, delay: 0.08, duration: 0.24, volume: 0.075, flavor: "harp" },
    ]);
    speakCue("Shield armed. Your streak is protected.", {
      delayMs: 160,
      rate: 0.99,
      pitch: 1.03,
    });
    return;
  }
  if (ability === "fiftyFifty") {
    void playTones([
      { frequency: 587.33, duration: 0.12, volume: 0.065, flavor: "marimba" },
      { frequency: 880.0, delay: 0.075, duration: 0.2, volume: 0.07, flavor: "harp" },
    ]);
    speakCue("Two choices cleared away.", {
      delayMs: 150,
      rate: 1.0,
      pitch: 1.04,
    });
    return;
  }
  void playTones([
    { frequency: 523.25, duration: 0.11, volume: 0.06, flavor: "harp" },
    { frequency: 659.25, delay: 0.065, duration: 0.12, volume: 0.065, flavor: "harp" },
    { frequency: 783.99, delay: 0.13, duration: 0.14, volume: 0.07, flavor: "harp" },
    { frequency: 1046.5, delay: 0.2, duration: 0.24, volume: 0.078, flavor: "harp" },
  ]);
  speakCue("Extra time added!", {
    delayMs: 190,
    rate: 1.02,
    pitch: 1.06,
  });
}

export function playBossIntroSound(): void {
  void playTones([
    { frequency: 146.83, duration: 0.36, volume: 0.085, flavor: "brass" },
    { frequency: 220.0, delay: 0.06, duration: 0.36, volume: 0.07, flavor: "brass" },
    { frequency: 293.66, delay: 0.15, duration: 0.44, volume: 0.075, flavor: "brass" },
  ]);
  speakPhrases(
    [
      { text: "Time is up!", rate: 0.98, pitch: 1.02 },
      { text: "Now, it's time for the boss round.", pauseBeforeMs: 140, rate: 0.96, pitch: 0.99 },
    ],
    260,
  );
}

export function playBossStartSound(): void {
  void playTones([
    { frequency: 293.66, duration: 0.14, volume: 0.07, flavor: "brass" },
    { frequency: 349.23, delay: 0.09, duration: 0.14, volume: 0.07, flavor: "brass" },
    { frequency: 440.0, delay: 0.18, duration: 0.18, volume: 0.075, flavor: "brass" },
    { frequency: 587.33, delay: 0.28, duration: 0.3, volume: 0.085, flavor: "harp" },
  ]);
  speakCue("Here comes the boss. Stay sharp!", {
    delayMs: 220,
    rate: 0.98,
    pitch: 1.01,
  });
}

export function playTimerTickSound(): void {
  void playTones([{ frequency: 880, duration: 0.075, volume: 0.032, flavor: "marimba" }]);
}

export function playTimeoutSound(): void {
  void playTones([
    { frequency: 220, duration: 0.18, volume: 0.07, flavor: "brass" },
    { frequency: 164.81, delay: 0.12, duration: 0.32, volume: 0.075, flavor: "brass" },
  ]);
  speakCue("Time's up!", { delayMs: 120, rate: 0.99, pitch: 1.0 });
}

export function playResultVerdictAudio(won: boolean, bossCorrect: number): void {
  if (won) {
    const isGrandSweep = bossCorrect === 3;

    // 1. Real dual/triple Party Popper bursts + glitter sparkles
    void playCelebrationBurstSound(isGrandSweep);

    // 2. Warm acoustic harp sweep + grand brass & chord resolution
    void playTones([
      { frequency: 261.63, delay: 0.12, duration: 0.45, volume: 0.055, flavor: "brass" },
      { frequency: 392.0, delay: 0.12, duration: 0.45, volume: 0.05, flavor: "brass" },
      { frequency: 523.25, delay: 0.14, duration: 0.2, volume: 0.075, flavor: "harp" },
      { frequency: 659.25, delay: 0.24, duration: 0.2, volume: 0.075, flavor: "harp" },
      { frequency: 783.99, delay: 0.34, duration: 0.22, volume: 0.08, flavor: "harp" },
      { frequency: 1046.5, delay: 0.46, duration: 0.58, volume: 0.09, flavor: "harp" },
      { frequency: 523.25, delay: 0.46, duration: 0.58, volume: 0.06, flavor: "brass" },
      { frequency: 659.25, delay: 0.46, duration: 0.58, volume: 0.055, flavor: "brass" },
      { frequency: 783.99, delay: 0.46, duration: 0.58, volume: 0.055, flavor: "brass" },
      { frequency: 1318.51, delay: 0.62, duration: 0.6, volume: 0.075, flavor: "chime" },
      ...(isGrandSweep
        ? [
            { frequency: 1567.98, delay: 0.74, duration: 0.65, volume: 0.068, flavor: "chime" as WaveFlavor },
          ]
        : []),
    ]);

    // 3. Natural conversational host voice entering after the initial popper snap
    if (isGrandSweep) {
      speakPhrases(
        [
          { text: "What a finish!", rate: 0.98, pitch: 1.07 },
          {
            text: "You swept all three boss questions, and won the game!",
            pauseBeforeMs: 120,
            rate: 0.97,
            pitch: 1.05,
          },
        ],
        520,
      );
    } else {
      speakPhrases(
        [
          { text: "Congratulations!", rate: 0.98, pitch: 1.07 },
          {
            text: "You won the game! Well played.",
            pauseBeforeMs: 110,
            rate: 0.97,
            pitch: 1.04,
          },
        ],
        480,
      );
    }
    return;
  }

  // Warm empathetic acoustic resolution on loss
  void playTones([
    { frequency: 392.0, duration: 0.24, volume: 0.06, flavor: "harp" },
    { frequency: 349.23, delay: 0.18, duration: 0.24, volume: 0.06, flavor: "harp" },
    { frequency: 293.66, delay: 0.36, duration: 0.3, volume: 0.065, flavor: "warm" },
    { frequency: 220.0, delay: 0.54, duration: 0.48, volume: 0.07, flavor: "brass" },
  ]);
  speakPhrases(
    [
      { text: "Sorry, you lost this run.", rate: 0.95, pitch: 0.98 },
      {
        text: "So close though, give it one more shot!",
        pauseBeforeMs: 130,
        rate: 0.97,
        pitch: 1.01,
      },
    ],
    420,
  );
}