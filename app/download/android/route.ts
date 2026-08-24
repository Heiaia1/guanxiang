import { NextResponse } from 'next/server';

const APK_PATH = '/downloads/Guanxiang-Android-v1.1.0.apk';

export function GET(request: Request) {
  // 保留旧下载入口，避免已经分享出去的链接失效。
  return NextResponse.redirect(new URL(APK_PATH, request.url), 307);
}
