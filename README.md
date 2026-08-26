# 观象录 · iOS、Android、微信小程序与 Windows 桌面版

本仓库包含原生 iOS/Android 离线 App、可直接导入微信开发者工具的 TypeScript 小程序，以及无需微信开发者工具、可双击运行的 Windows 桌面版。四端共用评估、分析、安全拦截、六十四卦和札记内容，将《周易》用于传统文化学习、现实情境反思和行动记录，不预测未来必然结果。

作者与维护者：**风后奇门**

## English Introduction

**Guanxiang** is a free, offline-first I Ching culture and personal reflection application maintained by **Fenghou Qimen (风后奇门)**. It helps users organize real-life situations, review changing conditions, and turn reflection into practical next steps. It does not claim to predict fixed outcomes and is not a substitute for medical, legal, financial, or safety advice.

The project currently provides:

- native offline apps for Android and iOS;
- a native TypeScript WeChat Mini Program;
- a Windows desktop edition that runs locally through Microsoft Edge;
- three reflection flows: situational assessment, daily observation, and traditional three-coin interaction;
- all 64 hexagrams, 384 line texts, modern cultural explanations, and 24 practical reflection notes;
- local-only history, favorites, 30-day review reminders, and preferences, with no account, advertising, payment, analytics, or remote AI service.

Android and Windows builds are available from [GitHub Releases](../../releases/latest). The iOS project includes a build and App Store delivery pipeline, but public installation requires Apple review and an official App Store release. Developers can import the repository root directly into WeChat DevTools for local Mini Program testing.

Personal, educational, and non-commercial use is free. Commercial deployment, paid redistribution, rebranding, or integration into another paid product requires prior written permission. See [LICENSE.md](LICENSE.md) and [COMMERCIAL.md](COMMERCIAL.md).

## 免费下载

- 官方网站：[风后奇门主题 App 下载页](https://guanxiang-app.scfj8gkrzf.chatgpt.site)，手机打开后点击“下载 Android App”即可从 Cloudflare 同源直连下载安装包。
- GitHub Pages 镜像：[heiaia1.github.io/guanxiang](https://heiaia1.github.io/guanxiang/)，网站源码位于本仓库的 `website` 分支，推送后由 GitHub Actions 自动上线。
- Windows 用户可从 [GitHub Releases](../../releases/latest) 下载 `Guanxiang-Windows.zip`，解压后双击 `打开观象录桌面版.vbs`。
- Android 用户可从 [GitHub Releases](../../releases/latest) 下载 `Guanxiang-Android-*.apk`。首次安装 GitHub 下载的 APK 时，Android 会要求仅对当前浏览器允许“安装未知应用”；安装完成后可立即关闭该权限。
- iPhone/iPad 版已提供可编译、签名和上传的原生 iOS 工程；正式下载必须在 Apple 审核通过后通过 App Store 提供，普通用户不能像 Android 一样直接安装未签名 IPA。
- 微信小程序开发者可下载源码后，在微信开发者工具中导入仓库根目录。
- 当前版本完全免费、无每日次数限制、无登录、无广告、无联网服务，也不会在本机伪造无法可靠执行的付费限制。
- 软件免费不代表放弃著作权。个人可以免费使用和学习；商业部署、收费分发、换皮上架或把本项目作为付费服务，需要另行获得书面授权，详见 [许可证](LICENSE.md) 与 [商业合作说明](COMMERCIAL.md)。

## 已实现

- 14 个完整页面：启动、说明、首页、领域选择、问题输入、五题评估、六爻生成、结果、观象札记、文化馆、单卦详情、历史记录、支持项目和设置。
- Windows 桌面版：独立应用窗口、完整问事评估、今日观象、铜钱互动、结果、文化馆、札记、历史、收藏与设置。
- Android App：原生离线 WebView 宿主、手机底部导航、系统返回键、刘海/手势安全区、应用图标、旋转与进程恢复、签名 APK 云构建。
- iOS App：UIKit + WKWebView 原生宿主、安装包内离线页面、持久本地数据、左侧返回手势、刘海/灵动岛安全区、iPhone/iPad 图标、隐私清单、macOS 云构建与 App Store 签名上传流水线。
- 情境观象、今日观象和三枚铜钱六次互动三种流程。
- 64 卦、384 条爻辞、八卦基础资料、白话文化解释与现实行动建议。
- 24 篇观象札记，覆盖进退、工作、关系、学习、家庭和自省；首页每日稳定推荐，支持分类、搜索和展开阅读。
- 五题八维评分，每题提供 6—8 个细分选择，共 10368 种完整组合；结合六领域权重、24 类现实子场景生成不同的上下卦、变化爻和行动结果。
- 医疗、法律、投资、彩票、自伤、他伤与人身安全拦截；手机号、证件号和邮箱拦截。
- 全本地草稿、历史、收藏和设置；无账号、无服务器、无 AI API、无支付、无广告。
- CSS 水墨/粒子/六爻动效、程序音效、轻震动、省电模式和 Canvas 隐私分享卡。
- 分享卡只绘制卦名、关键词和行动提醒，不包含用户原问题或结构化答案。
- 结果可安排 30 天本地回看；到期后在首页和记录页提示并可标记完成，不申请系统通知权限。
- 支持项目页提供自愿分享、GitHub 关注和商业授权/定制合作入口，分享不与结果解锁绑定。

## 项目结构

```text
guanxiang
├─ miniprogram/          # 小程序运行代码、页面、组件和本地内容
│  ├─ data/            # 六十四卦、观象札记、评估、领域、子场景与安全词库
│  ├─ services/        # 评估、观象、卦象和本地存储深模块
│  ├─ pages/           # 14 个页面
│  └─ components/      # 卦象与确认交互组件
├─ desktop/              # Windows 桌面版界面与自动生成的共享核心
├─ android/              # Android 原生宿主、资源、图标和 Gradle 配置
├─ ios/                  # iOS UIKit 宿主、XcodeGen 配置、资源、图标和隐私清单
├─ .github/workflows/    # 免费云构建与 GitHub Release 发布
├─ tests/                # Node 行为、覆盖、存储故障与页面契约测试
├─ scripts/              # 无外部服务的全项目静态校验
├─ docs/                 # 产品、内容、隐私、协议、测试与提审文档
├─ project.config.json   # 微信开发者工具项目配置
├─ 打开观象录桌面版.vbs # 无命令行窗口启动桌面版
├─ package.json
└─ tsconfig.json
```

## 本地校验

需要 Node.js 22.18.0 或更高版本。开发依赖只有免费的 TypeScript 编译器。

```powershell
Set-Location -LiteralPath 'E:\卦'
npm.cmd ci --cache 'E:\卦\.cache\npm' --ignore-scripts --no-audit --no-fund
npm.cmd run validate
```

`validate` 依次执行：

1. 行为与页面契约测试。
2. TypeScript 全量类型检查。
3. 14 页四件套、64 卦/384 爻、24 篇札记、JSON、导航、组件、远程资源、禁用文案和主包体积校验。
4. Android/iOS 离线资源同步、宿主安全配置、图标尺寸和发布工作流契约校验。

本次干净安装与全量验证的环境、统计和证据见 [本地交付验证报告](docs/validation-report.md)。

## 导入微信开发者工具

从 GitHub 下载源码后，建议在微信开发者工具中手动导入仓库根目录。项目内的 `打开观象录.vbs` 是原开发机的便捷启动器，依赖同目录的本地开发者工具副本，不属于通用发布包。

1. 打开微信开发者工具，选择“导入项目”。
2. 项目目录选择仓库根目录，不要只选择 `miniprogram` 子目录。
3. 本地界面检查可以使用仓库中的测试 AppID；真机预览、体验版和上传前，必须将 `project.config.json` 的 `appid` 换成自己已注册的小程序 AppID。
4. 确认详情→本地设置中已启用 TypeScript 编译。小程序本身无需 npm 构建或构建 npm 包。
5. 按 [手工验收文档](docs/manual-qa.md) 完成开发工具、iOS、Android、断网和低性能检查。

不要把 `miniprogram` 子目录单独作为项目导入；微信开发者工具需要读取仓库根目录的 `project.config.json`。

## 直接使用 Windows 桌面版

双击项目根目录的 `打开观象录桌面版.vbs`。启动器会把中文项目路径转换成 UTF-8 文件地址，并使用系统已有的 Microsoft Edge 应用窗口模式打开，不需要微信、开发者工具、本地服务器或命令行窗口。

桌面版与 Android App 支持首页、五题问事、今日观象、铜钱互动、结果生成、六十四卦、观象札记、历史记录、收藏和本地设置。记录、收藏和设置保存在各自应用的本地存储中，与微信小程序数据相互独立，不会自动同步。

若系统没有安装 Edge，启动器会退回默认浏览器打开。开发调试时也可以执行：

```powershell
npm.cmd run desktop:serve
```

修改 `miniprogram/data` 或共享引擎后，执行 `npm.cmd run generate` 即可同时更新微信运行时数据、桌面共享核心与 Android/iOS assets。

Android APK 由 `.github/workflows/android-release.yml` 在 GitHub Actions 免费构建；推送 `v*` 标签后会自动生成 GitHub Release。安装、签名备份和发布步骤见 [Android 发布说明](docs/android-release-readme.md)，可直接复制的商店资料见 [Android 商店资料](docs/android-store-listing.md)。

iOS 无签名模拟器包由 `.github/workflows/ios-build.yml` 自动编译验证；`.github/workflows/ios-app-store.yml` 在配置 Apple 证书、描述文件和 App Store Connect API Key 后生成正式 IPA、执行 Apple 服务端验证，并可选择上传。完整操作见 [iOS 上架说明](docs/ios-release-readme.md)，商店文案见 [iOS 商店资料](docs/ios-store-listing.md)，iOS 隐私页见 [iOS 隐私说明](docs/privacy-policy-ios.md)。

## 数据与隐私

- 运行时只使用微信小程序同步本地存储。
- 保留最新 100 条非收藏观象记录；用户明确收藏的记录不占这 100 条配额。
- 写入、删除后会立即回读校验；存储配额或 I/O 失败时不会显示伪成功。
- 使用独立的 `gx_meta` 保存存储结构版本；首次读取旧版无版本数据时只补元数据，不重写问题、记录、草稿、收藏或设置。
- 瞬时读取失败、结构损坏或检测到更高版本时停止普通写入并保留原数据，历史与设置页提供重试或用户确认后的恢复入口。
- 完整收集范围、删除方式和边界见 [隐私保护说明](docs/privacy-policy.md)。

## 内容说明

卦辞与爻辞按公版《周易》文本整理，可在[维基文库《周易》](https://zh.wikisource.org/zh/%E5%91%A8%E6%98%93)核对；现代白话、观象札记、子场景、风险提示和行动建议为本项目独立撰写。札记中的来源均标为相关观念或意旨，不伪装成古籍原句。传统文本只作文化背景，不用于宣称用户未来会发生某件事。

## 上架前必做

- 使用真实 AppID、主体、实际服务类目和小程序隐私保护指引。
- 完成 APP 备案、微信后台隐私配置、投诉/反馈渠道和体验版真机验收。
- 在提交当天复核微信的最新类目、隐私和内容规则。本项目不承诺一定过审。
- 逐项完成 [提审检查清单](docs/submission-checklist.md)。

## 免费发布与后续商业化

当前阶段以零服务器成本积累真实用户和反馈，不接支付、不设置容易绕过的本地次数墙。未来具备合规主体与支付条件后，可以继续保留基础版本免费，并将新增的跨设备同步、专题内容包、团队版或商业授权作为可选付费能力。任何付费版本都不应把文化反思内容宣传为预测、诊断或保证结果。

完整的当前增长链路、合作收益方向、平台支付前置条件与合规边界见 [零成本增长与商业化路线](docs/monetization-roadmap.md)。

## 当前验证边界

已完成 Node 自动测试、TypeScript 检查、页面加载契约、桌面浏览器完整流程、刷新持久化和项目结构校验。Android 与 iOS 工程通过 GitHub Actions 分别执行真实 Gradle/Xcode 编译。当前工作区没有用户的 Apple Developer 凭据、App Store Connect 应用记录和 iOS 真机，因此尚未完成正式 IPA 签名上传、TestFlight 真机和 Apple 人工审核；这些项目不属于已验证结论。
