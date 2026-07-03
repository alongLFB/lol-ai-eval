import { NextResponse } from 'next/server';

const fetchRiot = async (url: string) => {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) throw new Error("RIOT_API_KEY is not configured");

  const res = await fetch(url, {
    headers: { 'X-Riot-Token': apiKey }
  });

  if (!res.ok) {
    throw new Error(`Riot API Error: ${res.status}`);
  }

  return res.json();
};

function getRouting(server: string) {
  if (server === 'EUW') return { platform: 'euw1' };
  if (server === 'ME') return { platform: 'me1' };
  return { platform: 'euw1' };
}

/**
 * Batch-fetch profileIconId for a list of puuids via Summoner-V4.
 * POST body: { puuids: string[], server: string }
 * Response: { icons: { puuid: string, profileIconId: number }[] }
 */
export async function POST(req: Request) {
  try {
    const { puuids, server } = await req.json();

    if (!puuids || !Array.isArray(puuids) || !server) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { platform } = getRouting(server);

    const results = await Promise.all(
      puuids.map(async (puuid: string) => {
        try {
          const url = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`;
          const summoner = await fetchRiot(url);
          return {
            puuid,
            profileIconId: summoner.profileIconId || 1,
          };
        } catch {
          return { puuid, profileIconId: 1 };
        }
      })
    );

    return NextResponse.json({ icons: results });
  } catch (error: any) {
    console.error('API /api/summoner-icons Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
