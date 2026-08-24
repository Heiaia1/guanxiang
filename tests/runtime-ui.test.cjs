const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const fs = require('node:fs')

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

function loadPage(pageName, wxApi = {}) {
  let definition = null
  global.Page = (options) => { definition = options }
  global.wx = wxApi
  global.getApp = () => ({ globalData: { lowPerformance: false } })
  global.getCurrentPages = () => []
  const script = path.resolve(__dirname, '..', 'miniprogram', 'pages', pageName, `${pageName}.ts`)
  delete require.cache[require.resolve(script)]
  require(script)
  assert.ok(definition, `${pageName} 页面未注册`)
  return definition
}

function createPageContext(definition, data = {}) {
  const context = {
    ...definition,
    data: { ...definition.data, ...data },
    setData(patch) {
      Object.assign(this.data, patch)
    }
  }
  return context
}

function loadPageWithStorage(pageName, initialStorage = {}, overrides = {}) {
  const values = new Map(Object.entries(initialStorage))
  const wxApi = {
    getStorageSync(key) { return values.get(key) },
    setStorageSync(key, value) { values.set(key, value) },
    removeStorageSync(key) { values.delete(key) },
    hideShareMenu() {},
    showShareMenu() {},
    showToast() {},
    navigateTo() {},
    ...overrides
  }
  global.wx = wxApi
  global.getApp = () => ({ globalData: { lowPerformance: false } })
  global.getCurrentPages = () => []
  for (const modulePath of [
    '../miniprogram/services/storage-service.ts',
    '../miniprogram/services/ui-preferences.ts'
  ]) {
    const resolved = require.resolve(modulePath)
    delete require.cache[resolved]
  }
  return {
    definition: loadPage(pageName, wxApi),
    values
  }
}

test('文化馆拼音搜索兼容无声调输入和 v 形式的 ü', () => {
  const { normalizePinyinSearch } = require('../miniprogram/utils/text.ts')

  assert.equal(normalizePinyinSearch('qián'), 'qian')
  assert.equal(normalizePinyinSearch(' QIAN '), 'qian')
  assert.equal(normalizePinyinSearch('lǚ'), 'lv')
  assert.equal(normalizePinyinSearch('lü'), 'lv')
})

test('高风险或错误结果不会暴露无关卦象分享入口', () => {
  let hidden = 0
  let shown = 0
  const definition = loadPage('result', {
    hideShareMenu() { hidden += 1 },
    showShareMenu() { shown += 1 }
  })
  const context = createPageContext(definition, {
    loading: false,
    blocked: true,
    error: '',
    name: '',
    shareText: '',
    hexagramId: 1
  })

  context.setShareAvailability(false)
  const payload = context.onShareAppMessage()

  assert.equal(hidden, 1)
  assert.equal(shown, 0)
  assert.equal(payload.path, '/pages/home/home')
  assert.ok(!payload.title.includes('undefined'))
})

test('六爻音效复用页面级音频上下文并在卸载时释放', () => {
  let created = 0
  let closed = 0
  const audio = {
    currentTime: 0,
    destination: {},
    createOscillator() {
      return {
        type: '',
        frequency: { value: 0 },
        connect() {},
        start() {},
        stop() {}
      }
    },
    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          exponentialRampToValueAtTime() {}
        },
        connect() {}
      }
    },
    close() { closed += 1 }
  }
  const definition = loadPage('casting', {
    createWebAudioContext() {
      created += 1
      return audio
    }
  })
  const context = createPageContext(definition, { sound: true })
  context.timers = []

  context.playChime(1)
  context.playChime(2)
  context.onUnload()

  assert.equal(created, 1)
  assert.equal(closed, 1)
})

test('关闭动画与低性能降级保持为两个独立显示状态', () => {
  const { resolveUiPreferences } = require('../miniprogram/services/ui-preferences.ts')

  assert.deepEqual(resolveUiPreferences({ animations: false, lowPower: false }, false), {
    animationsEnabled: false,
    motionOff: true,
    lowPower: false
  })
  assert.deepEqual(resolveUiPreferences({ animations: true, lowPower: false }, true), {
    animationsEnabled: true,
    motionOff: false,
    lowPower: true
  })
})

test('关闭动画设置覆盖全部页面根节点且启动页直接进入静态态', () => {
  const appConfig = require('../miniprogram/app.json')
  const miniRoot = path.resolve(__dirname, '..', 'miniprogram')

  for (const page of appConfig.pages) {
    const wxml = fs.readFileSync(path.join(miniRoot, `${page}.wxml`), 'utf8')
    const script = fs.readFileSync(path.join(miniRoot, `${page}.ts`), 'utf8')
    assert.match(wxml, /motionOff\s*\?\s*['"]motion-off['"]/, `${page} 根节点未接入 motion-off`)
    assert.match(script, /motionOff\s*:/, `${page} 未加载关闭动画状态`)
  }

  const launch = fs.readFileSync(path.join(miniRoot, 'pages/launch/launch.ts'), 'utf8')
  assert.match(launch, /visual\.motionOff/)
  const globalStyles = fs.readFileSync(path.join(miniRoot, 'app.wxss'), 'utf8')
  assert.match(globalStyles, /\.motion-off/)
  assert.match(globalStyles, /animation:\s*none\s*!important/)
})

test('结果场景把中英文八卦名稳定映射为八种视觉键', () => {
  const { resolveTrigramScene } = require('../miniprogram/services/ui-preferences.ts')
  const cases = {
    乾: 'qian', 坤: 'kun', 震: 'zhen', 巽: 'xun',
    坎: 'kan', 离: 'li', 艮: 'gen', 兑: 'dui',
    qian: 'qian', kan: 'kan'
  }
  for (const [input, expected] of Object.entries(cases)) {
    assert.equal(resolveTrigramScene(input), expected)
  }
  assert.equal(resolveTrigramScene('unknown'), 'qian')
})

test('结果页提供八种上卦与八种下卦的可组合轻量场景', () => {
  const css = fs.readFileSync(
    path.resolve(__dirname, '..', 'miniprogram/pages/result/result.wxss'),
    'utf8'
  )
  const wxml = fs.readFileSync(
    path.resolve(__dirname, '..', 'miniprogram/pages/result/result.wxml'),
    'utf8'
  )
  for (const trigram of ['qian', 'kun', 'zhen', 'xun', 'kan', 'li', 'gen', 'dui']) {
    assert.ok(css.includes(`.scene-upper--${trigram}`), `缺少上卦 ${trigram} 场景`)
    assert.ok(css.includes(`.scene-lower--${trigram}`), `缺少下卦 ${trigram} 场景`)
  }
  assert.match(wxml, /scene-upper--\{\{upperScene\}\}/)
  assert.match(wxml, /scene-lower--\{\{lowerScene\}\}/)
})

test('首页与文化馆入口在导航完成前忽略连续点击', () => {
  let homeNavigations = 0
  const homeDefinition = loadPage('home', {
    navigateTo() { homeNavigations += 1 },
    showToast() {}
  })
  const home = createPageContext(homeDefinition, { navigating: false })
  home.navigate('/pages/library/library')
  home.navigate('/pages/library/library')
  assert.equal(homeNavigations, 1)

  let libraryNavigations = 0
  const libraryRuntime = loadPageWithStorage('library', { gx_guide_seen: true }, {
    navigateTo() { libraryNavigations += 1 },
    showToast() {}
  })
  const library = createPageContext(libraryRuntime.definition, { navigating: false })
  const event = { currentTarget: { dataset: { id: 1 } } }
  library.openDetail(event)
  library.openDetail(event)
  assert.equal(libraryNavigations, 1)
})

test('首页展示每日札记并能进入完整札记页', () => {
  const notes = require('../miniprogram/data/wisdom-notes.json')
  const homeWxml = fs.readFileSync(
    path.resolve(__dirname, '..', 'miniprogram/pages/home/home.wxml'),
    'utf8'
  )
  assert.ok(notes.length >= 24)
  assert.match(homeWxml, /todayWisdom\.title/)
  assert.match(homeWxml, /bindtap="openWisdom"/)
})

test('用户确认本次不保存后删除记录、抑制再次自动保存，并可手动恢复保存', () => {
  const result = {
    status: 'ready',
    hexagramId: 1,
    name: '乾',
    upperTrigram: 'qian',
    lowerTrigram: 'qian',
    actions: ['确认事实', '完成验证', '重新判断']
  }
  const draft = {
    mode: 'context',
    category: 'self',
    question: '我想理清当前安排',
    answers: {},
    result,
    recordId: 'record-1',
    createdAt: 1000
  }
  const record = {
    ...draft,
    id: 'record-1',
    hexagramId: 1,
    createdAt: 1000
  }
  const { definition, values } = loadPageWithStorage('result', {
    gx_draft: draft,
    gx_records: [record],
    gx_settings: { animations: true, autoSave: true }
  })
  const context = createPageContext(definition, {
    loading: false,
    saved: true,
    saving: false,
    removing: false,
    blocked: false,
    error: '',
    doNotSave: false,
    hexagramId: 1,
    mode: 'context',
    summary: '保持主动并检查现实条件',
    mainConflict: '先确认事实',
    advantage: '仍有调整空间',
    riskNotice: '不要急于作结论',
    actions: result.actions,
    disclaimer: '文化互动参考',
    shareText: '先验证，再决定',
    isFavorite: false
  })
  context.draft = draft
  context.rawResult = result
  context.recordId = 'record-1'
  context.fromHistory = false

  context.confirmRemoveRecord()

  assert.deepEqual(values.get('gx_records'), [])
  assert.equal(values.get('gx_draft').recordId, '')
  assert.equal(values.get('gx_draft').doNotSave, true)
  assert.equal(context.data.saved, false)
  assert.equal(context.data.doNotSave, true)

  const reloaded = createPageContext(definition)
  reloaded.loadResult({})
  assert.deepEqual(values.get('gx_records'), [])

  reloaded.saveCurrent(false)
  assert.equal(values.get('gx_records').length, 1)
  assert.equal(values.get('gx_draft').doNotSave, false)
})

test('结果页删除记录遇到持续读取故障时仍会收口并提示用户', () => {
  const toasts = []
  const { definition } = loadPageWithStorage('result', {}, {
    getStorageSync() {
      throw new Error('simulated read outage')
    },
    showToast(options) {
      toasts.push(options.title)
    }
  })
  const context = createPageContext(definition, {
    saved: true,
    removing: false,
    blocked: false,
    error: ''
  })
  context.recordId = 'record-1'
  context.draft = { recordId: 'record-1' }
  context.fromHistory = false

  assert.doesNotThrow(() => context.confirmRemoveRecord())
  assert.equal(context.data.saved, true)
  assert.equal(context.data.removing, false)
  assert.deepEqual(toasts, ['本地记录未完全移除，请重试'])
})

test('开始新的情境或今日观象会重置上一条不保存状态', () => {
  const categoryRuntime = loadPageWithStorage('category', {
    gx_draft: { mode: 'context', doNotSave: true }
  })
  const category = createPageContext(categoryRuntime.definition, {
    selected: '',
    navigating: false
  })
  category.selectCategory({ currentTarget: { dataset: { category: 'career' } } })
  assert.equal(categoryRuntime.values.get('gx_draft').doNotSave, false)

  const dailyRuntime = loadPageWithStorage('home', {
    gx_draft: { mode: 'context', doNotSave: true }
  })
  const home = createPageContext(dailyRuntime.definition, {
    creatingDaily: false,
    navigating: false,
    dailyVisible: true
  })
  home.chooseDaily({ currentTarget: { dataset: { state: 'calm' } } })
  assert.equal(dailyRuntime.values.get('gx_draft').doNotSave, false)
})

test('首次说明回跳仅允许文化馆和合法卦象详情', () => {
  const { resolveGuideReturn } = require('../miniprogram/utils/navigation.ts')

  assert.equal(resolveGuideReturn({ returnTo: 'library' }), '/pages/library/library')
  assert.equal(resolveGuideReturn({ returnTo: 'wisdom' }), '/pages/wisdom/wisdom')
  assert.equal(
    resolveGuideReturn({ returnTo: 'hexagram', id: '64' }),
    '/pages/hexagram-detail/hexagram-detail?id=64'
  )
  assert.equal(resolveGuideReturn({ returnTo: 'hexagram', id: '0' }), '/pages/library/library')
  assert.equal(resolveGuideReturn({ returnTo: '/pages/settings/settings' }), '/pages/home/home')
})

test('首次说明在勾选前提供两份本地完整文本入口', () => {
  const miniRoot = path.resolve(__dirname, '..', 'miniprogram')
  const guideWxml = fs.readFileSync(path.join(miniRoot, 'pages/guide/guide.wxml'), 'utf8')
  const guideScript = fs.readFileSync(path.join(miniRoot, 'pages/guide/guide.ts'), 'utf8')
  const guideConfig = require('../miniprogram/pages/guide/guide.json')
  const legalSheet = fs.readFileSync(
    path.join(miniRoot, 'components/legal-document-sheet/legal-document-sheet.wxml'),
    'utf8'
  )

  assert.match(guideScript, /legal-documents-data/)
  assert.match(guideWxml, /我已阅读并同意隐私说明和用户协议/)
  assert.match(guideWxml, /wx:for="\{\{legalDocuments\}\}"/)
  assert.equal(
    guideConfig.usingComponents['legal-document-sheet'],
    '/components/legal-document-sheet/legal-document-sheet'
  )
  assert.match(legalSheet, /scroll-view/)
  assert.match(legalSheet, /document\.sections/)
  assert.match(legalSheet, /document\.paragraphs|section\.paragraphs/)
  assert.match(legalSheet, /document\.bullets|section\.bullets/)
})

test('文化馆和卦象分享直达在同意前回到首次说明且不读取收藏', () => {
  let libraryRedirect = ''
  const libraryRuntime = loadPageWithStorage('library', {}, {
    redirectTo({ url }) { libraryRedirect = url },
    showToast() {}
  })
  const library = createPageContext(libraryRuntime.definition)
  library.onShow()
  assert.equal(libraryRedirect, '/pages/guide/guide?returnTo=library')
  assert.deepEqual(library.data.hexagrams, [])

  let detailRedirect = ''
  const detailRuntime = loadPageWithStorage('hexagram-detail', {}, {
    redirectTo({ url }) { detailRedirect = url },
    showToast() {},
    setNavigationBarTitle() {}
  })
  const detail = createPageContext(detailRuntime.definition)
  detail.onLoad({ id: '12' })
  assert.equal(detailRedirect, '/pages/guide/guide?returnTo=hexagram&id=12')
  assert.equal(detail.data.hexagram, null)
})

test('铜钱明显上滑可投掷，小幅或横向滑动不触发', () => {
  const { isUpwardCoinGesture } = require('../miniprogram/utils/gesture.ts')
  assert.equal(
    isUpwardCoinGesture({ x: 100, y: 260, time: 100 }, { x: 106, y: 150, time: 340 }),
    true
  )
  assert.equal(
    isUpwardCoinGesture({ x: 100, y: 260, time: 100 }, { x: 105, y: 215, time: 340 }),
    false
  )
  assert.equal(
    isUpwardCoinGesture({ x: 100, y: 260, time: 100 }, { x: 210, y: 180, time: 340 }),
    false
  )

  const definition = loadPage('casting', {})
  const casting = createPageContext(definition, {
    mode: 'coin',
    started: true,
    spinning: false,
    completed: false,
    castCount: 0
  })
  let tosses = 0
  casting.tossCoin = () => { tosses += 1 }
  casting.coinTouchStart({ touches: [{ clientX: 100, clientY: 260 }], timeStamp: 100 })
  casting.coinTouchEnd({ changedTouches: [{ clientX: 104, clientY: 150 }], timeStamp: 340 })
  casting.tapCoin()
  assert.equal(tosses, 1, '上滑后的合成点击不应重复投掷')

  casting.coinTouchStart({ touches: [{ clientX: 100, clientY: 260 }], timeStamp: 500 })
  casting.coinTouchEnd({ changedTouches: [{ clientX: 210, clientY: 180 }], timeStamp: 740 })
  assert.equal(tosses, 1)
})

test('历史记录详情导航在完成前忽略连续点击', () => {
  let navigations = 0
  const definition = loadPage('history', {
    navigateTo() { navigations += 1 },
    showToast() {}
  })
  const history = createPageContext(definition, { navigating: false })
  const event = { currentTarget: { dataset: { id: 'record-1' } } }
  history.openRecord(event)
  history.openRecord(event)
  assert.equal(navigations, 1)
})
