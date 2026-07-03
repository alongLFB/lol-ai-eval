import { NextRequest, NextResponse } from 'next/server';
import { generateSingleMatchEvaluation } from '@/lib/ai';

export async function POST(req: NextRequest) {
  try {
    const { matchData, locale } = await req.json();

    if (!matchData) {
      return NextResponse.json(
        { error: locale === 'en' ? 'Missing match data' : '缺少对局数据' },
        { status: 400 }
      );
    }

    const aiEvaluation = await generateSingleMatchEvaluation(matchData, locale || 'zh');

    return NextResponse.json({ evaluation: aiEvaluation });
  } catch (error: any) {
    console.error("Match analyze error:", error);
    const isEn = req.nextUrl.searchParams.get('locale') === 'en';
    const message = error.message || (isEn ? 'Internal server error' : '内部服务器错误');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
