import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://guanxiang-app.scfj8gkrzf.chatgpt.site'),
  title: '观象录｜免费下载 Android App',
  description: '以《周易》为文化背景的个人反思工具。完全免费、无需登录、无广告、断网可用。',
  alternates: { canonical: '/' },
  openGraph: {
    title: '观象录｜观照当下，自有答案。',
    description: '完全免费、无需登录、无广告、断网可用的个人反思工具。',
    type: 'website',
    locale: 'zh_CN',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: '观象录：观照当下，自有答案。' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '观象录｜观照当下，自有答案。',
    description: '完全免费、无需登录、无广告、断网可用的个人反思工具。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
