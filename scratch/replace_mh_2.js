const fs = require('fs');
let content = fs.readFileSync('src/components/MatchHistory.tsx', 'utf8');

// Replace specific queue names in switch
content = content.replace(/case '单排\/双排':/g, "case 420:");
content = content.replace(/case '灵活组排':/g, "case 440:");
content = content.replace(/case '极地大乱斗':/g, "case 450:");
content = content.replace(/function getQueueStyle\(queueName: string\) \{/g, "function getQueueStyle(queueId: number) {");
content = content.replace(/switch \(queueName\)/g, "switch (queueId)");
content = content.replace(/getQueueStyle\(m\.queueName\)/g, "getQueueStyle(m.queueId)");
content = content.replace(/getQueueStyle\(match\.queueName\)/g, "getQueueStyle(match.queueId)");

// Fix tier mapping
content = content.replace(
  /function getTierChineseName\(tier: string\): string \{[\s\S]*?return map\[tier\.toUpperCase\(\)\] \|\| '无段位';\n\}/,
  `function getTierChineseName(tier: string, t: any): string {
  return t(\`tiers.\${tier.toUpperCase()}\`) || t('tiers.UNRANKED');
}`
);
content = content.replace(/getTierChineseName\(([^,)]+)\)/g, "getTierChineseName($1, t)");

// Fix multikills
content = content.replace(/case '五杀':/g, "case 'Penta Kill':");
content = content.replace(/case '四杀':/g, "case 'Quadra Kill':");
content = content.replace(/case '三杀':/g, "case 'Triple Kill':");
content = content.replace(/case '双杀':/g, "case 'Double Kill':");
content = content.replace(/\{m\.multikill\}/g, "{m.multikill === '五杀' ? t('multikills.Penta Kill') : m.multikill === '四杀' ? t('multikills.Quadra Kill') : m.multikill === '三杀' ? t('multikills.Triple Kill') : m.multikill === '双杀' ? t('multikills.Double Kill') : m.multikill}");
content = content.replace(/\{match\.multikill\}/g, "{match.multikill === '五杀' ? t('multikills.Penta Kill') : match.multikill === '四杀' ? t('multikills.Quadra Kill') : match.multikill === '三杀' ? t('multikills.Triple Kill') : match.multikill === '双杀' ? t('multikills.Double Kill') : match.multikill}");

// Replace all tabs, headers, labels
content = content.replace(/>段位</g, ">{t('rank')}<");
content = content.replace(/>伤害</g, ">{t('damage')}<");
content = content.replace(/>视野</g, ">{t('vision')}<");
content = content.replace(/>装备</g, ">{t('items')}<");
content = content.replace(/>平均段位</g, ">{t('averageRank')}<");
content = content.replace(/>加载段位信息\.\.\.</g, ">{t('loadingRanks')}<");
content = content.replace(/'胜利'/g, "t('victory')");
content = content.replace(/'败北'/g, "t('defeat')");
content = content.replace(/>单排排位</g, ">{t('rankedSolo')}<");
content = content.replace(/>灵活组排</g, ">{t('rankedFlex')}<");
content = content.replace(/>排位赛段位</g, ">{t('rankedSectionTitle')}<");
content = content.replace(/>最近玩过</g, ">{t('recentlyPlayed')}<");
content = content.replace(/>经常同队 \(合作 2 次及以上\)</g, ">{t('frequentTeammates')}<");
content = content.replace(/>胜率</g, ">{t('winRate')}<");

// 12 个队友 -> {teammateStats.length} {t('teammatesCount')} 
// wait, the code is: {teammateStats.length} 个队友
content = content.replace(/\{teammateStats\.length\} 个队友/g, "{t('teammatesCount', { count: teammateStats.length })}");
content = content.replace(/\{profile\.wins\}胜 \{profile\.losses\}负 \(\{profile\.winRate\}% 胜率\)/g, "{t('winsLosses', { wins: profile.wins, losses: profile.losses, winRate: profile.winRate })}");
content = content.replace(/\{profile\.flexWins\}胜 \{profile\.flexLosses\}负 \(\{Math\.round\(\(profile\.flexWins \/ \(profile\.flexWins \+ profile\.flexLosses\)\) \* 100\)\}% 胜率\)/g, "{t('winsLosses', { wins: profile.flexWins, losses: profile.flexLosses, winRate: Math.round((profile.flexWins / (profile.flexWins + profile.flexLosses)) * 100) })}");
content = content.replace(/\{t\.wins\}胜/g, "{t.wins}W");
content = content.replace(/\{t\.losses\}负/g, "{t.losses}L");
// Replace {t.games} 比赛 -> {t('totalGames', {count: t.games})}
content = content.replace(/\{t\.games\} 比赛/g, "{t('totalGames', { count: t.games })}");
content = content.replace(/展开前10个队友/g, "{t('expandTeammates')}");
content = content.replace(/收起队友列表/g, "{t('collapseTeammates')}");
content = content.replace(/\{summaryStats\.totalGames\}场比赛/g, "{t('matchCountLong', { count: summaryStats.totalGames })}");
content = content.replace(/\{summaryStats\.wins\}胜/g, "{summaryStats.wins}W");
content = content.replace(/\{summaryStats\.losses\}负/g, "{summaryStats.losses}L");
content = content.replace(/>击杀参与率 \{summaryStats\.avgKp\}%</g, ">{t('killParticipation', { rate: summaryStats.avgKp })}<");
content = content.replace(/>最近高频英雄</g, ">{t('recentChampions')}<");
content = content.replace(/\{c\.wins\}胜\{c\.losses\}负/g, "{t('winsLossesShort', { wins: c.wins, losses: c.losses })}");
content = content.replace(/>常用位置</g, ">{t('preferredPositions')}<");
content = content.replace(/TOP: '上', JUNGLE: '打', MIDDLE: '中', BOTTOM: '下', UTILITY: '辅'/g, "TOP: t('positions.TOP'), JUNGLE: t('positions.JUNGLE'), MIDDLE: t('positions.MIDDLE'), BOTTOM: t('positions.BOTTOM'), UTILITY: t('positions.UTILITY')");

// match gameDuration
content = content.replace(/\{Math\.floor\(match\.gameDuration \/ 60\)\}分\{\(match\.gameDuration % 60\)\.toString\(\)\.padStart\(2, '0'\)\}秒/g, "{t('timeFormat', { minutes: Math.floor(match.gameDuration / 60), seconds: (match.gameDuration % 60).toString().padStart(2, '0') })}");

// match win/loss text
content = content.replace(/\{match\.win \? '胜利' : '败北'\}/g, "{match.win ? t('victory') : t('defeat')}");

// csPerMin
content = content.replace(/\{match\.csPerMin\}\/分/g, "{match.csPerMin}/m");
content = content.replace(/\{p\.csPerMin\}\/分/g, "{p.csPerMin}/m");
content = content.replace(/\{summaryStats\.avgCsPerMin\}\/分/g, "{summaryStats.avgCsPerMin}/m");

// queueName mappings
content = content.replace(/\{match\.queueName\}/g, "{match.queueId === 420 ? t('queues.RANKED_SOLO_5x5') : match.queueId === 440 ? t('queues.RANKED_FLEX_SR') : match.queueId === 450 ? t('queues.ARAM') : match.queueName === '斗魂竞技场' ? t('queues.CHERRY') : match.queueId === 400 || match.queueId === 430 ? t('queues.NORMAL') : t('queues.UNKNOWN')}");

// tabs
content = content.replace(/\{ id: 'ALL', label: '全部' \}/g, "{ id: 'ALL', label: t('tabs.ALL') }");
content = content.replace(/\{ id: 'SOLO', label: '单双排位' \}/g, "{ id: 'SOLO', label: t('tabs.SOLO') }");
content = content.replace(/\{ id: 'FLEX', label: '灵活排位' \}/g, "{ id: 'FLEX', label: t('tabs.FLEX') }");
content = content.replace(/\{ id: 'ARAM', label: '极地大乱斗' \}/g, "{ id: 'ARAM', label: t('tabs.ARAM') }");

// ladder rank
content = content.replace(/阶梯排名/g, "Ladder Rank");
content = content.replace(/占前几名/g, "Top %");

// empty states
content = content.replace(/暂无 20 场内共同作战 2 次以上的队友/g, "No frequent teammates in the last 20 matches.");
content = content.replace(/暂无常用英雄数据/g, "No recent champion data.");
content = content.replace(/没有找到最近的战绩数据\.\.\./g, "No recent match data found...");

// "加载更多对局"
content = content.replace(/加载更多对局 \(\+20场\)/g, "Load more matches (+20)");

//等级 t.summonerLevel
content = content.replace(/等级 \{t\.summonerLevel\}/g, "Lv {t.summonerLevel}");

// filter queues
content = content.replace(/m\.queueName === '单排\/双排'/g, "m.queueId === 420");
content = content.replace(/m\.queueName === '灵活组排'/g, "m.queueId === 440");
content = content.replace(/m\.queueName === '极地大乱斗'/g, "m.queueId === 450");

fs.writeFileSync('src/components/MatchHistory.tsx', content);
