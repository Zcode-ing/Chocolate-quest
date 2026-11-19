import { LEVEL_CONFIG } from "./config";
import type { AcademicLevel } from "./types";

export const OFFLINE_DB_STORAGE_KEY = "chocolate-quest.players.v2";
export const LEGACY_LOYALTY_KEY = "chocolate-quest.cocoa-loyalty.v1";
export const SOUND_PREF_KEY = "chocolate-quest.sound-enabled.v1";
const IDB_NAME = "chocolate-quest-offline-db";
const IDB_STORE = "kv";
const IDB_PLAYERS_KEY = "players-snapshot";

// Default SHA-256 digest for offline exhibition developer access ("COCOA-QUEST-DEV")
const DEFAULT_DEV_ACCESS_HASH =
  "eb3c5d4b54d70694a1211192821b78cb79c483628d7e912bec4a91578e1e19d5";

export interface RunHistoryEntry {
  runId: string;
  level: AcademicLevel;
  score: number;
  accuracy: number;
  answered: number;
  bossCorrect: number;
  won: boolean;
  beansEarned: number;
  playedAt: string;
}

export interface CocoaPlayerProfile {
  username: string;
  normalizedUsername: string;
  beans: number;
  completedRuns: number;
  wins: number;
  losses: number;
  bestScore: number;
  bestAccuracy: number;
  lastRunId: string | null;
  lastRunBeans: number;
  lastRunAccuracy: number;
  lastRunWon: boolean | null;
  totalAnswers: number;
  totalCorrect: number;
  estimatedSkillByLevel: Record<AcademicLevel, number>;
  lastLevel: AcademicLevel | null;
  lastPlayedAt: string | null;
  recentRuns: RunHistoryEntry[];
}

export const MAX_USERNAME_LENGTH = 24;

export function normalizeUsername(username: string): string {
  return username
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("en-US");
}

export function validateUsername(username: string): string | null {
  const trimmed = username.normalize("NFKC").trim().replace(/\s+/g, " ");
  if (!trimmed) return "Enter a username to continue.";
  if (trimmed.length > MAX_USERNAME_LENGTH) {
    return `Use ${MAX_USERNAME_LENGTH} characters or fewer.`;
  }
  if (/[\u0000-\u001f\u007f]/u.test(trimmed)) {
    return "Use a nickname without control characters.";
  }
  return null;
}

export function createDefaultProfile(username: string): CocoaPlayerProfile {
  return {
    username,
    normalizedUsername: normalizeUsername(username),
    beans: 0,
    completedRuns: 0,
    wins: 0,
    losses: 0,
    bestScore: 0,
    bestAccuracy: 0,
    lastRunId: null,
    lastRunBeans: 0,
    lastRunAccuracy: 0,
    lastRunWon: null,
    totalAnswers: 0,
    totalCorrect: 0,
    estimatedSkillByLevel: {
      junior: LEVEL_CONFIG.junior.initialSkill,
      "semi-senior": LEVEL_CONFIG["semi-senior"].initialSkill,
      senior: LEVEL_CONFIG.senior.initialSkill,
      "ultra-advanced": LEVEL_CONFIG["ultra-advanced"].initialSkill,
    },
    lastLevel: null,
    lastPlayedAt: null,
    recentRuns: [],
  };
}

function isAcademicLevel(value: unknown): value is AcademicLevel {
  return (
    value === "junior" ||
    value === "semi-senior" ||
    value === "senior" ||
    value === "ultra-advanced"
  );
}

function sanitizeRunEntry(value: unknown): RunHistoryEntry | null {
  if (!value || typeof value !== "object") return null;
  const entry = value as Partial<RunHistoryEntry>;
  if (
    typeof entry.runId !== "string" ||
    !isAcademicLevel(entry.level) ||
    typeof entry.score !== "number" ||
    !Number.isFinite(entry.score) ||
    typeof entry.accuracy !== "number" ||
    !Number.isFinite(entry.accuracy) ||
    typeof entry.answered !== "number" ||
    !Number.isFinite(entry.answered) ||
    typeof entry.bossCorrect !== "number" ||
    !Number.isFinite(entry.bossCorrect) ||
    typeof entry.won !== "boolean" ||
    typeof entry.beansEarned !== "number" ||
    !Number.isFinite(entry.beansEarned) ||
    typeof entry.playedAt !== "string"
  ) {
    return null;
  }
  return {
    runId: entry.runId,
    level: entry.level,
    score: Math.round(entry.score),
    accuracy: Math.min(1, Math.max(0, entry.accuracy)),
    answered: Math.max(0, Math.round(entry.answered)),
    bossCorrect: Math.max(0, Math.min(3, Math.round(entry.bossCorrect))),
    won: entry.won,
    beansEarned: Math.max(0, Math.round(entry.beansEarned)),
    playedAt: entry.playedAt,
  };
}

export function normalizePlayerRecord(value: unknown): CocoaPlayerProfile | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<CocoaPlayerProfile>;
  if (
    typeof raw.username !== "string" ||
    validateUsername(raw.username) !== null ||
    raw.normalizedUsername !== normalizeUsername(raw.username) ||
    typeof raw.beans !== "number" ||
    !Number.isFinite(raw.beans) ||
    raw.beans < 0 ||
    typeof raw.completedRuns !== "number" ||
    !Number.isFinite(raw.completedRuns) ||
    raw.completedRuns < 0 ||
    typeof raw.bestAccuracy !== "number" ||
    !Number.isFinite(raw.bestAccuracy) ||
    raw.bestAccuracy < 0 ||
    raw.bestAccuracy > 1 ||
    typeof raw.lastRunAccuracy !== "number" ||
    !Number.isFinite(raw.lastRunAccuracy) ||
    raw.lastRunAccuracy < 0 ||
    raw.lastRunAccuracy > 1 ||
    typeof raw.lastRunBeans !== "number" ||
    !Number.isFinite(raw.lastRunBeans) ||
    raw.lastRunBeans < 0 ||
    typeof raw.totalAnswers !== "number" ||
    !Number.isFinite(raw.totalAnswers) ||
    raw.totalAnswers < 0 ||
    typeof raw.totalCorrect !== "number" ||
    !Number.isFinite(raw.totalCorrect) ||
    raw.totalCorrect < 0 ||
    !raw.estimatedSkillByLevel ||
    !(["junior", "semi-senior", "senior", "ultra-advanced"] as const).every(
      (level) =>
        typeof raw.estimatedSkillByLevel?.[level] === "number" &&
        Number.isFinite(raw.estimatedSkillByLevel[level]) &&
        raw.estimatedSkillByLevel[level] >= 0 &&
        raw.estimatedSkillByLevel[level] <= 100,
    )
  ) {
    return null;
  }

  const recentRuns = Array.isArray(raw.recentRuns)
    ? raw.recentRuns
        .map(sanitizeRunEntry)
        .filter((item): item is RunHistoryEntry => item !== null)
        .slice(0, 10)
    : [];

  return {
    username: raw.username,
    normalizedUsername: raw.normalizedUsername,
    beans: Math.round(raw.beans),
    completedRuns: Math.round(raw.completedRuns),
    wins:
      typeof raw.wins === "number" && Number.isFinite(raw.wins) && raw.wins >= 0
        ? Math.round(raw.wins)
        : 0,
    losses:
      typeof raw.losses === "number" && Number.isFinite(raw.losses) && raw.losses >= 0
        ? Math.round(raw.losses)
        : 0,
    bestScore:
      typeof raw.bestScore === "number" && Number.isFinite(raw.bestScore)
        ? Math.round(raw.bestScore)
        : 0,
    bestAccuracy: raw.bestAccuracy,
    lastRunId: typeof raw.lastRunId === "string" ? raw.lastRunId : null,
    lastRunBeans: Math.round(raw.lastRunBeans),
    lastRunAccuracy: raw.lastRunAccuracy,
    lastRunWon: typeof raw.lastRunWon === "boolean" ? raw.lastRunWon : null,
    totalAnswers: Math.round(raw.totalAnswers),
    totalCorrect: Math.round(raw.totalCorrect),
    estimatedSkillByLevel: {
      junior: raw.estimatedSkillByLevel.junior,
      "semi-senior": raw.estimatedSkillByLevel["semi-senior"],
      senior: raw.estimatedSkillByLevel.senior,
      "ultra-advanced": raw.estimatedSkillByLevel["ultra-advanced"],
    },
    lastLevel: isAcademicLevel(raw.lastLevel) ? raw.lastLevel : null,
    lastPlayedAt: typeof raw.lastPlayedAt === "string" ? raw.lastPlayedAt : null,
    recentRuns,
  };
}

function migrateLegacyProfile(): CocoaPlayerProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(LEGACY_LOYALTY_KEY);
    if (!saved) return [];
    const legacy = JSON.parse(saved) as Record<string, unknown>;
    if (
      typeof legacy.beans !== "number" ||
      !Number.isFinite(legacy.beans) ||
      legacy.beans < 0 ||
      typeof legacy.completedRuns !== "number" ||
      !Number.isFinite(legacy.completedRuns) ||
      legacy.completedRuns < 0
    ) {
      return [];
    }
    const guest = createDefaultProfile("Guest");
    return [
      {
        ...guest,
        beans: Math.round(legacy.beans),
        completedRuns: Math.round(legacy.completedRuns),
        bestAccuracy:
          typeof legacy.bestAccuracy === "number"
            ? Math.min(1, Math.max(0, legacy.bestAccuracy))
            : 0,
        lastRunId: typeof legacy.lastRunId === "string" ? legacy.lastRunId : null,
        lastRunBeans:
          typeof legacy.lastRunBeans === "number"
            ? Math.max(0, Math.round(legacy.lastRunBeans))
            : 0,
        lastRunAccuracy:
          typeof legacy.lastRunAccuracy === "number"
            ? Math.min(1, Math.max(0, legacy.lastRunAccuracy))
            : 0,
      },
    ];
  } catch {
    return [];
  }
}

export function readOfflinePlayers(): CocoaPlayerProfile[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem(OFFLINE_DB_STORAGE_KEY);
    if (!saved) return migrateLegacyProfile();
    const parsed = JSON.parse(saved) as { players?: unknown };
    if (!Array.isArray(parsed.players)) return [];

    const unique = new Map<string, CocoaPlayerProfile>();
    for (const candidate of parsed.players) {
      const normalized = normalizePlayerRecord(candidate);
      if (!normalized) continue;
      if (!unique.has(normalized.normalizedUsername)) {
        unique.set(normalized.normalizedUsername, normalized);
      }
    }
    return [...unique.values()].sort((a, b) =>
      (b.lastPlayedAt ?? "").localeCompare(a.lastPlayedAt ?? ""),
    );
  } catch (error) {
    console.warn("[Chocolate Quest] Could not read offline player database.", error);
    return [];
  }
}

function mirrorToIndexedDb(players: CocoaPlayerProfile[]): void {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    return;
  }
  try {
    const request = window.indexedDB.open(IDB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    request.onsuccess = () => {
      try {
        const db = request.result;
        const tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).put({ players, updatedAt: Date.now() }, IDB_PLAYERS_KEY);
        tx.oncomplete = () => db.close();
      } catch {
        // Best-effort offline mirror
      }
    };
  } catch {
    // IndexedDB unavailable in private/file modes; localStorage remains primary
  }
}

export async function hydrateFromIndexedDbIfEmpty(): Promise<CocoaPlayerProfile[] | null> {
  if (typeof window === "undefined" || typeof window.indexedDB === "undefined") {
    return null;
  }
  const existing = readOfflinePlayers();
  if (existing.length > 0) return null;

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      request.onerror = () => resolve(null);
      request.onsuccess = () => {
        try {
          const db = request.result;
          const tx = db.transaction(IDB_STORE, "readonly");
          const getReq = tx.objectStore(IDB_STORE).get(IDB_PLAYERS_KEY);
          getReq.onsuccess = () => {
            const payload = getReq.result as { players?: unknown } | undefined;
            if (!payload || !Array.isArray(payload.players)) {
              db.close();
              resolve(null);
              return;
            }
            const restored = payload.players
              .map(normalizePlayerRecord)
              .filter((item): item is CocoaPlayerProfile => item !== null);
            db.close();
            if (restored.length > 0) {
              persistOfflinePlayers(restored);
              resolve(restored);
            } else {
              resolve(null);
            }
          };
          getReq.onerror = () => {
            db.close();
            resolve(null);
          };
        } catch {
          resolve(null);
        }
      };
    } catch {
      resolve(null);
    }
  });
}

export function persistOfflinePlayers(players: CocoaPlayerProfile[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      OFFLINE_DB_STORAGE_KEY,
      JSON.stringify({ version: 3, players }),
    );
  } catch (error) {
    console.warn("[Chocolate Quest] Could not save offline player database.", error);
  }
  mirrorToIndexedDb(players);
}

export function exportDatabaseSnapshot(players: CocoaPlayerProfile[]): string {
  return JSON.stringify(
    {
      app: "Chocolate Quest",
      schemaVersion: 3,
      exportedAt: new Date().toISOString(),
      players,
    },
    null,
    2,
  );
}

export function parseImportedDatabaseSnapshot(
  rawJson: string,
): CocoaPlayerProfile[] | null {
  try {
    const parsed = JSON.parse(rawJson) as { players?: unknown };
    if (!Array.isArray(parsed?.players)) return null;
    const unique = new Map<string, CocoaPlayerProfile>();
    for (const item of parsed.players) {
      const normalized = normalizePlayerRecord(item);
      if (normalized && !unique.has(normalized.normalizedUsername)) {
        unique.set(normalized.normalizedUsername, normalized);
      }
    }
    return [...unique.values()].sort((a, b) =>
      (b.lastPlayedAt ?? "").localeCompare(a.lastPlayedAt ?? ""),
    );
  } catch {
    return null;
  }
}

export function readSoundPreference(fallback = true): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(SOUND_PREF_KEY);
    if (raw === "true") return true;
    if (raw === "false") return false;
    return fallback;
  } catch {
    return fallback;
  }
}

export function saveSoundPreference(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUND_PREF_KEY, enabled ? "true" : "false");
  } catch {
    // Ignore storage quota issues
  }
}

const RECENT_PROMPTS_KEY = "chocolate-quest.recent-prompts.v1";
const MAX_RECENT_PROMPTS_PER_LEVEL = 155;

export function readRecentPromptKeys(level: AcademicLevel): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_PROMPTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<Record<AcademicLevel, unknown>>;
    const list = parsed?.[level];
    if (!Array.isArray(list)) return [];
    return list.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export function recordAskedPromptKey(
  level: AcademicLevel,
  promptKey: string,
): void {
  if (typeof window === "undefined" || !promptKey) return;
  try {
    const raw = window.localStorage.getItem(RECENT_PROMPTS_KEY);
    const parsed: Partial<Record<AcademicLevel, string[]>> = raw
      ? (JSON.parse(raw) as Partial<Record<AcademicLevel, string[]>>)
      : {};
    const current = Array.isArray(parsed[level]) ? parsed[level] : [];
    const deduped = current.filter((item) => item !== promptKey);
    deduped.push(promptKey);
    parsed[level] = deduped.slice(-MAX_RECENT_PROMPTS_PER_LEVEL);
    window.localStorage.setItem(RECENT_PROMPTS_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore storage quota issues
  }
}

/**
 * Pure-JS SHA-256 hex digest so developer code verification works 100% offline,
 * including over file:// where Web Crypto subtle may be unavailable.
 */
export function sha256Hex(input: string): string {
  const bytes = new TextEncoder().encode(input);
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  const H = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);

  const bitLen = bytes.length * 8;
  const paddedLen = Math.ceil((bytes.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(paddedLen - 4, bitLen >>> 0, false);

  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i += 1) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    H[0] = (H[0] + a) >>> 0;
    H[1] = (H[1] + b) >>> 0;
    H[2] = (H[2] + c) >>> 0;
    H[3] = (H[3] + d) >>> 0;
    H[4] = (H[4] + e) >>> 0;
    H[5] = (H[5] + f) >>> 0;
    H[6] = (H[6] + g) >>> 0;
    H[7] = (H[7] + h) >>> 0;
  }

  return Array.from(H)
    .map((word) => word.toString(16).padStart(8, "0"))
    .join("");
}

export function verifyLocalDeveloperCode(accessCode: string): boolean {
  const trimmed = accessCode.trim();
  if (trimmed.length < 8) return false;
  const expectedHash =
    (typeof import.meta !== "undefined" &&
      import.meta.env?.VITE_DEV_ACCESS_HASH) ||
    DEFAULT_DEV_ACCESS_HASH;
  return sha256Hex(trimmed) === expectedHash.toLowerCase();
}
