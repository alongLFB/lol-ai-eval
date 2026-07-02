import { NextResponse } from 'next/server';
import { fetchSummonerData } from '@/lib/riot';
import { generateAIEvaluation } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { gameName, tagLine, server } = await req.json();

    if (!gameName || !tagLine || !server) {
      return NextResponse.json(
        { error: '请输入完整的 Riot ID (GameName#TagLine) 并选择服务器' },
        { status: 400 }
      );
    }

    // 1. Fetch Riot Data
    const profile = await fetchSummonerData(gameName, tagLine, server);

    // 2. Generate AI Evaluation
    const evaluation = await generateAIEvaluation(profile);

    // 3. Return Combined Data
    return NextResponse.json({
      profile,
      evaluation,
    });

  } catch (error: any) {
    console.error('API /api/analyze Error:', error);
    
    // Determine if it's a known error type
    const message = error.message || '服务器内部错误，似乎是虚空入侵了！';
    const status = error.message?.includes('limit exceeded') ? 429 : 
                   error.message?.includes('not found') ? 404 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
