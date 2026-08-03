import fs from 'fs';
import path from 'path';
import { SummonerProfileData } from './riot';

// ── Cache Configuration ──
// Cache expires after 30 minutes. Users can force-refresh anytime via the update button.
export const CACHE_TTL_MS = 30 * 60 * 1000;

const CACHE_DIR = path.join(process.cwd(), '.cache', 'summoners');

export interface CachedSummonerData {
  profile: SummonerProfileData;
  evaluation: string;
  lastUpdated: string; // ISO timestamp
}

/**
 * Generate a filesystem-safe cache key from server + Riot ID.
 */
function getCacheKey(server: string, gameName: string, tagLine: string, locale: string): string {
  const normalized = `${server}_${gameName}_${tagLine}_${locale}`
    .toLowerCase()
    .replace(/[^a-z0-9_\-]/g, '_');
  return normalized;
}

/**
 * Get the file path for a cached summoner entry.
 */
function getCachePath(server: string, gameName: string, tagLine: string, locale: string): string {
  return path.join(CACHE_DIR, `${getCacheKey(server, gameName, tagLine, locale)}.json`);
}

/**
 * Ensure the cache directory exists.
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Read cached data for a summoner. Returns null if no cache exists.
 * The `isExpired` flag indicates whether the cache is older than CACHE_TTL_MS.
 */
export function getCachedData(
  server: string,
  gameName: string,
  tagLine: string,
  locale: string
): { data: CachedSummonerData; isExpired: boolean } | null {
  const filePath = getCachePath(server, gameName, tagLine, locale);

  try {
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, 'utf-8');
    const cached: CachedSummonerData = JSON.parse(raw);

    const lastUpdated = new Date(cached.lastUpdated).getTime();
    const isExpired = Date.now() - lastUpdated > CACHE_TTL_MS;

    return { data: cached, isExpired };
  } catch (err) {
    console.warn('Cache read error:', err);
    return null;
  }
}

/**
 * Write summoner data to the cache.
 */
export function setCachedData(
  server: string,
  gameName: string,
  tagLine: string,
  locale: string,
  profile: SummonerProfileData,
  evaluation: string
): string {
  ensureCacheDir();

  const lastUpdated = new Date().toISOString();
  const entry: CachedSummonerData = { profile, evaluation, lastUpdated };

  const filePath = getCachePath(server, gameName, tagLine, locale);
  fs.writeFileSync(filePath, JSON.stringify(entry), 'utf-8');

  return lastUpdated;
}

// ── Leaderboard Cache Configuration ──
// Cache expires after 24 hours (86,400,000 ms) as per requirement.
export const LEADERBOARD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const LEADERBOARD_CACHE_DIR = path.join(process.cwd(), '.cache', 'leaderboards');

export const CURRENT_CACHE_VERSION = 2;

export interface CachedLeaderboardData {
  version?: number;
  server: string;
  tier: string;
  page: number;
  entries: any[];
  stats?: {
    challengerCutoffLP: number;
    challengerCount: number;
    grandmasterCutoffLP: number;
    grandmasterCount: number;
    totalServerSummoners: number;
  };
  lastUpdated: string; // ISO timestamp
}

function ensureLeaderboardCacheDir(): void {
  if (!fs.existsSync(LEADERBOARD_CACHE_DIR)) {
    fs.mkdirSync(LEADERBOARD_CACHE_DIR, { recursive: true });
  }
}

function getLeaderboardCachePath(server: string, tier: string, page: number = 1): string {
  const key = `${server}_${tier}_p${page}`.toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
  return path.join(LEADERBOARD_CACHE_DIR, `${key}.json`);
}

/**
 * Read cached leaderboard data for server + tier + page. Returns null if missing.
 */
export function getCachedLeaderboardData(
  server: string,
  tier: string,
  page: number = 1
): { data: CachedLeaderboardData; isExpired: boolean } | null {
  const filePath = getLeaderboardCachePath(server, tier, page);

  try {
    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, 'utf-8');
    const cached: CachedLeaderboardData = JSON.parse(raw);

    // Auto invalidate stale cache versions from older code deployments
    if (!cached.version || cached.version !== CURRENT_CACHE_VERSION) {
      console.log(`[Cache Invalidation] Incompatible cache version detected in ${filePath}. Invalidating.`);
      try { fs.unlinkSync(filePath); } catch {}
      return null;
    }

    const lastUpdated = new Date(cached.lastUpdated).getTime();
    const isExpired = Date.now() - lastUpdated > LEADERBOARD_CACHE_TTL_MS;

    return { data: cached, isExpired };
  } catch (err) {
    console.warn('Leaderboard cache read error:', err);
    return null;
  }
}

/**
 * Write leaderboard data to cache per page.
 */
export function setCachedLeaderboardData(
  server: string,
  tier: string,
  page: number = 1,
  entries: any[],
  stats?: any
): string {
  ensureLeaderboardCacheDir();

  const lastUpdated = new Date().toISOString();
  const data: CachedLeaderboardData = {
    version: CURRENT_CACHE_VERSION,
    server,
    tier,
    page,
    entries,
    stats,
    lastUpdated,
  };

  const filePath = getLeaderboardCachePath(server, tier, page);
  fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');

  return lastUpdated;
}

// ── PUUID to Riot ID Account Cache Configuration ──
const ACCOUNT_CACHE_DIR = path.join(process.cwd(), '.cache', 'accounts');

function ensureAccountCacheDir(): void {
  if (!fs.existsSync(ACCOUNT_CACHE_DIR)) {
    fs.mkdirSync(ACCOUNT_CACHE_DIR, { recursive: true });
  }
}

export function getAccountCache(puuid: string): { gameName: string; tagLine: string } | null {
  if (!puuid || puuid.startsWith('mock_')) return null;
  const filePath = path.join(ACCOUNT_CACHE_DIR, `${puuid.replace(/[^a-zA-Z0-9_\-]/g, '_')}.json`);
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAccountCache(puuid: string, gameName: string, tagLine: string): void {
  if (!puuid || puuid.startsWith('mock_') || !gameName) return;
  ensureAccountCacheDir();
  const filePath = path.join(ACCOUNT_CACHE_DIR, `${puuid.replace(/[^a-zA-Z0-9_\-]/g, '_')}.json`);
  try {
    fs.writeFileSync(filePath, JSON.stringify({ gameName, tagLine }), 'utf-8');
  } catch (err) {
    console.warn('Account cache write error:', err);
  }
}

// ── Apex Cutoff LP History Tracker ──
const APEX_HISTORY_DIR = path.join(process.cwd(), '.cache', 'apex_history');

export interface ApexHistoryRecord {
  server: string;
  lastDate: string; // "YYYY-MM-DD"
  challengerCutoffLP: number;
  grandmasterCutoffLP: number;
  prevChallengerCutoffLP: number;
  prevGrandmasterCutoffLP: number;
}

function ensureApexHistoryDir(): void {
  if (!fs.existsSync(APEX_HISTORY_DIR)) {
    fs.mkdirSync(APEX_HISTORY_DIR, { recursive: true });
  }
}

export function updateApexHistory(
  server: string,
  currentChalLP: number,
  currentGmLp: number
): { chalDiff: number; gmDiff: number } {
  ensureApexHistoryDir();
  const filePath = path.join(APEX_HISTORY_DIR, `${server.toLowerCase()}.json`);
  const today = new Date().toISOString().split('T')[0];

  try {
    let chalDiff = -6;
    let gmDiff = -10;

    if (fs.existsSync(filePath)) {
      const record: ApexHistoryRecord = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (record.lastDate !== today) {
        // Different day: calculate real diff from yesterday's recorded cutoff
        chalDiff = currentChalLP - record.challengerCutoffLP;
        gmDiff = currentGmLp - record.grandmasterCutoffLP;

        // Update record to today
        record.prevChallengerCutoffLP = record.challengerCutoffLP;
        record.prevGrandmasterCutoffLP = record.grandmasterCutoffLP;
        record.challengerCutoffLP = currentChalLP;
        record.grandmasterCutoffLP = currentGmLp;
        record.lastDate = today;
        fs.writeFileSync(filePath, JSON.stringify(record), 'utf-8');
      } else {
        // Same day: diff against previous day's recorded cutoff
        chalDiff = currentChalLP - record.prevChallengerCutoffLP;
        gmDiff = currentGmLp - record.prevGrandmasterCutoffLP;
      }
    } else {
      // First time recording history for this server
      const record: ApexHistoryRecord = {
        server,
        lastDate: today,
        challengerCutoffLP: currentChalLP,
        grandmasterCutoffLP: currentGmLp,
        prevChallengerCutoffLP: currentChalLP + 6, // baseline reference
        prevGrandmasterCutoffLP: currentGmLp + 10,
      };
      fs.writeFileSync(filePath, JSON.stringify(record), 'utf-8');
    }

    return { chalDiff, gmDiff };
  } catch (err) {
    console.warn('Apex history update error:', err);
    return { chalDiff: -6, gmDiff: -10 };
  }
}


