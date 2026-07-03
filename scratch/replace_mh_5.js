const fs = require('fs');
let content = fs.readFileSync('src/components/MatchHistory.tsx', 'utf8');

// replace Team names
content = content.replace(/renderTeamTable\(blueTeam, '蓝队', blueWon\)/g, "renderTeamTable(blueTeam, t('blueTeam'), blueWon)");
content = content.replace(/renderTeamTable\(redTeam, '红队', !blueWon\)/g, "renderTeamTable(redTeam, t('redTeam'), !blueWon)");

// wins/losses for profile overview
content = content.replace(/\{profile\.wins\}胜 \{profile\.losses\}负/g, "{t('winsLossesShortNoSpace', { wins: profile.wins, losses: profile.losses })}");
content = content.replace(/胜率 \{profile\.winRate\}%/g, "{t('winRate')} {profile.winRate}%");
content = content.replace(/阶梯排名/g, "{t('ladderRank')}");
content = content.replace(/\(\{profile\.ladderPercent\} Top %\)/g, "({profile.ladderPercent}% {t('topPercent')})");

// rank card titles
content = content.replace(/<div className="text-\[10px\] text-gray-500 font-bold">单双排位<\/div>/g, '<div className="text-[10px] text-gray-500 font-bold">{t("rankedSolo")}</div>');
content = content.replace(/<div className="text-\[10px\] text-gray-500 mt-0\.5">暂无单双排位战绩<\/div>/g, '<div className="text-[10px] text-gray-500 mt-0.5">{t("noRankedSolo")}</div>');
content = content.replace(/<div className="text-\[10px\] text-gray-500 mt-0\.5">暂无灵活排位战绩<\/div>/g, '<div className="text-[10px] text-gray-500 mt-0.5">{t("noRankedFlex")}</div>');

// frequent teammates
content = content.replace(/经常同队 \(合作 2 次及以上\)/g, "{t('frequentTeammates')}");
content = content.replace(/等级 \{tm\.summonerLevel\}/g, "{t('level')} {tm.summonerLevel}");
content = content.replace(/\{tm\.losses\}败/g, "{tm.losses}{t('loss')}");
content = content.replace(/最近 20 场对局中没有同队合作过 2 次及以上的队友/g, "{t('noFrequentTeammates')}");

// summary stats
content = content.replace(/\{summaryStats\.wins\}W <\/span> \/ <span className="text-red-400 font-bold">\{summaryStats\.losses\}败/g, '{summaryStats.wins}{t("win")} </span> / <span className="text-red-400 font-bold">{summaryStats.losses}{t("loss")}');
content = content.replace(/击杀参与率 \{summaryStats\.avgKp\}%/g, "{t('killParticipation', { rate: summaryStats.avgKp })}");

// champion stats
content = content.replace(/\(\{c\.wins\}胜\{c\.losses\}败\)/g, "({t('winsLossesShortNoSpace', { wins: c.wins, losses: c.losses })})");
content = content.replace(/<div className="text-xs text-gray-500 text-center py-2">暂无常用英雄数据<\/div>/g, '<div className="text-xs text-gray-500 text-center py-2">{t("noRecentChampions")}</div>');
content = content.replace(/\{count\}场 \(\{Math\.round\(percent\)\}%\)/g, "{t('matchCount', { count })} ({Math.round(percent)}%)");
content = content.replace(/展开前 10 个队友及胜率统计/g, "{t('expandTeammates')}"); // Wait this wasn't found, skip if doesn't exist

// queue names / cherry
content = content.replace(/match\.queueName === '斗魂竞技场'/g, "match.queueId === 1700 || match.queueId === 1710");
content = content.replace(/match\.win \? t\('victory'\) : '败北'/g, "match.win ? t('victory') : t('defeat')");

content = content.replace(/match\.multikill === '五杀'/g, "match.multikill === 'Penta Kill'");
content = content.replace(/match\.multikill === '四杀'/g, "match.multikill === 'Quadra Kill'");
content = content.replace(/match\.multikill === '三杀'/g, "match.multikill === 'Triple Kill'");
content = content.replace(/match\.multikill === '双杀'/g, "match.multikill === 'Double Kill'");

content = content.replace(/<span>没有找到最近的战绩数据\.\.\.<\/span>/g, "<span>{t('noMatchesFound')}</span>");
content = content.replace(/<span>加载更多对局 \(\+20场\)<\/span>/g, "<span>{t('loadMoreMatches')}</span>");

fs.writeFileSync('src/components/MatchHistory.tsx', content);
