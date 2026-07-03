import { OpenAI } from 'openai';
import { SummonerProfileData } from './riot';

const getOpenAIClient = () => {
  return new OpenAI({
    apiKey: process.env.AI_API_KEY || 'mock-key',
    baseURL: process.env.AI_BASE_URL || 'https://api.openai.com/v1',
  });
};

export async function generateAIEvaluation(profile: SummonerProfileData, locale: string = 'zh'): Promise<string> {
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

  const promptZh = `你是一个精通《英雄联盟》的顶级电竞解说，同时也是一个极其毒舌或极其会夸人的段子手。
请根据以下玩家的战绩数据，用极具网感、幽默感、包含LOL圈内梗的语言，生成一段50-100字的评价大字报。
可以是对其拉跨操作的疯狂嘲讽，或者是对其超神表现的热血赞美。

玩家信息：
- ID: [PLAYER_NAME]
- 当前段位: ${profile.tier} ${profile.rank}
- 整体胜率: ${profile.winRate}%

最近10场表现：
- 近期胜率: ${recentWinRate}%
- 平均 K/D/A: ${avgKills} / ${avgDeaths} / ${avgAssists} (场均 KDA: ${avgKDA})
- 近期绝活英雄: ${mostPlayedChamps}

请直接输出你的趣味评价，不要带任何多余的解释。要有情绪，有爆发力！请务必在评价中用 [PLAYER_NAME] 来称呼该玩家，不要自己乱编名字！`;

  const promptEn = `You are a top-tier League of Legends esports caster, known for being brutally honest, incredibly sarcastic, or extremely hype.
Based on the following player's match history, write a 50-100 word evaluation poster in English, packed with internet slang, humor, and LoL community memes.
It could be a ruthless roast of their terrible plays or a hype-filled praise of their godlike performance.

Player Info:
- ID: [PLAYER_NAME]
- Current Rank: ${profile.tier} ${profile.rank}
- Overall Win Rate: ${profile.winRate}%

Last 10 Matches:
- Recent Win Rate: ${recentWinRate}%
- Average K/D/A: ${avgKills} / ${avgDeaths} / ${avgAssists} (Avg KDA: ${avgKDA})
- Most Played Champions: ${mostPlayedChamps}

Please output ONLY your entertaining evaluation without any extra explanation. Be emotional and explosive! You MUST refer to the player as [PLAYER_NAME], do not make up a name!`;

  const prompt = locale === 'en' ? promptEn : promptZh;

  // Use mock response if no API key is set
  if (!process.env.AI_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (locale === 'en') {
      if (recentWinRate >= 60) {
        return `Holy smokes! ${profile.gameName} is literally 1v9ing out here! The ${mostPlayedChamps} one-trick has arrived! With a ${avgKDA} KDA, you're treating the enemy jungle like your own backyard! Stop smurfing in ${profile.tier} and go save NA/EU immediately!`;
      } else if (recentWinRate <= 40) {
        return `I can't even! Is ${profile.gameName}'s ${mostPlayedChamps} doing some sort of modern art in the Rift? ${recentWinRate}% recent win rate, dying ${avgDeaths} times a game on average... Your KDA is more unstable than my grandma's blood pressure! Check your keyboard, it might be unplugged!`;
      } else {
        return `Not gonna lie, ${profile.gameName} is doing an honest day's work gatekeeping ${profile.tier}. Your ${mostPlayedChamps} plays like a total passenger but somehow still wins. A ${avgKDA} KDA shows you've mastered the art of getting carried. Keep it up, you're the ultimate KDA player!`;
      }
    } else {
      if (recentWinRate >= 60) {
        return `我的发！${profile.gameName} 这波是真代中代啊！${mostPlayedChamps} 绝活哥出列！场均 ${avgKDA} 的 KDA，这不直接把对面野区当自己家后花园逛？别在 ${profile.tier} 炸鱼了，赶紧去打职业拯救LPL吧！`;
      } else if (recentWinRate <= 40) {
        return `蚌埠住了！${profile.gameName} 选手的 ${mostPlayedChamps} 是在峡谷搞行为艺术吗？近期胜率 ${recentWinRate}%，场均阵亡 ${avgDeaths} 次，你这 KDA 比我奶奶的血压还要不稳定！建议查查键盘是不是被人拔了！`;
      } else {
        return `不吹不黑，${profile.gameName} 这个 ${profile.tier} 守门员当得是兢兢业业。${mostPlayedChamps} 玩得像个混子，但又偏偏能赢。场均 ${avgKDA} 的 KDA 说明你深谙“苟分”之道。继续保持，电竞汪精卫非你莫属！`;
      }
    }
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: locale === 'en' ? 'You are a LoL esports caster and roaster.' : '你是一个LOL电竞解说段子手。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_completion_tokens: 300,
    });

    const fallbackContent = locale === 'en' ? "A void disturbance occurred, evaluation data lost." : "虚空发生了一点扰动，评价数据丢失了。";
    const content = response.choices[0]?.message?.content || fallbackContent;
    return content.replace(/\[PLAYER_NAME\]/g, `${profile.gameName}#${profile.tagLine}`);
  } catch (error) {
    console.error("AI API Error:", error);
    return locale === 'en' ? "Oops! Piltover's tech had a glitch, the AI caster is on strike right now!" : "糟糕！皮城的技术出了点问题，AI 解说员暂时罢工了，请稍后再试！";
  }
}

export async function generateSingleMatchEvaluation(match: any, locale: string = 'zh'): Promise<string> {
  const kda = match.deaths === 0 ? 'Perfect' : ((match.kills + match.assists) / match.deaths).toFixed(2);
  const resultText = match.win ? (locale === 'en' ? 'Victory' : '胜利') : (locale === 'en' ? 'Defeat' : '失败');

  const promptZh = `你是一个极其毒舌又极具洞察力的《英雄联盟》顶级赛事教练。
请根据以下这场单局游戏的数据，进行一段单局赛后复盘。
请务必严格按照以下格式和要求输出，不要省略或增加模块，每一条都必须包含具体的分析，最好带有一些幽默或锐评：

🎯 做得好的地方
1. [亮点1]
2. [亮点2]
3. [亮点3]

⚠️ 做得不好的地方
1. [拉跨/失误点1]
2. [拉跨/失误点2]
3. [拉跨/失误点3]

✅ 需要改进的内容 (最有效的3条)
1. [改进建议1]
2. [改进建议2]
3. [改进建议3]

玩家本局数据：
- 英雄：${match.championName}
- 结果：${resultText}
- K/D/A：${match.kills} / ${match.deaths} / ${match.assists} (KDA: ${kda})
- 补刀：${match.cs}
- 多杀：${match.multikill || '无'}
- MVP/SVP: ${match.isMVP ? '是' : '否'}
`;

  const promptEn = `You are an extremely sarcastic yet insightful top-tier League of Legends coach.
Based on the data of this single match, provide a post-match review.
You MUST strictly follow this format and include exactly 3 points per section. Keep it humorous and roasting where appropriate:

🎯 Highlights
1. [Highlight 1]
2. [Highlight 2]
3. [Highlight 3]

⚠️ Weaknesses
1. [Mistake 1]
2. [Mistake 2]
3. [Mistake 3]

✅ Actionable Advice (Top 3)
1. [Advice 1]
2. [Advice 2]
3. [Advice 3]

Match Data:
- Champion: ${match.championName}
- Result: ${resultText}
- K/D/A: ${match.kills} / ${match.deaths} / ${match.assists} (KDA: ${kda})
- Creep Score: ${match.cs}
- Multikill: ${match.multikill || 'None'}
- MVP/SVP: ${match.isMVP ? 'Yes' : 'No'}
`;

  const prompt = locale === 'en' ? promptEn : promptZh;

  // Use mock response if no API key is set
  if (!process.env.AI_API_KEY) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    if (locale === 'en') {
      return `🎯 Highlights
1. You managed to actually pick a champion and load into the game.
2. Your ${match.championName} is somewhat recognizable on the minimap.
3. You didn't AFK, which is a low bar but you cleared it.

⚠️ Weaknesses
1. With a ${kda} KDA, I assume your monitor was turned off.
2. ${match.isMVP ? 'You got MVP, but only because your team was even worse.' : 'You were basically a walking gold mine for the enemy.'}
3. Your CS of ${match.cs} makes me think you were playing a pacifist run.

✅ Actionable Advice (Top 3)
1. Next time, try hitting your skillshots.
2. Remember that the minimap exists in the bottom right corner.
3. Consider playing Yuumi if you want to play with one hand.`;
    } else {
      return `🎯 做得好的地方
1. 你成功选到了 ${match.championName} 并且连上了游戏。
2. 你的头像在小地图上偶尔还是能被队友观察到的。
3. 居然没有挂机，这在你的水平里已经算是奇迹了。

⚠️ 做得不好的地方
1. 就凭你这 ${kda} 的 KDA，我怀疑你是一边吃泡面一边用脚操作的。
2. ${match.isMVP ? '虽然混了个MVP，但也就是矮子里拔高个。' : '连个MVP都没混到，纯纯的峡谷提款机。'}
3. 你这 ${match.cs} 的补刀，不知道的还以为你是个辅助呢。

✅ 需要改进的内容 (最有效的3条)
1. 下次出门记得带眼，或者干脆把键盘捐给有需要的人。
2. 建议去训练营多练练补刀，把显示器打开再玩。
3. 如果实在不行，建议转型玩悠米，起码能少送点。`;
    }
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: locale === 'en' ? 'You are a LoL coach and roaster.' : '你是一个LOL硬核教练兼段子手。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_completion_tokens: 800,
    });

    const fallbackContent = locale === 'en' ? "Failed to analyze match." : "无法生成本局复盘。";
    return response.choices[0]?.message?.content || fallbackContent;
  } catch (error) {
    console.error("AI Match Analysis Error:", error);
    return locale === 'en' ? "Oops! The AI coach is tilted right now!" : "教练心态崩了，拒绝复盘此局！";
  }
}
