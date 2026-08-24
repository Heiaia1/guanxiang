import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '观象录｜免费下载 Android App',
  description: '以《周易》为文化背景的个人反思工具。完全免费、无需登录、无广告、断网可用。',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
