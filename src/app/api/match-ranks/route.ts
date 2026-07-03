import { NextResponse } from 'next/server';
import { fetchParticipantRanks, calcAverageRank } from '@/lib/riot';

export async function POST(req: Request) {
  try {
    const { puuids, server } = await req.json();

    if (!puuids || !Array.isArray(puuids) || puuids.length === 0 || !server) {
      return NextResponse.json(
        { error: 'Missing parameters / 缺少参数: puuids (array) and server' },
        { status: 400 }
      );
    }

    // Limit to 10 puuids max to prevent abuse
    const limitedPuuids = puuids.slice(0, 10);

    const ranks = await fetchParticipantRanks(limitedPuuids, server);
    const averageRank = calcAverageRank(ranks);

    return NextResponse.json({ ranks, averageRank });
  } catch (error: any) {
    console.error('API /api/match-ranks Error:', error);
    const message = error.message || 'Failed to fetch rank data / 获取段位数据失败';
    const status = error.message?.includes('limit exceeded') ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
