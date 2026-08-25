# 观象录 iOS 构建与 App Store 上架说明

## 已经准备好的内容

- 原生 UIKit + WKWebView iPhone/iPad 工程，Bundle ID 为 `com.heiaia1.guanxiang`，最低 iOS 15。
- 业务页面、64 卦、记录、收藏和设置全部随 App 安装，不请求网络权限。
- App Store 1024 图标、全套设备图标、隐私清单、非豁免加密声明和中文商店文案。
- `iOS Build` 工作流负责无需 Apple 凭据的真实 Xcode 模拟器编译。
- `iOS App Store Upload` 工作流负责正式签名、导出 IPA、Apple 服务端校验和可选上传。

## 苹果后台一次性准备

1. 加入 Apple Developer Program，并在 App Store Connect 接受最新协议。
2. 在 Certificates, Identifiers & Profiles 创建显式 App ID：`com.heiaia1.guanxiang`。
3. 创建 Apple Distribution 证书并导出为带密码的 `.p12`。
4. 为上述 App ID 创建 App Store Connect provisioning profile，下载 `.mobileprovision`。
5. 在 App Store Connect 新建应用记录：平台选择 iOS，名称填写“观象录”，Bundle ID 选择上述标识，SKU 可用 `guanxiang-ios-001`。
6. 在 App Store Connect 的用户与访问→集成中创建 Team API Key，保存 Key ID、Issuer ID 和只可下载一次的 `.p8` 文件。

不要把证书、私钥、密码或 API Key 提交到仓库，也不要粘贴到公开聊天。将文件转换为单行 Base64 后写入 GitHub Actions Secrets。

## GitHub Secrets

在仓库 Settings → Secrets and variables → Actions 新增：

| Secret | 内容 |
| --- | --- |
| `APPLE_TEAM_ID` | Apple 开发者 Team ID |
| `IOS_DISTRIBUTION_P12_BASE64` | `.p12` 文件 Base64 |
| `IOS_DISTRIBUTION_P12_PASSWORD` | `.p12` 导出密码 |
| `IOS_PROVISIONING_PROFILE_BASE64` | `.mobileprovision` 文件 Base64 |
| `APP_STORE_CONNECT_KEY_ID` | API Key ID |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID |
| `APP_STORE_CONNECT_API_KEY_BASE64` | `.p8` 文件 Base64 |

PowerShell 转换文件示例：

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('AppleDistribution.p12'))
[Convert]::ToBase64String([IO.File]::ReadAllBytes('Guanxiang_AppStore.mobileprovision'))
[Convert]::ToBase64String([IO.File]::ReadAllBytes('AuthKey_XXXXXXXXXX.p8'))
```

## 云端构建和上传

1. 在 GitHub 仓库 Actions 打开 `iOS Build`，先确认无签名模拟器构建通过。
2. 打开 `iOS App Store Upload`，第一次将 `upload` 保持为 `false`，只生成 IPA 并运行 Apple 服务端校验。
3. 校验通过后再次运行，将 `upload` 设为 `true`，构建会上传到 App Store Connect。
4. 等待 App Store Connect 处理构建，补齐截图、年龄分级、隐私问卷、支持网址和审核联系信息。
5. 先分发到 TestFlight 真机测试，再选择构建并提交审核。

每次重新上传前将 `ios/project.yml` 的 `CURRENT_PROJECT_VERSION` 加 1；面向用户的版本变化再调整 `MARKETING_VERSION`。

## 审核注意

App 使用本地 Web 内容，但不是远程网站快捷方式：包含离线 64 卦资料、五题分析、本地记录、收藏、设置、原生返回手势和无网络可用能力。提交备注应明确这些功能，并提供可直接操作的审核路径。Apple 仍会按最低功能、内容与完整性标准独立判断，代码和自动化不能保证审核必然通过。

