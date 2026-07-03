const fs = require('fs');

let content = fs.readFileSync('src/components/MatchHistory.tsx', 'utf8');

if (!content.includes("import { useTranslations } from 'next-intl';")) {
  content = content.replace(
    "import { motion, AnimatePresence } from 'framer-motion';",
    "import { motion, AnimatePresence } from 'framer-motion';\nimport { useTranslations } from 'next-intl';"
  );
}

content = content.replace(
  /function MatchDetailPanel\([^\{]+\{\n  match, patch, currentPuuid, rankData\n\}: \{\n[^\}]+\}\) \{/g,
  (match) => match + "\n  const t = useTranslations('MatchHistory');"
);

content = content.replace(
  /export function MatchHistory\(\{ profile, server \}: \{ profile: SummonerProfileData; server: string \}\) \{/g,
  "export function MatchHistory({ profile, server }: { profile: SummonerProfileData; server: string }) {\n  const t = useTranslations('MatchHistory');"
);

content = content.replace(
  /function getRelativeTime\(timestamp: number\): string \{[\s\S]*?return `\$\{days\}天前`;\n\}/,
  `function getRelativeTime(timestamp: number, t: any): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return t('minutesAgo', { minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('hoursAgo', { hours });
  const days = Math.floor(hours / 24);
  return t('daysAgo', { days });
}`
);

content = content.replace(/getRelativeTime\(m\.gameCreation\)/g, "getRelativeTime(m.gameCreation, t)");

content = content.replace(
  /function getTierChineseName\(tier: string\): string \{[\s\S]*?return map\[tier\.toUpperCase\(\)\] \|\| '无段位';\n\}/,
  `function getTierChineseName(tier: string, t: any): string {
  return t(\`tiers.\${tier.toUpperCase()}\`) || t('tiers.UNRANKED');
}`
);

content = content.replace(/getTierChineseName\(([^,)]+)\)/g, "getTierChineseName($1, t)");

content = content.replace(/'胜利'/g, "t('victory')");
content = content.replace(/'败北'/g, "t('defeat')");
content = content.replace(/<span>\{won \? t\('victory'\) : t\('defeat'\)\} \(\{teamLabel\}\)<\/span>/g, "<span>{won ? t('victory') : t('defeat')} ({teamLabel})</span>");

content = content.replace(/>段位</g, ">{t('rank')}<");
content = content.replace(/>伤害</g, ">{t('damage')}<");
content = content.replace(/>视野</g, ">{t('vision')}<");
content = content.replace(/>装备</g, ">{t('items')}<");
content = content.replace(/>平均段位</g, ">{t('averageRank', { defaultValue: '平均段位' })}<");
content = content.replace(/>加载段位信息\.\.\.</g, ">{t('loadingRanks', { defaultValue: '加载段位信息...' })}<");

content = content.replace(/>最近玩过</g, ">{t('recentlyPlayed')}<");
content = content.replace(/>经常同队</g, ">{t('frequentTeammates')}<");
content = content.replace(/>胜率</g, ">{t('winRate')}<");
content = content.replace(/>\s*场\s*</g, ">{t('matches')}<");
content = content.replace(/\{profile\.recentMatches\.length\}场/g, "{profile.recentMatches.length} {t('matches')}");

content = content.replace(/近期战绩 \(最近\{profile\.recentMatches\.length\}场\)/g, "{t('overview', { count: profile.recentMatches.length })}");

content = content.replace(/\{m\.multikill\}/g, "{m.multikill === '五杀' ? t('multikills.Penta Kill') : m.multikill === '四杀' ? t('multikills.Quadra Kill') : m.multikill === '三杀' ? t('multikills.Triple Kill') : m.multikill === '双杀' ? t('multikills.Double Kill') : m.multikill}");

content = content.replace(/\{m\.queueName\}/g, "{m.queueId === 420 ? t('queues.RANKED_SOLO_5x5') : m.queueId === 440 ? t('queues.RANKED_FLEX_SR') : m.queueId === 450 ? t('queues.ARAM') : m.queueName === '斗魂竞技场' ? t('queues.CHERRY') : m.queueId === 400 || m.queueId === 430 ? t('queues.NORMAL') : t('queues.UNKNOWN')}");

content = content.replace(/function getQueueStyle\(queueName: string\) \{/g, "function getQueueStyle(queueId: number, queueName: string) {");
content = content.replace(/getQueueStyle\(m\.queueName\)/g, "getQueueStyle(m.queueId, m.queueName)");
content = content.replace(/switch \(queueName\) \{/g, "switch (queueId) {");
content = content.replace(/case '单排\/双排':/g, "case 420:");
content = content.replace(/case '灵活组排':/g, "case 440:");
content = content.replace(/case '极地大乱斗':/g, "case 450:");

content = content.replace(/>MVP</g, ">{t('mvp', { defaultValue: 'MVP' })}<");

fs.writeFileSync('src/components/MatchHistory.tsx', content);

console.log("Successfully replaced MatchHistory.tsx strings!");
