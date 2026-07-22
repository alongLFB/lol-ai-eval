import { NextRequest, NextResponse } from 'next/server';
import { fetchLeaderboard } from '@/lib/riot';
import { getCachedLeaderboardData, setCachedLeaderboardData } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const server = (searchParams.get('server') || 'EUW').toUpperCase();
  const tier = (searchParams.get('tier') || 'all').toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const force = searchParams.get('force') === 'true';

  try {
    // Check 24h cache first per (server, tier, page)
    const cached = getCachedLeaderboardData(server, tier, page);

    if (cached && !cached.isExpired && !force) {
      return NextResponse.json({
        server,
        tier,
        page,
        entries: cached.data.entries,
        stats: cached.data.stats,
        lastUpdated: cached.data.lastUpdated,
        cached: true,
      });
    }

    // Cache missing or expired -> Fetch fresh data
    const result = await fetchLeaderboard(server, tier, page);
    const lastUpdated = setCachedLeaderboardData(server, tier, page, result.entries, result.stats);

    return NextResponse.json({
      server,
      tier,
      page,
      entries: result.entries,
      stats: result.stats,
      lastUpdated,
      cached: false,
    });
  } catch (error: any) {
    console.error(`Leaderboard fetch error for ${server} - ${tier} - page ${page}:`, error);

    // Fallback to stale cache if fetch fails
    const cached = getCachedLeaderboardData(server, tier, page);
    if (cached) {
      return NextResponse.json({
        server,
        tier,
        page,
        entries: cached.data.entries,
        stats: cached.data.stats,
        lastUpdated: cached.data.lastUpdated,
        cached: true,
        stale: true,
        warning: error.message || 'Failed to update, returning cached data',
      });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}

