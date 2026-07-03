import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest } from 'next/server';

export const proxy = (request: NextRequest) => {
  // 1. 获取用户的 IP 归属地 (Vercel 环境下的请求头)
  const country = request.headers.get('x-vercel-ip-country');
  
  // 2. 动态决定兜底默认语言
  let defaultLocale = 'en'; // 全局兜底默认为英文
  
  if (country) {
    // 如果是中文地区，兜底为中文
    if (['CN', 'TW', 'HK', 'MO'].includes(country)) {
      defaultLocale = 'zh';
    }
  }

  // 3. 创建带有动态 defaultLocale 的中间件
  // 执行顺序：
  // 1. URL 路由匹配 (如果 URL 中有 /zh 或 /en, 直接使用)
  // 2. 检查 Accept-Language (如果浏览器设置了明确的语言且在我们支持的列表里，优先使用)
  // 3. 降级兜底：如果 Accept-Language 没匹配上，使用我们基于 IP 决定的 defaultLocale
  const handleI18nRouting = createMiddleware({
    ...routing,
    defaultLocale: defaultLocale as 'zh' | 'en'
  });
  
  return handleI18nRouting(request);
}

export const config = {
  // 只匹配非 API 和非静态资源的国际化路径
  matcher: ['/', '/(zh|en)/:path*']
};
