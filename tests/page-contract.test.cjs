const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')

const root = path.resolve(__dirname, '..')
const miniRoot = path.join(root, 'miniprogram')
const originalResolveFilename = Module._resolveFilename

Module._resolveFilename = function resolveTypeScript(request, parent, isMain, options) {
  try {
    return originalResolveFilename.call(this, request, parent, isMain, options)
  } catch (error) {
    if ((request.startsWith('.') || path.isAbsolute(request)) && !path.extname(request)) {
      return originalResolveFilename.call(this, `${request}.ts`, parent, isMain, options)
    }
    throw error
  }
}

global.wx = new Proxy({}, {
  get() {
    return () => undefined
  }
})
global.getApp = () => ({ globalData: { lowPerformance: false } })
global.getCurrentPages = () => []

function boundMethods(wxml) {
  const methods = new Set()
  const pattern = /\b(?:bind|catch)(?::?[a-zA-Z-]+)="([a-zA-Z_$][\w$]*)"/g
  for (const match of wxml.matchAll(pattern)) methods.add(match[1])
  return [...methods]
}

test('app.json 中的十三个页面均能加载，WXML 交互处理器全部存在', () => {
  const appConfig = require('../miniprogram/app.json')
  assert.equal(appConfig.pages.length, 13)

  for (const page of appConfig.pages) {
    let definition = null
    global.Page = (options) => { definition = options }
    const script = path.join(miniRoot, `${page}.ts`)
    delete require.cache[require.resolve(script)]
    require(script)
    assert.ok(definition, `${page} 没有注册 Page`)
    assert.ok(definition.data && typeof definition.data === 'object', `${page} 缺少 data`)

    const wxml = fs.readFileSync(path.join(miniRoot, `${page}.wxml`), 'utf8')
    for (const method of boundMethods(wxml)) {
      assert.equal(typeof definition[method], 'function', `${page}.wxml 绑定了不存在的 ${method}`)
    }
  }
})

test('所有自定义组件均能加载并提供 WXML 绑定的方法', () => {
  const componentRoot = path.join(miniRoot, 'components')
  for (const directory of fs.readdirSync(componentRoot)) {
    const base = path.join(componentRoot, directory, directory)
    if (!fs.existsSync(`${base}.ts`)) continue
    let definition = null
    global.Component = (options) => { definition = options }
    delete require.cache[require.resolve(`${base}.ts`)]
    require(`${base}.ts`)
    assert.ok(definition, `${directory} 没有注册 Component`)

    const methods = definition.methods || {}
    const wxml = fs.readFileSync(`${base}.wxml`, 'utf8')
    for (const method of boundMethods(wxml)) {
      assert.equal(typeof methods[method], 'function', `${directory}.wxml 绑定了不存在的 ${method}`)
    }
  }
})

test('小程序入口可注册 App 并含有全局数据', () => {
  let definition = null
  global.App = (options) => { definition = options }
  const script = path.join(miniRoot, 'app.ts')
  delete require.cache[require.resolve(script)]
  require(script)
  assert.ok(definition)
  assert.ok(definition.globalData)
  assert.equal(typeof definition.onLaunch, 'function')
})

test('开发者工具与小程序都固定从可见启动页进入', () => {
  const projectConfig = require('../project.config.json')
  const appConfig = require('../miniprogram/app.json')
  const modes = projectConfig.condition?.miniprogram?.list || []

  assert.equal(appConfig.pages[0], 'pages/launch/launch')
  assert.notEqual(projectConfig.appid, 'touristappid')
  assert.ok(modes.some((item) =>
    item.pathName === 'pages/launch/launch' && item.query === ''
  ))

  const ignored = new Set(
    projectConfig.packOptions.ignore
      .filter((item) => item.type === 'folder')
      .map((item) => item.value)
  )
  for (const folder of ['.cache', '.devtools-profile-2', '.devtools-profile-3', '.devtools-profile-4', '.devtools-profile-5', '微信web开发者工具', 'node_modules', 'desktop']) {
    assert.ok(ignored.has(folder), `开发者工具不应扫描 ${folder}`)
  }
})

test('问题输入页展示安全词库提供的输入提示', () => {
  let definition = null
  global.Page = (options) => { definition = options }
  const script = path.join(miniRoot, 'pages/question/question.ts')
  delete require.cache[require.resolve(script)]
  require(script)

  const safety = require('../miniprogram/data/safety-words.json')
  const wxml = fs.readFileSync(path.join(miniRoot, 'pages/question/question.wxml'), 'utf8')
  assert.equal(definition.data.inputNotice, safety.inputNotice)
  assert.match(wxml, /\{\{inputNotice\}\}/)
})
