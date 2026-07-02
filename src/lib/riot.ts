export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
}

export interface LeagueEntry {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

export interface MatchDto {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameEndTimestamp: number;
    gameId: number;
    gameMode: string;
    gameName: string;
    gameType: string;
    gameVersion: string;
    mapId: number;
    participants: ParticipantDto[];
  };
}

export interface ParticipantDto {
  puuid: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  totalDamageDealtToChampions: number;
  goldEarned: number;
}

export interface CleanedMatchData {
  matchId: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  damage: number;
  gameDuration: number;
}

export interface SummonerProfileData {
  gameName: string;
  tagLine: string;
  summonerLevel: number;
  profileIconId: number;
  tier: string;
  rank: string;
  wins: number;
  losses: number;
  winRate: string;
  recentMatches: CleanedMatchData[];
  latestPatch: string;
}

function getRouting(server: string) {
  // Map selected server to Riot API routing values
  if (server === 'EUW') return { region: 'europe', platform: 'euw1' };
  if (server === 'ME') return { region: 'europe', platform: 'me1' };
  
  // Default fallback
  return { region: 'europe', platform: 'euw1' };
}

const fetchRiot = async (url: string) => {
  const apiKey = process.env.RIOT_API_KEY;
  if (!apiKey) throw new Error("RIOT_API_KEY is not configured");

  const res = await fetch(url, {
    headers: { 'X-Riot-Token': apiKey }
  });

  if (!res.ok) {
    if (res.status === 429) throw new Error("Riot API limit exceeded (429)");
    if (res.status === 404) throw new Error("Player or match not found (404)");
    if (res.status === 403) throw new Error("Riot API Key is invalid or expired (403)");
    throw new Error(`Riot API Error: ${res.status}`);
  }

  return res.json();
};

export async function fetchSummonerData(gameName: string, tagLine: string, server: string): Promise<SummonerProfileData> {
  const { region, platform } = getRouting(server);

  try {
    // 1. Get PUUID
    const accountUrl = `https://${region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
    const account: RiotAccount = await fetchRiot(accountUrl);

    // 2. Get Summoner
    const summonerUrl = `https://${platform}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${account.puuid}`;
    const summoner: RiotSummoner = await fetchRiot(summonerUrl);

    // 3. Get League
    const leagueUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summoner.id}`;
    const leagues: LeagueEntry[] = await fetchRiot(leagueUrl);
    const soloQueue = leagues.find(l => l.queueType === 'RANKED_SOLO_5x5') || leagues[0];

    // 4. Get Match IDs (last 10)
    const matchIdsUrl = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${account.puuid}/ids?start=0&count=10`;
    const matchIds: string[] = await fetchRiot(matchIdsUrl);

    // 5. Get Match Details
    const matchPromises = matchIds.map(async (matchId) => {
      try {
        const matchUrl = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const matchData: MatchDto = await fetchRiot(matchUrl);
        const participant = matchData.info.participants.find(p => p.puuid === account.puuid);
        
        if (!participant) return null;

        return {
          matchId,
          championName: participant.championName,
          kills: participant.kills,
          deaths: participant.deaths,
          assists: participant.assists,
          win: participant.win,
          damage: participant.totalDamageDealtToChampions,
          gameDuration: matchData.info.gameDuration,
        } as CleanedMatchData;
      } catch (e) {
        console.warn(`Failed to fetch match ${matchId}`, e);
        return null;
      }
    });

    const rawMatches = await Promise.all(matchPromises);
    const recentMatches = rawMatches.filter((m): m is CleanedMatchData => m !== null);

    const wins = soloQueue?.wins || 0;
    const losses = soloQueue?.losses || 0;
    const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0.0';

    const versionsRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await versionsRes.json();
    const latestPatch = versions[0] || '16.13.1';

    return {
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerLevel: summoner.summonerLevel,
      profileIconId: summoner.profileIconId,
      tier: soloQueue?.tier || 'UNRANKED',
      rank: soloQueue?.rank || '',
      wins,
      losses,
      winRate,
      recentMatches,
      latestPatch
    };
  } catch (error: any) {
    if (error.message.includes('not configured')) {
       // Mock fallback if key is empty
       throw new Error('API Key is missing');
    }
    throw error;
  }
}
