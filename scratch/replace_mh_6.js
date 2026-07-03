const fs = require('fs');
let content = fs.readFileSync('src/components/MatchHistory.tsx', 'utf8');

content = content.replace(/<span>正在加载更多历史对局\.\.\.<\/span>/g, "<span>{t('loadingMoreMatches')}</span>");
content = content.replace(/<span>展示更多对局 \(\+20场\)<\/span>/g, "<span>{t('loadMoreMatches')}</span>");
content = content.replace(/<div className="text-xs text-gray-500 text-center py-2">无英雄数据<\/div>/g, '<div className="text-xs text-gray-500 text-center py-2">{t("noRecentChampions")}</div>');
content = content.replace(/此分类下近 10 场没有相关的比赛记录/g, "{t('noMatchesFound')}");
content = content.replace(/\{match\.win \? t\('victory'\) : '失败'\}/g, "{match.win ? t('victory') : t('defeat')}");
content = content.replace(/\{summaryStats\.wins\}W<\/span> \/ <span className="text-red-400 font-bold">\{summaryStats\.losses\}败/g, '{summaryStats.wins}{t("win")}</span> / <span className="text-red-400 font-bold">{summaryStats.losses}{t("loss")}');

fs.writeFileSync('src/components/MatchHistory.tsx', content);
