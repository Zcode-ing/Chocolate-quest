type Tone = {
  frequency: number;
  delay?: number;
  duration?: number;
  volume?: number;
  wave?: OscillatorType;
};

let sharedContext: AudioContext | null = null;

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
  } catch (error) {
    console.warn("[Chocolate Quest] Browser audio could not be started.", error);
    return null;
  }
}

export async function playTones(tones: Tone[]): Promise<boolean> {
  const context = await getReadyContext();
  if (!context) return false;

  const now = context.currentTime + 0.015;
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
      oscillator.stop(start + duration + 0.01);
    } catch (error) {
      console.warn("[Chocolate Quest] A game sound could not be played.", error);
      return false;
    }
  }
  return true;
}

export function playSoundEnabledChime(): void {
  void playTones([
    { frequency: 523, duration: 0.12 },
    { frequency: 659, delay: 0.105, duration: 0.16 },
  ]);
}

export function playAnswerSound(correct: boolean): void {
  void playTones(
    correct
      ? [
          { frequency: 659, duration: 0.12 },
          { frequency: 880, delay: 0.105, duration: 0.2 },
        ]
      : [
          { frequency: 247, duration: 0.13, wave: "triangle" },
          { frequency: 185, delay: 0.11, duration: 0.19, wave: "triangle" },
        ],
  );
}

export function playSkipSound(): void {
  void playTones([{ frequency: 392, duration: 0.08, volume: 0.04 }]);
}

export function playTimeoutSound(): void {
  void playTones([
    { frequency: 220, duration: 0.15, wave: "triangle" },
    { frequency: 165, delay: 0.13, duration: 0.22, wave: "triangle" },
  ]);
}

export function playStartSound(): void {
  void playTones([
    { frequency: 392, duration: 0.1, volume: 0.05 },
    { frequency: 523, delay: 0.09, duration: 0.1, volume: 0.06 },
    { frequency: 659, delay: 0.18, duration: 0.16 },
  ]);
}