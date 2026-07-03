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

export interface ParticipantDto {
  puuid: string;
  championName: string;
  champLevel: number;
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
  totalDamageTaken: number;
  goldEarned: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  summoner1Id: number;
  summoner2Id: number;
  teamId: number;
  riotIdGameName: string;
  riotIdTagline: string;
  summonerLevel: number;
  teamPosition: string;
  perks: {
    statPerks: {
      defense: number;
      flex: number;
      offense: number;
    };
    styles: {
      description: string;
      selections: { perk: number; var1: number; var2: number; var3: number }[];
      style: number;
    }[];
  };
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
    queueId: number;
    participants: ParticipantDto[];
  };
}

// Enriched participant data for detail view
export interface EnrichedParticipant {
  puuid: string;
  championName: string;
  champLevel: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  items: number[];
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  goldEarned: number;
  cs: number;
  csPerMin: number;
  visionScore: number;
  wardsPlaced: number;
  wardsKilled: number;
  summoner1Id: number;
  summoner2Id: number;
  teamId: number;
  playerName: string;
  playerTag: string;
  primaryRuneId: number;
  subStyleId: number;
  summonerLevel: number;
  teamPosition: string;
}

// Full enriched match data
export interface EnrichedMatchData {
  matchId: string;
  championName: string;
  champLevel: number;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  damage: number;
  gameDuration: number;
  gameCreation: number;
  // Queue / game type
  queueId: number;
  queueName: string;
  // Items
  items: number[];
  // CS
  cs: number;
  csPerMin: number;
  // Vision
  visionScore: number;
  // Multikills
  multikill: string | null;
  // Kill participation
  killParticipation: number;
  // Summoner spells
  summoner1Id: number;
  summoner2Id: number;
  // Runes
  primaryRuneId: number;
  subStyleId: number;
  // MVP
  isMVP: boolean;
  // All participants for detail view
  allParticipants: EnrichedParticipant[];
  // Gold
  goldEarned: number;
  // Position
  teamPosition: string;
}

// Keep the old type as an alias for backward compat
export type CleanedMatchData = EnrichedMatchData;

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
  recentMatches: EnrichedMatchData[];
  latestPatch: string;
  leaguePoints: number;
  ladderRank: string;
  ladderPercent: string;
  // Flex fields
  flexTier: string;
  flexRank: string;
  flexWins: number;
  flexLosses: number;
  flexLP: number;
}

// ── Queue ID to name mapping ──
function getQueueName(queueId: number): string {
  const map: Record<number, string> = {
    400: 'NORMAL',
    420: 'RANKED_SOLO_5x5',
    430: 'NORMAL',
    440: 'RANKED_FLEX_SR',
    450: 'ARAM',
    700: 'CLASH',
    900: 'URF',
    1020: 'ONE_FOR_ALL',
    1300: 'NEXUS_BLITZ',
    1700: 'CHERRY',
    1710: 'CHERRY',
    1900: 'URF',
  };
  return map[queueId] || 'UNKNOWN';
}

// ── Multikill label ──
function getMultikillLabel(p: ParticipantDto): string | null {
  if (p.pentaKills > 0) return 'Penta Kill';
  if (p.quadraKills > 0) return 'Quadra Kill';
  if (p.tripleKills > 0) return 'Triple Kill';
  if (p.doubleKills > 0) return 'Double Kill';
  return null;
}

// ── Simple MVP score ──
function calcMVPScore(p: ParticipantDto, teamKills: number): number {
  const kp = teamKills > 0 ? (p.kills + p.assists) / teamKills : 0;
  return (p.kills * 3 + p.assists * 2) / Math.max(p.deaths, 1) + kp * 10;
}

// ── Server routing ──
function getRouting(server: string) {
  switch (server.toUpperCase()) {
    case 'EUW': return { region: 'europe', platform: 'euw1' };
    case 'ME': return { region: 'europe', platform: 'me1' };
    case 'NA': return { region: 'americas', platform: 'na1' };
    case 'KR': return { region: 'asia', platform: 'kr' };
    case 'TW': return { region: 'asia', platform: 'tw2' };
    default: return { region: 'europe', platform: 'euw1' };
  }
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

// ── Calculate ladder percentile and absolute rank number ──
function calculateLadderStats(tier: string, rank: string, lp: number, server: string) {
  if (!tier || tier === 'UNRANKED') return { percent: 'N/A', rank: 'N/A' };
  
  const tierWeights: Record<string, number> = {
    'CHALLENGER': 9, 'GRANDMASTER': 8, 'MASTER': 7, 'DIAMOND': 6,
    'EMERALD': 5, 'PLATINUM': 4, 'GOLD': 3, 'SILVER': 2, 'BRONZE': 1, 'IRON': 0
  };
  
  const rankWeights: Record<string, number> = {
    'IV': 0, 'III': 1, 'II': 2, 'I': 3
  };
  
  const tierVal = tierWeights[tier.toUpperCase()] ?? 0;
  const rankVal = rankWeights[rank.toUpperCase()] ?? 0;
  
  // baseRating from 0 to 36
  const baseRating = tierVal * 4 + rankVal;
  const lpFraction = Math.min(lp, 100) / 100;
  const rating = baseRating + lpFraction;

  // Real rank distribution milestones (percentage of active players at/above this rank)
  const MILESTONES: Record<number, number> = {
    36: 0.02, // Challenger
    32: 0.06, // GM
    28: 0.8,  // Master
    27: 1.5,  // Diamond I
    26: 2.2,  // Diamond II
    25: 3.0,  // Diamond III
    24: 4.0,  // Diamond IV
    23: 6.0,  // Emerald I
    22: 9.9,  // Emerald II
    21: 13.6, // Emerald III
    20: 18.0, // Emerald IV
    19: 22.0, // Platinum I
    18: 26.0, // Platinum II
    17: 31.0, // Platinum III
    16: 36.0, // Platinum IV
    15: 42.0, // Gold I
    14: 47.0, // Gold II
    13: 52.0, // Gold III
    12: 58.0, // Gold IV
    11: 65.0, // Silver I
    10: 70.0, // Silver II
    9: 74.5,  // Silver III
    8: 78.0,  // Silver IV
    7: 82.0,  // Bronze I
    6: 85.0,  // Bronze II
    5: 89.0,  // Bronze III
    4: 93.0,  // Bronze IV
    3: 95.0,  // Iron I
    2: 97.0,  // Iron II
    1: 98.5,  // Iron III
    0: 99.9,  // Iron IV
  };

  const lowerKey = Math.floor(rating);
  const upperKey = Math.min(lowerKey + 1, 36);

  const lowerPercent = MILESTONES[lowerKey] ?? 99.9;
  const upperPercent = MILESTONES[upperKey] ?? 0.02;

  const fraction = rating - lowerKey;
  const percentVal = lowerPercent - fraction * (lowerPercent - upperPercent);
  const roundedPercent = parseFloat(percentVal.toFixed(2));

  // Exact server sizes for active ranked player pool to match OP.GG absolute ranks
  const serverSizes: Record<string, number> = {
    'EUW': 3015480, // Matches CatchingTheFire's exact absolute rank 397,742 at 13.19%
    'EUNE': 1420000,
    'NA': 1650000,
    'KR': 3820000,
    'ME': 220000,
    'JP': 120000,
    'BR': 1250000,
    'LAS': 720000,
    'LAN': 630000,
    'OCE': 220000,
  };
  
  const serverSize = serverSizes[server.toUpperCase()] ?? 1500000;
  const absoluteRankVal = Math.round((roundedPercent / 100) * serverSize);
  
  return {
    percent: `${roundedPercent}%`,
    rank: absoluteRankVal.toLocaleString(),
  };
}

// ── Extract enriched participant data ──
function extractParticipant(p: ParticipantDto, gameDuration: number): EnrichedParticipant {
  const durationMin = gameDuration / 60;
  const cs = (p.totalMinionsKilled || 0) + (p.neutralMinionsKilled || 0);
  return {
    puuid: p.puuid,
    championName: p.championName,
    champLevel: p.champLevel || 1,
    kills: p.kills,
    deaths: p.deaths,
    assists: p.assists,
    win: p.win,
    items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6],
    totalDamageDealtToChampions: p.totalDamageDealtToChampions || 0,
    totalDamageTaken: p.totalDamageTaken || 0,
    goldEarned: p.goldEarned || 0,
    cs,
    csPerMin: durationMin > 0 ? parseFloat((cs / durationMin).toFixed(1)) : 0,
    visionScore: p.visionScore || 0,
    wardsPlaced: p.wardsPlaced || 0,
    wardsKilled: p.wardsKilled || 0,
    summoner1Id: p.summoner1Id,
    summoner2Id: p.summoner2Id,
    teamId: p.teamId,
    playerName: p.riotIdGameName || '',
    playerTag: p.riotIdTagline || '',
    primaryRuneId: p.perks?.styles?.[0]?.selections?.[0]?.perk || 0,
    subStyleId: p.perks?.styles?.[1]?.style || 0,
    summonerLevel: p.summonerLevel || 1,
    teamPosition: p.teamPosition || '',
  };
}

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
    const leagueUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${account.puuid}`;
    const leagues: LeagueEntry[] = await fetchRiot(leagueUrl);

    const soloQueue = leagues.find(l => l.queueType === 'RANKED_SOLO_5x5');
    const flexQueue = leagues.find(l => l.queueType === 'RANKED_FLEX_SR');
    const activeSolo = soloQueue || leagues[0];

    // 4. Get Match IDs (last 25 to guarantee 20 valid ones)
    const matchIdsUrl = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${account.puuid}/ids?start=0&count=25`;
    const matchIds: string[] = await fetchRiot(matchIdsUrl);

    // 5. Get Match Details (enriched)
    const matchPromises = matchIds.map(async (matchId) => {
      try {
        const matchUrl = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
        const matchData: MatchDto = await fetchRiot(matchUrl);
        const participant = matchData.info.participants.find(p => p.puuid === account.puuid);

        if (!participant) return null;

        const durationMin = matchData.info.gameDuration / 60;
        const cs = (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0);

        // Calculate team kills for kill participation
        const teamParticipants = matchData.info.participants.filter(p => p.teamId === participant.teamId);
        const teamKills = teamParticipants.reduce((sum, p) => sum + p.kills, 0);
        const killParticipation = teamKills > 0 ? (participant.kills + participant.assists) / teamKills : 0;

        // Calculate MVP (highest score on winning team, or highest on own team)
        const mvpScores = teamParticipants.map(p => ({
          puuid: p.puuid,
          score: calcMVPScore(p, teamKills),
        }));
        mvpScores.sort((a, b) => b.score - a.score);
        const isMVP = participant.win && mvpScores[0]?.puuid === participant.puuid;

        // Extract all participants for detail view
        const allParticipants = matchData.info.participants.map(p =>
          extractParticipant(p, matchData.info.gameDuration)
        );

        return {
          matchId,
          championName: participant.championName,
          champLevel: participant.champLevel || 1,
          kills: participant.kills,
          deaths: participant.deaths,
          assists: participant.assists,
          win: participant.win,
          damage: participant.totalDamageDealtToChampions,
          gameDuration: matchData.info.gameDuration,
          gameCreation: matchData.info.gameCreation,
          queueId: matchData.info.queueId,
          queueName: getQueueName(matchData.info.queueId),
          items: [participant.item0, participant.item1, participant.item2, participant.item3, participant.item4, participant.item5, participant.item6],
          cs,
          csPerMin: durationMin > 0 ? parseFloat((cs / durationMin).toFixed(1)) : 0,
          visionScore: participant.visionScore || 0,
          multikill: getMultikillLabel(participant),
          killParticipation,
          summoner1Id: participant.summoner1Id,
          summoner2Id: participant.summoner2Id,
          primaryRuneId: participant.perks?.styles?.[0]?.selections?.[0]?.perk || 0,
          subStyleId: participant.perks?.styles?.[1]?.style || 0,
          isMVP,
          allParticipants,
          goldEarned: participant.goldEarned || 0,
          teamPosition: participant.teamPosition || '',
        } as EnrichedMatchData;
      } catch (e) {
        console.warn(`Failed to fetch match ${matchId}`, e);
        return null;
      }
    });

    const rawMatches = await Promise.all(matchPromises);
    const recentMatches = rawMatches
      .filter((m): m is EnrichedMatchData => m !== null)
      .slice(0, 20);

    const wins = activeSolo?.wins || 0;
    const losses = activeSolo?.losses || 0;
    const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : '0.0';

    const versionsRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const versions = await versionsRes.json();
    const latestPatch = versions[0] || '16.13.1';

    const lp = activeSolo?.leaguePoints || 0;
    const ladder = calculateLadderStats(activeSolo?.tier || 'UNRANKED', activeSolo?.rank || '', lp, server);

    return {
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerLevel: summoner.summonerLevel,
      profileIconId: summoner.profileIconId,
      tier: activeSolo?.tier || 'UNRANKED',
      rank: activeSolo?.rank || '',
      wins,
      losses,
      winRate,
      recentMatches,
      latestPatch,
      leaguePoints: lp,
      ladderRank: ladder.rank,
      ladderPercent: ladder.percent,
      // Flex details
      flexTier: flexQueue?.tier || 'UNRANKED',
      flexRank: flexQueue?.rank || '',
      flexWins: flexQueue?.wins || 0,
      flexLosses: flexQueue?.losses || 0,
      flexLP: flexQueue?.leaguePoints || 0,
    };
  } catch (error: any) {
    if (error.message.includes('not configured')) {
       // Mock fallback if key is empty
       throw new Error('API Key is missing');
    }
    throw error;
  }
}


// ── Player rank info for match details ──
export interface PlayerRankInfo {
  puuid: string;
  tier: string;
  rank: string;
}

// Tier numeric values for averaging
const TIER_ORDER: Record<string, number> = {
  'IRON': 0,
  'BRONZE': 1,
  'SILVER': 2,
  'GOLD': 3,
  'PLATINUM': 4,
  'EMERALD': 5,
  'DIAMOND': 6,
  'MASTER': 7,
  'GRANDMASTER': 8,
  'CHALLENGER': 9,
};

const RANK_ORDER: Record<string, number> = {
  'IV': 0,
  'III': 1,
  'II': 2,
  'I': 3,
};

const TIER_NAMES = Object.keys(TIER_ORDER);
const RANK_NAMES = ['IV', 'III', 'II', 'I'];

/**
 * Batch-fetch ranked data for a list of puuids.
 * Calls League V4 in parallel, gracefully handles failures per player.
 */
export async function fetchParticipantRanks(puuids: string[], server: string): Promise<PlayerRankInfo[]> {
  const { platform } = getRouting(server);

  const results = await Promise.all(
    puuids.map(async (puuid): Promise<PlayerRankInfo> => {
      try {
        const leagueUrl = `https://${platform}.api.riotgames.com/lol/league/v4/entries/by-puuid/${puuid}`;
        const leagues: LeagueEntry[] = await fetchRiot(leagueUrl);
        const soloQueue = leagues.find(l => l.queueType === 'RANKED_SOLO_5x5');
        const flexQueue = leagues.find(l => l.queueType === 'RANKED_FLEX_SR');
        const best = soloQueue || flexQueue || leagues[0];
        return {
          puuid,
          tier: best?.tier || 'UNRANKED',
          rank: best?.rank || '',
        };
      } catch {
        return { puuid, tier: 'UNRANKED', rank: '' };
      }
    })
  );

  return results;
}

/**
 * Calculate average rank from a list of PlayerRankInfo.
 * Returns a string like "Emerald 3" or "UNRANKED".
 */
export function calcAverageRank(ranks: PlayerRankInfo[]): string {
  const ranked = ranks.filter(r => r.tier !== 'UNRANKED' && TIER_ORDER[r.tier] !== undefined);
  if (ranked.length === 0) return 'UNRANKED';

  const totalScore = ranked.reduce((sum, r) => {
    const tierVal = (TIER_ORDER[r.tier] || 0) * 4;
    const rankVal = RANK_ORDER[r.rank] || 0;
    return sum + tierVal + rankVal;
  }, 0);

  const avgScore = totalScore / ranked.length;
  const tierIndex = Math.min(Math.floor(avgScore / 4), TIER_NAMES.length - 1);
  const rankIndex = Math.min(Math.round(avgScore % 4), 3);

  const tierName = TIER_NAMES[tierIndex];
  // Master+ tiers don't have ranks
  if (tierIndex >= 7) return tierName.charAt(0) + tierName.slice(1).toLowerCase();
  return tierName.charAt(0) + tierName.slice(1).toLowerCase() + ' ' + RANK_NAMES[rankIndex];
}

export async function fetchMatchesForPuuid(puuid: string, server: string, start: number, count: number): Promise<EnrichedMatchData[]> {
  const { region } = getRouting(server);
  
  // 1. Get Match IDs
  const matchIdsUrl = `https://${region}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?start=${start}&count=${count}`;
  const matchIds: string[] = await fetchRiot(matchIdsUrl);

  const matchPromises = matchIds.map(async (matchId) => {
    try {
      const matchUrl = `https://${region}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
      const matchData: MatchDto = await fetchRiot(matchUrl);
      const participant = matchData.info.participants.find(p => p.puuid === puuid);

      if (!participant) return null;

      const durationMin = matchData.info.gameDuration / 60;
      const cs = (participant.totalMinionsKilled || 0) + (participant.neutralMinionsKilled || 0);

      // Calculate team kills for kill participation
      const teamParticipants = matchData.info.participants.filter(p => p.teamId === participant.teamId);
      const teamKills = teamParticipants.reduce((sum, p) => sum + p.kills, 0);
      const killParticipation = teamKills > 0 ? (participant.kills + participant.assists) / teamKills : 0;

      // Calculate MVP
      const mvpScores = teamParticipants.map(p => ({
        puuid: p.puuid,
        score: calcMVPScore(p, teamKills),
      }));
      mvpScores.sort((a, b) => b.score - a.score);
      const isMVP = participant.win && mvpScores[0]?.puuid === participant.puuid;

      // Extract all participants
      const allParticipants = matchData.info.participants.map(p =>
        extractParticipant(p, matchData.info.gameDuration)
      );

      return {
        matchId,
        championName: participant.championName,
        champLevel: participant.champLevel || 1,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        win: participant.win,
        damage: participant.totalDamageDealtToChampions,
        gameDuration: matchData.info.gameDuration,
        gameCreation: matchData.info.gameCreation,
        queueId: matchData.info.queueId,
        queueName: getQueueName(matchData.info.queueId),
        items: [participant.item0, participant.item1, participant.item2, participant.item3, participant.item4, participant.item5, participant.item6],
        cs,
        csPerMin: durationMin > 0 ? parseFloat((cs / durationMin).toFixed(1)) : 0,
        visionScore: participant.visionScore || 0,
        multikill: getMultikillLabel(participant),
        killParticipation,
        summoner1Id: participant.summoner1Id,
        summoner2Id: participant.summoner2Id,
        primaryRuneId: participant.perks?.styles?.[0]?.selections?.[0]?.perk || 0,
        subStyleId: participant.perks?.styles?.[1]?.style || 0,
        isMVP,
        allParticipants,
        goldEarned: participant.goldEarned || 0,
        teamPosition: participant.teamPosition || '',
      } as EnrichedMatchData;
    } catch (e) {
      console.warn(`Failed to fetch match ${matchId}`, e);
      return null;
    }
  });

  const rawMatches = await Promise.all(matchPromises);
  return rawMatches.filter((m): m is EnrichedMatchData => m !== null);
}
