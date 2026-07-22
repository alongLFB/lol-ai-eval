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

export interface CachedLeaderboardData {
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


