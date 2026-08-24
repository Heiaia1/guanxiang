# 观象录 Android 发布说明

## 用户安装

1. 从本仓库的 GitHub Releases 下载最新 `Guanxiang-Android-*.apk`。
2. 用手机浏览器打开 APK。系统若提示禁止安装，仅对当前浏览器临时允许“安装未知应用”。
3. 安装完成后，建议关闭该临时权限。观象录无需联网权限，可断网运行。

Android 7.0（API 24）及以上版本受支持。记录、收藏与设置只保存在应用本地；卸载应用或在系统设置中清除应用数据会删除这些内容。

## 开发与构建

本机具备 JDK 17 和 Android SDK 36 时，可执行：

```powershell
npm.cmd run validate
Set-Location android
gradle :app:assembleDebug
```

默认发布渠道使用 GitHub Actions，不要求开发电脑安装 Android Studio 或模拟器。手动运行仓库的 `Android APK` 工作流会同时生成可直接安装的 APK 和供应用商店提交的 AAB；推送 `v*` 标签会同时创建 GitHub Release。

## 发布签名

正式版本使用固定 PKCS#12 签名。GitHub 仓库需要以下 Actions Secrets：

- `GX_KEYSTORE_BASE64`
- `GX_KEYSTORE_PASSWORD`
- `GX_KEY_ALIAS`
- `GX_KEY_PASSWORD`

签名文件和密码不能提交到 Git。必须把本地 `android/signing` 目录离线备份到安全位置；如果签名丢失，已安装用户通常无法直接升级到新签名版本。

未配置以上 Secrets 时，工作流仍可生成测试用 APK，但会使用 Android 调试签名，不应提交到正式应用商店。

## 免费发布路径

当前首发使用 GitHub Releases：无需服务器、无需应用商店账号，用户可免费下载 APK。它属于直接分发，不等于 Google Play 等商店审核上架。

F-Droid 只接收符合其自由软件规则的应用；本项目当前为“免费使用但保留商业权利”的自定义许可证，因此在不改变许可证前不提交 F-Droid。其他安卓商店通常需要实名开发者账号、隐私与内容审核，有的平台还要求软件著作权或企业资质；是否免费和材料要求应在提交当日以各平台后台为准。
