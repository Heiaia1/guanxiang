import { NextResponse } from 'next/server';

const RELEASES_API = 'https://api.github.com/repos/Heiaia1/guanxiang/releases/latest';
const RELEASES_PAGE = 'https://github.com/Heiaia1/guanxiang/releases/latest';

type ReleaseAsset = { name?: string; browser_download_url?: string };

export async function GET() {
  try {
    const response = await fetch(RELEASES_API, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'guanxiang-website' },
      next: { revalidate: 300 },
    });
    if (response.ok) {
      const release = await response.json() as { assets?: ReleaseAsset[] };
      const apk = release.assets?.find((asset) => asset.name?.startsWith('Guanxiang-Android-') && asset.name.endsWith('.apk'));
      if (apk?.browser_download_url) return NextResponse.redirect(apk.browser_download_url, 307);
    }
  } catch {
    // GitHub API 短暂不可用时，仍让用户进入最新发布页手动下载。
  }
  return NextResponse.redirect(RELEASES_PAGE, 307);
}
