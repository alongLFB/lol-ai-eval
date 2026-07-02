import { OpenAI } from 'openai';
import { SummonerProfileData } from './riot';

const getOpenAIClient = () => {
  return new OpenAI({
    apiKey: process.env.AI_API_KEY || 'mock-key',
    baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  });
};

export async function generateAIEvaluation(profile: SummonerProfileData): Promise<string> {
  const recentWins = profile.recentMatches.filter(m => m.win).length;
  const recentWinRate = (recentWins / profile.recentMatches.length) * 100;
  
  let totalKills = 0, totalDeaths = 0, totalAssists = 0;
  const champCount: Record<string, number> = {};
  
  profile.recentMatches.forEach(m => {
    totalKills += m.kills;
    totalDeaths += m.deaths;
    totalAssists += m.assists;
    champCount[m.championName] = (champCount[m.championName] || 0) + 1;
  });

  const avgKills = (totalKills / profile.recentMatches.length).toFixed(1);
  const avgDeaths = (totalDeaths / profile.recentMatches.length).toFixed(1);
  const avgAssists = (totalAssists / profile.recentMatches.length).toFixed(1);
  const avgKDA = totalDeaths === 0 ? 'Perfect' : ((totalKills + totalAssists) / totalDeaths).toFixed(2);
  
  const mostPlayedChamps = Object.entries(champCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(entry => entry[0])
    .join(', ');

  const prompt = `你是一个精通《英雄联盟》的顶级电竞解说，同时也是一个极其毒舌或极其会夸人的段子手。
请根据以下玩家的战绩数据，用极具网感、幽默感、包含LOL圈内梗的语言，生成一段50-100字的评价大字报。
可以是对其拉跨操作的疯狂嘲讽，或者是对其超神表现的热血赞美。

玩家信息：
- ID: ${profile.gameName}#${profile.tagLine}
- 当前段位: ${profile.tier} ${profile.rank}
- 整体胜率: ${profile.winRate}%

最近10场表现：
- 近期胜率: ${recentWinRate}%
- 平均 K/D/A: ${avgKills} / ${avgDeaths} / ${avgAssists} (场均 KDA: ${avgKDA})
- 近期绝活英雄: ${mostPlayedChamps}

请直接输出你的趣味评价，不要带任何多余的解释。要有情绪，有爆发力！`;

  // Use mock response if no API key is set
  if (!process.env.AI_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (recentWinRate >= 60) {
      return `我的发！${profile.gameName} 这波是真代中代啊！${mostPlayedChamps} 绝活哥出列！场均 ${avgKDA} 的 KDA，这不直接把对面野区当自己家后花园逛？别在 ${profile.tier} 炸鱼了，赶紧去打职业拯救LPL吧！`;
    } else if (recentWinRate <= 40) {
      return `蚌埠住了！${profile.gameName} 选手的 ${mostPlayedChamps} 是在峡谷搞行为艺术吗？近期胜率 ${recentWinRate}%，场均阵亡 ${avgDeaths} 次，你这 KDA 比我奶奶的血压还要不稳定！建议查查键盘是不是被人拔了！`;
    } else {
      return `不吹不黑，${profile.gameName} 这个 ${profile.tier} 守门员当得是兢兢业业。${mostPlayedChamps} 玩得像个混子，但又偏偏能赢。场均 ${avgKDA} 的 KDA 说明你深谙“苟分”之道。继续保持，电竞汪精卫非你莫属！`;
    }
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '你是一个LOL电竞解说段子手。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 300,
    });

    return response.choices[0]?.message?.content || "虚空发生了一点扰动，评价数据丢失了。";
  } catch (error) {
    console.error("AI API Error:", error);
    return "糟糕！皮城的技术出了点问题，AI 解说员暂时罢工了，请稍后再试！";
  }
}
