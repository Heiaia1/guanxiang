const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

test('iOS 工程包含真实离线 WKWebView 宿主和发布配置', () => {
  const requiredFiles = [
    'ios/project.yml',
    'ios/Guanxiang/AppDelegate.swift',
    'ios/Guanxiang/SceneDelegate.swift',
    'ios/Guanxiang/WebViewController.swift',
    'ios/Guanxiang/Info.plist',
    'ios/Guanxiang/PrivacyInfo.xcprivacy',
    'ios/Guanxiang/Assets.xcassets/AppIcon.appiconset/icon-1024.png'
  ]
  for (const file of requiredFiles) assert.ok(fs.existsSync(path.join(root, file)), `缺少 ${file}`)

  const project = read('ios/project.yml')
  const controller = read('ios/Guanxiang/WebViewController.swift')
  const info = read('ios/Guanxiang/Info.plist')
  assert.match(project, /PRODUCT_BUNDLE_IDENTIFIER: com\.heiaia1\.guanxiang/)
  assert.match(project, /iOS: "15\.0"/)
  assert.match(project, /MARKETING_VERSION: 1\.2\.0/)
  assert.match(controller, /Bundle\.main\.resourceURL/)
  assert.match(controller, /loadFileURL\(indexURL, allowingReadAccessTo: webRoot\)/)
  assert.match(controller, /websiteDataStore = \.default\(\)/)
  assert.match(controller, /url\.isFileURL \? \.allow : \.cancel/)
  assert.match(controller, /GuanxiangIOS\/1\.2\.0/)
  assert.match(controller, /GX_NATIVE_BACK/)
  assert.doesNotMatch(info, /NSCameraUsageDescription|NSMicrophoneUsageDescription|NSLocationWhenInUseUsageDescription/)
  assert.match(info, /ITSAppUsesNonExemptEncryption<\/key><false\/>/)
})

test('iOS 资源与共享 Web 核心一致并声明零追踪', () => {
  for (const file of ['index.html', 'styles.css', 'core.js', 'app.js']) {
    const desktop = fs.readFileSync(path.join(root, 'desktop', file))
    const ios = fs.readFileSync(path.join(root, 'ios', 'Guanxiang', 'Resources', 'web', file))
    assert.deepEqual(ios, desktop, `${file} 未与共享 Web 核心同步`)
  }
  const privacy = read('ios/Guanxiang/PrivacyInfo.xcprivacy')
  assert.match(privacy, /NSPrivacyTracking<\/key><false\/>/)
  assert.match(privacy, /NSPrivacyCollectedDataTypes<\/key><array\/>/)
  assert.match(read('desktop/index.html'), /viewport-fit=cover/)
  assert.match(read('desktop/app.js'), /GuanxiangIOS/)
  assert.match(read('package.json'), /sync:ios/)
})

test('GitHub Actions 可先验证构建，再用 Apple 凭据签名上传', () => {
  const build = read('.github/workflows/ios-build.yml')
  const upload = read('.github/workflows/ios-app-store.yml')
  assert.match(build, /runs-on: macos-15/)
  assert.match(build, /xcodegen generate/)
  assert.match(build, /sdk iphonesimulator/)
  assert.match(build, /CODE_SIGNING_ALLOWED=NO/)
  assert.match(build, /test -f "\$APP_PATH\/index\.html"/)
  assert.match(build, /upload-artifact@v7/)
  assert.match(upload, /IOS_DISTRIBUTION_P12_BASE64/)
  assert.match(upload, /IOS_PROVISIONING_PROFILE_BASE64/)
  assert.match(upload, /APP_STORE_CONNECT_API_KEY_BASE64/)
  assert.match(upload, /xcodebuild -exportArchive/)
  assert.match(upload, /altool --validate-app/)
  assert.match(upload, /altool --upload-app/)
  assert.match(upload, /if: \$\{\{ inputs\.upload \}\}/)
})

test('iOS 应用图标集合包含全部声明尺寸且 PNG 尺寸正确', () => {
  const iconRoot = path.join(root, 'ios', 'Guanxiang', 'Assets.xcassets', 'AppIcon.appiconset')
  const manifest = JSON.parse(fs.readFileSync(path.join(iconRoot, 'Contents.json'), 'utf8'))
  assert.equal(manifest.images.length, 18)
  for (const image of manifest.images) {
    const buffer = fs.readFileSync(path.join(iconRoot, image.filename))
    assert.equal(buffer.toString('hex', 0, 8), '89504e470d0a1a0a')
    const expected = Math.round(Number.parseFloat(image.size) * Number.parseFloat(image.scale))
    assert.equal(buffer.readUInt32BE(16), expected, `${image.filename} 宽度错误`)
    assert.equal(buffer.readUInt32BE(20), expected, `${image.filename} 高度错误`)
  }
})
