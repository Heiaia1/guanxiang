import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guanxiang-app.scfj8gkrzf.chatgpt.site'),
  title: '风后奇门｜iOS 与 Android App',
  description: '以风后奇门的九宫方位与时空秩序为视觉主题。Android 可直接下载，iOS 已进入 App Store 上架流程。',
  alternates: { canonical: '/' },
  openGraph: {
    title: '风后奇门｜风起九宫，门开万象。',
    description: '以九宫方位与时空秩序为视觉主题，完全免费、无需登录、断网可用。',
    type: 'website',
    locale: 'zh_CN',
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: '风后奇门：风起九宫，门开万象。' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '风后奇门｜风起九宫，门开万象。',
    description: '以九宫方位与时空秩序为视觉主题，完全免费、无需登录、断网可用。',
    images: ['/og.jpg'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
