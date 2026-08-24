const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const root = path.resolve(__dirname, '..')
const desktopRoot = path.join(root, 'desktop')

function read(name) {
  return fs.readFileSync(path.join(desktopRoot, name), 'utf8')
}

test('桌面版包含可直接打开的完整离线入口和主要功能导航', () => {
  for (const file of ['index.html', 'styles.css', 'app.js', 'core.js']) {
    assert.ok(fs.existsSync(path.join(desktopRoot, file)), `缺少 desktop/${file}`)
  }

  const html = read('index.html')
  for (const route of ['home', 'daily', 'ask', 'library', 'wisdom', 'history', 'settings']) {
    assert.match(html, new RegExp(`data-route=["']${route}["']`), `桌面版缺少 ${route} 入口`)
  }
  assert.match(html, /Content-Security-Policy/)
  assert.match(html, /core\.js/)
  assert.match(html, /app\.js/)

  const sources = [html, read('styles.css'), read('app.js')].join('\n')
  assert.doesNotThrow(() => new vm.Script(read('app.js'), { filename: 'desktop/app.js' }))
  assert.doesNotMatch(sources, /https?:\/\//i)
  assert.doesNotMatch(sources, /\b(TODO|FIXME|HACK)\b|稍后实现|这里补充|占位符/i)
})

test('桌面版共享小程序的评估、分析、卦象和札记核心', () => {
  const context = { window: {} }
  vm.createContext(context)
  vm.runInContext(read('core.js'), context, { filename: 'desktop/core.js' })
  const core = context.window.GX_CORE

  assert.ok(core)
  assert.equal(core.assessment.getAssessmentQuestions().length, 5)
  assert.equal(core.hexagrams.getAllHexagrams().length, 64)
  assert.equal(core.wisdom.getAllWisdomNotes().length, 24)
  assert.equal(Object.keys(core.domains).length, 6)
  assert.equal(core.legalDocuments.documents.length, 2)

  const selections = Object.fromEntries(
    core.assessment.getAssessmentQuestions().map((question) => [question.id, question.options[0].id])
  )
  const scored = core.assessment.scoreAssessment(selections)
  assert.equal(scored.status, 'complete')
  const result = core.analysis.analyzeSituation({
    category: 'career',
    question: '我想先确认现实条件再决定',
    answers: scored.scores
  })
  assert.equal(result.status, 'ready')
  assert.ok(result.actions.length >= 3)
})

test('Windows 启动器以独立应用窗口打开桌面版且不弹命令行', () => {
  const launcher = fs.readFileSync(path.join(root, '打开观象录桌面版.vbs'), 'utf8')
  assert.match(launcher, /desktop\\index\.html/i)
  assert.match(launcher, /--app=/i)
  assert.match(launcher, /Utf8UrlEncode/)
  assert.doesNotMatch(launcher, /cmd\.exe|powershell/i)
  assert.ok([...launcher].every((character) => character.charCodeAt(0) <= 127), 'VBS 正文必须保持纯 ASCII，避免 Windows Script Host 中文编码错误')
})
