import { NextRequest, NextResponse } from 'next/server';
import { fetchLeaderboard } from '@/lib/riot';
import { getCachedLeaderboardData, setCachedLeaderboardData } from '@/lib/cache';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const server = (searchParams.get('server') || 'EUW').toUpperCase();
  const tier = (searchParams.get('tier') || 'all').toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const force = searchParams.get('force') === 'true';

  console.log(` GET /api/leaderboard?server=${server}&tier=${tier}&page=${page}${force ? '&force=true' : ''} 200`);

  try {
    // Check 24h cache first per (server, tier, page)
    const cached = getCachedLeaderboardData(server, tier, page);

    if (cached && !cached.isExpired && !force) {
      return NextResponse.json({
        server,
        tier,
        page,
        entries: (cached.data.entries || []).slice(0, 20),
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
      entries: (result.entries || []).slice(0, 20),
      stats: result.stats,
      lastUpdated,
      cached: false,
    });
  } catch (error: any) {
    console.error(`[Leaderboard API Error] ${server} - ${tier} - page ${page}:`, error.message || error);

    // Fallback to stale cache if fetch fails AND cache exists
    const cached = getCachedLeaderboardData(server, tier, page);
    if (cached && cached.data.entries?.length > 0) {
      return NextResponse.json({
        server,
        tier,
        page,
        entries: (cached.data.entries || []).slice(0, 20),
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

