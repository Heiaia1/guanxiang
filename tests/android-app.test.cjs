const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const androidRoot = path.join(root, 'android')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

test('Android 工程包含可发布的离线 WebView 宿主', () => {
  const requiredFiles = [
    'android/settings.gradle',
    'android/build.gradle',
    'android/app/build.gradle',
    'android/app/src/main/AndroidManifest.xml',
    'android/app/src/main/java/com/heiaia1/guanxiang/MainActivity.java',
    'android/app/src/main/assets/index.html',
    'android/app/src/main/assets/styles.css',
    'android/app/src/main/assets/core.js',
    'android/app/src/main/assets/app.js'
  ]
  for (const file of requiredFiles) {
    assert.ok(fs.existsSync(path.join(root, file)), `缺少 ${file}`)
  }

  const manifest = read('android/app/src/main/AndroidManifest.xml')
  const activity = read('android/app/src/main/java/com/heiaia1/guanxiang/MainActivity.java')
  const appGradle = read('android/app/build.gradle')
  assert.doesNotMatch(manifest, /android\.permission\.INTERNET/)
  assert.match(activity, /setJavaScriptEnabled\(true\)/)
  assert.match(activity, /setDomStorageEnabled\(true\)/)
  assert.match(activity, /setBlockNetworkLoads\(true\)/)
  assert.match(activity, /GX_ANDROID_BACK/)
  assert.match(appGradle, /applicationId ['"]com\.heiaia1\.guanxiang['"]/) 
  assert.match(appGradle, /minSdk 24/)
  assert.match(appGradle, /compileSdk 36/)
  assert.match(appGradle, /targetSdk 36/)
})

test('Android 资源由桌面共享核心同步且内容一致', () => {
  for (const file of ['index.html', 'styles.css', 'core.js', 'app.js']) {
    const desktop = fs.readFileSync(path.join(root, 'desktop', file))
    const android = fs.readFileSync(path.join(androidRoot, 'app', 'src', 'main', 'assets', file))
    assert.deepEqual(android, desktop, `${file} 未与共享 Web 核心同步`)
  }
  assert.match(read('scripts/sync-android-assets.mjs'), /desktop/)
  assert.match(read('package.json'), /sync:android/)
})

test('GitHub Actions 提供免费 Android 构建和 Release 发布', () => {
  const workflow = read('.github/workflows/android-release.yml')
  assert.match(workflow, /workflow_dispatch:/)
  assert.match(workflow, /tags:/)
  assert.match(workflow, /assembleRelease/)
  assert.match(workflow, /bundleRelease/)
  assert.match(workflow, /Guanxiang-Android-.*\.aab/)
  assert.match(workflow, /upload-artifact/)
  assert.match(workflow, /softprops\/action-gh-release/)
  assert.match(workflow, /GX_KEYSTORE_BASE64/)
})
