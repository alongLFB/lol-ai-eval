import { NextResponse } from 'next/server';
import { fetchSummonerData } from '@/lib/riot';
import { generateAIEvaluation } from '@/lib/ai';
import { getCachedData, setCachedData } from '@/lib/cache';

export async function POST(req: Request) {
  try {
    const { gameName, tagLine, server, forceRefresh } = await req.json();

    if (!gameName || !tagLine || !server) {
      return NextResponse.json(
        { error: '请输入完整的 Riot ID (GameName#TagLine) 并选择服务器' },
        { status: 400 }
      );
    }

    // ── Check cache first (unless force-refreshing) ──
    if (!forceRefresh) {
      const cached = getCachedData(server, gameName, tagLine);
      if (cached && !cached.isExpired) {
        return NextResponse.json({
          profile: cached.data.profile,
          evaluation: cached.data.evaluation,
          lastUpdated: cached.data.lastUpdated,
          fromCache: true,
        });
      }
    }

    // ── Fresh fetch from Riot API + AI ──
    const profile = await fetchSummonerData(gameName, tagLine, server);
    const evaluation = await generateAIEvaluation(profile);

    // Write to cache and get timestamp
    const lastUpdated = setCachedData(server, gameName, tagLine, profile, evaluation);

    return NextResponse.json({
      profile,
      evaluation,
      lastUpdated,
      fromCache: false,
    });

  } catch (error: any) {
    console.error('API /api/analyze Error:', error);
    
    const message = error.message || '服务器内部错误，似乎是虚空入侵了！';
    const status = error.message?.includes('limit exceeded') ? 429 : 
                   error.message?.includes('not found') ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
