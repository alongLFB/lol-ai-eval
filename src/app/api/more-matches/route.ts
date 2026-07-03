import { NextResponse } from 'next/server';
import { fetchMatchesForPuuid } from '@/lib/riot';

export async function POST(req: Request) {
  try {
    const { puuid, server, start, count } = await req.json();

    if (!puuid || !server || start === undefined || !count) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      );
    }

    // Fetch the next chunk of matches (request a few extra to cushion against failed fetches)
    const bufferCount = count + 5;
    const matches = await fetchMatchesForPuuid(puuid, server, start, bufferCount);
    
    // Slice to exactly the requested count
    const slicedMatches = matches.slice(0, count);

    return NextResponse.json({ matches: slicedMatches });
  } catch (error: any) {
    console.error('API /api/more-matches Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
