import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve(import.meta.dirname, '..')
const miniRoot = path.join(root, 'miniprogram')
const issues = []
const metrics = {}

function fail(message) {
  issues.push(message)
}

function relative(file) {
  return path.relative(root, file).replaceAll('\\', '/')
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8')
  } catch (error) {
    fail(`${relative(file)} 无法读取：${error.message}`)
    return ''
  }
}

function readJson(file) {
  const text = readText(file)
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch (error) {
    fail(`${relative(file)} JSON 无效：${error.message}`)
    return null
  }
}

function allFiles(directory) {
  if (!fs.existsSync(directory)) return []
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name)
    return entry.isDirectory() ? allFiles(full) : [full]
  })
}

function exists(file, message) {
  if (!fs.existsSync(file)) fail(message || `${relative(file)} 不存在`)
}

const projectConfig = readJson(path.join(root, 'project.config.json'))
if (projectConfig) {
  if (projectConfig.miniprogramRoot !== 'miniprogram/') {
    fail('project.config.json 的 miniprogramRoot 必须指向 miniprogram/')
  }
  if (!projectConfig.appid) fail('project.config.json 缺少 appid')
  if (projectConfig.appid === 'touristappid') {
    fail('最新版微信开发者工具已拒绝 touristappid，请使用测试 AppID 或真实 AppID')
  }
  const ignoredFolders = new Set(
    (projectConfig.packOptions?.ignore || [])
      .filter((item) => item?.type === 'folder')
      .map((item) => item.value)
  )
  for (const folder of ['.cache', '.devtools-profile-2', '.devtools-profile-3', '.devtools-profile-4', '.devtools-profile-5', '微信web开发者工具', 'node_modules', 'desktop']) {
    if (!ignoredFolders.has(folder)) fail(`project.config.json 必须忽略开发环境目录 ${folder}`)
  }
  const launchConditions = projectConfig.condition?.miniprogram?.list
  if (!Array.isArray(launchConditions) || !launchConditions.some((item) =>
    item?.pathName === 'pages/launch/launch' && item?.query === ''
  )) {
    fail('project.config.json 必须保留固定启动页编译模式')
  }
}

const desktopRoot = path.join(root, 'desktop')
for (const file of ['index.html', 'styles.css', 'app.js', 'core.js']) {
  exists(path.join(desktopRoot, file), `desktop/${file} 缺失`)
}
exists(path.join(root, '打开观象录桌面版.vbs'), 'Windows 桌面版启动器缺失')
const desktopIndex = readText(path.join(desktopRoot, 'index.html'))
const desktopApp = readText(path.join(desktopRoot, 'app.js'))
const desktopStyles = readText(path.join(desktopRoot, 'styles.css'))
const desktopCore = readText(path.join(desktopRoot, 'core.js'))
if (!desktopIndex.includes('Content-Security-Policy')) fail('桌面版缺少内容安全策略')
if (!desktopCore.includes('global.GX_CORE')) fail('桌面共享核心尚未生成')
for (const route of ['home', 'daily', 'ask', 'library', 'wisdom', 'history', 'settings']) {
  if (!desktopIndex.includes(`data-route="${route}"`)) fail(`桌面版缺少 ${route} 导航入口`)
}
for (const [file, content] of [
  ['desktop/index.html', desktopIndex],
  ['desktop/styles.css', desktopStyles],
  ['desktop/app.js', desktopApp]
]) {
  if (/https?:\/\//i.test(content)) fail(`${file} 引用了远程资源，桌面版必须离线运行`)
}
metrics.desktopFiles = allFiles(desktopRoot).length
metrics.desktopBytes = allFiles(desktopRoot).reduce((sum, file) => sum + fs.statSync(file).size, 0)

const appConfig = readJson(path.join(miniRoot, 'app.json'))
const expectedPages = [
  'pages/launch/launch',
  'pages/guide/guide',
  'pages/home/home',
  'pages/category/category',
  'pages/question/question',
  'pages/assessment/assessment',
  'pages/casting/casting',
  'pages/result/result',
  'pages/wisdom/wisdom',
  'pages/library/library',
  'pages/hexagram-detail/hexagram-detail',
  'pages/history/history',
  'pages/settings/settings'
]

if (appConfig) {
  const configured = Array.isArray(appConfig.pages) ? appConfig.pages : []
  if (configured[0] !== 'pages/launch/launch') {
    fail('app.json 第一页必须是稳定可见的启动页')
  }
  for (const page of expectedPages) {
    if (!configured.includes(page)) fail(`app.json 未注册页面 ${page}`)
    for (const extension of ['ts', 'json', 'wxml', 'wxss']) {
      exists(path.join(miniRoot, `${page}.${extension}`), `${page}.${extension} 缺失`)
    }
  }
  const duplicates = configured.filter((page, index) => configured.indexOf(page) !== index)
  if (duplicates.length) fail(`app.json 存在重复页面：${duplicates.join(', ')}`)
  metrics.pages = configured.length
}

const jsonFiles = allFiles(miniRoot).filter((file) => file.endsWith('.json'))
for (const file of jsonFiles) readJson(file)

const hexagrams = readJson(path.join(miniRoot, 'data', 'hexagrams.json'))
if (Array.isArray(hexagrams)) {
  metrics.hexagrams = hexagrams.length
  if (hexagrams.length !== 64) fail(`hexagrams.json 应为 64 条，实际 ${hexagrams.length}`)
  const ids = hexagrams.map((item) => item.id)
  const expectedIds = Array.from({ length: 64 }, (_, index) => index + 1)
  if (JSON.stringify(ids) !== JSON.stringify(expectedIds)) {
    fail('hexagrams.json 必须按 1-64 文王卦序排列')
  }
  const combinations = new Set()
  const runtimeForbidden = [
    '血光之灾', '寿命将尽', '花钱消灾', '改命成功', '保证发财',
    '百分之百准确', '付费转运', '必定离婚', '一定出轨'
  ]

  for (const item of hexagrams) {
    const prefix = `第 ${item.id} 卦`
    for (const field of ['name', 'pinyin', 'symbol', 'upperTrigram', 'lowerTrigram', 'summary', 'traditional', 'plain']) {
      if (typeof item[field] !== 'string' || !item[field].trim()) {
        fail(`${prefix} 缺少 ${field}`)
      }
    }
    for (const [field, length] of [['keywords', 3], ['advantages', 2], ['risks', 2], ['actions', 3]]) {
      if (!Array.isArray(item[field]) || item[field].length < length || item[field].some((text) => typeof text !== 'string' || !text.trim())) {
        fail(`${prefix} 的 ${field} 至少需要 ${length} 条完整文本`)
      }
    }
    if (!Array.isArray(item.lines) || item.lines.length !== 6) {
      fail(`${prefix} 缺少完整六爻内容`)
    } else {
      item.lines.forEach((line, index) => {
        if (line.position !== index + 1 || !line.label || !line.traditional || !line.plain) {
          fail(`${prefix} 第 ${index + 1} 爻字段不完整`)
        }
      })
    }
    combinations.add(`${item.upperTrigram}:${item.lowerTrigram}`)
    const rendered = JSON.stringify({
      summary: item.summary,
      plain: item.plain,
      advantages: item.advantages,
      risks: item.risks,
      actions: item.actions,
      lines: item.lines
    })
    for (const word of runtimeForbidden) {
      if (rendered.includes(word)) fail(`${prefix} 可展示内容含禁用表达“${word}”`)
    }
  }
  if (combinations.size !== 64) fail(`上下卦组合应覆盖 64 种，实际 ${combinations.size}`)
} else {
  fail('hexagrams.json 必须是数组')
}

const trigrams = readJson(path.join(miniRoot, 'data', 'trigrams.json'))
if (!Array.isArray(trigrams) || trigrams.length !== 8) {
  fail('trigrams.json 必须包含八卦')
} else {
  metrics.trigrams = trigrams.length
}

const scoreKeys = ['action', 'clarity', 'control', 'risk', 'relation', 'pressure', 'stage', 'readiness']
const questions = readJson(path.join(miniRoot, 'data', 'questions.json'))
if (!Array.isArray(questions) || questions.length !== 5) {
  fail('questions.json 必须包含五道评估题')
} else {
  metrics.questions = questions.length
  metrics.assessmentCombinations = questions.reduce(
    (total, question) => total * (Array.isArray(question.options) ? question.options.length : 0),
    1
  )
  const ids = new Set()
  for (const question of questions) {
    if (!question.id || ids.has(question.id)) fail('questions.json 的题目 id 必须非空且唯一')
    ids.add(question.id)
    if (!Array.isArray(question.options) || question.options.length < 6) {
      fail(`评估题 ${question.id} 至少需要六个选项`)
      continue
    }
    if (question.options.some((option) =>
      typeof option.id !== 'string' || !option.id.trim() ||
      typeof option.label !== 'string' || !option.label.trim()
    )) {
      fail(`评估题 ${question.id} 存在空的选项 id 或文案`)
    }
    const optionIds = new Set(question.options.map((option) => option.id))
    const optionLabels = new Set(question.options.map((option) => option.label))
    if (optionIds.size !== question.options.length || optionLabels.size !== question.options.length) {
      fail(`评估题 ${question.id} 的选项 id 和文案必须唯一`)
    }
    for (const option of question.options) {
      for (const key of scoreKeys) {
        const score = option.scores?.[key]
        if (!Number.isFinite(score) || score < 0 || score > 100) {
          fail(`评估题 ${question.id} 选项 ${option.id} 的 ${key} 分值无效`)
        }
      }
    }
  }
}

const domains = readJson(path.join(miniRoot, 'data', 'domain-rules.json'))
const domainIds = ['career', 'relationship', 'social', 'study', 'family', 'self']
if (!domains || typeof domains !== 'object') {
  fail('domain-rules.json 必须是领域数组或以领域 id 为键的对象')
} else {
  const domainList = Array.isArray(domains) ? domains : Object.values(domains)
  const actual = domainList.map((item) => item.id)
  for (const id of domainIds) {
    if (!actual.includes(id)) fail(`domain-rules.json 缺少 ${id}`)
  }
  metrics.domains = actual.length
}

const safety = readJson(path.join(miniRoot, 'data', 'safety-words.json'))
if (!safety || (typeof safety !== 'object')) {
  fail('safety-words.json 结构无效')
} else {
  const safetyIds = Array.isArray(safety.categories) ? safety.categories.map((item) => item.id) : []
  for (const id of ['medical', 'legal', 'investment', 'lottery', 'self_harm', 'personal_safety']) {
    if (!safetyIds.includes(id)) fail(`safety-words.json 缺少 ${id}`)
  }
  if (!Array.isArray(safety.privacyPatterns) || safety.privacyPatterns.length < 3) {
    fail('safety-words.json 缺少手机号、证件号和邮箱隐私规则')
  }
}

const scenarios = readJson(path.join(miniRoot, 'data', 'scenario-rules.json'))
if (!scenarios || typeof scenarios !== 'object') {
  fail('scenario-rules.json 结构无效')
} else {
  let scenarioCount = 0
  for (const domainId of domainIds) {
    const entries = scenarios[domainId]
    if (!Array.isArray(entries) || entries.length < 4) {
      fail(`scenario-rules.json 的 ${domainId} 至少需要 4 个现实子场景`)
      continue
    }
    scenarioCount += entries.length
    for (const entry of entries) {
      for (const field of ['id', 'mainConflict', 'advantage', 'riskNotice', 'today', 'withinSevenDays', 'reconsider']) {
        if (typeof entry[field] !== 'string' || !entry[field].trim()) {
          fail(`scenario-rules.json ${domainId}/${entry.id || 'unknown'} 缺少 ${field}`)
        }
      }
      if (!Array.isArray(entry.patterns) || entry.patterns.length < 2) {
        fail(`scenario-rules.json ${domainId}/${entry.id || 'unknown'} 缺少匹配词`)
      }
    }
  }
  metrics.scenarios = scenarioCount
}

const wisdomNotes = readJson(path.join(miniRoot, 'data', 'wisdom-notes.json'))
const wisdomCategories = ['decision', 'work', 'relationship', 'study', 'family', 'self']
if (!Array.isArray(wisdomNotes) || wisdomNotes.length < 24) {
  fail('wisdom-notes.json 至少需要 24 篇札记')
} else {
  metrics.wisdomNotes = wisdomNotes.length
  const ids = new Set()
  const categories = new Set()
  for (const note of wisdomNotes) {
    if (!note.id || ids.has(note.id)) fail(`wisdom-notes.json 存在重复或空 id：${note.id || 'unknown'}`)
    ids.add(note.id)
    categories.add(note.category)
    for (const field of ['categoryLabel', 'title', 'source', 'principle', 'interpretation', 'reflection', 'action']) {
      if (typeof note[field] !== 'string' || !note[field].trim()) {
        fail(`wisdom-notes.json ${note.id || 'unknown'} 缺少 ${field}`)
      }
    }
  }
  for (const category of wisdomCategories) {
    if (!categories.has(category)) fail(`wisdom-notes.json 缺少 ${category} 分类`)
  }
}

const actionTemplates = readJson(path.join(miniRoot, 'data', 'action-templates.json'))
if (!actionTemplates || typeof actionTemplates !== 'object') {
  fail('action-templates.json 结构无效')
} else {
  for (const domainId of [...domainIds, 'universal']) {
    const template = actionTemplates[domainId]
    for (const field of ['today', 'withinSevenDays', 'reconsider']) {
      if (!Array.isArray(template?.[field]) || template[field].length < 3) {
        fail(`action-templates.json ${domainId}.${field} 至少需要 3 条`)
      }
    }
  }
}

const legalContent = readJson(path.join(miniRoot, 'data', 'legal-documents.json'))
if (!legalContent || !Array.isArray(legalContent.documents)) {
  fail('legal-documents.json 必须包含 documents 数组')
} else {
  const requiredDocuments = {
    privacy: {
      minSections: 13,
      minCharacters: 3000,
      requiredTitles: ['说明与适用范围', '用户的选择与权利', '未成年人', '高风险内容', '联系与投诉']
    },
    agreement: {
      minSections: 15,
      minCharacters: 2500,
      requiredTitles: ['协议说明', '服务性质', '使用规则', '本地数据', '责任边界', '法律适用与争议处理']
    }
  }
  const ids = new Set()
  for (const document of legalContent.documents) {
    if (!document?.id || ids.has(document.id)) {
      fail('legal-documents.json 的文档 id 必须非空且唯一')
      continue
    }
    ids.add(document.id)
    for (const field of ['title', 'summary', 'documentVersion', 'publishedDate', 'effectiveDate', 'appliesTo']) {
      if (typeof document[field] !== 'string' || !document[field].trim()) {
        fail(`legal-documents.json ${document.id} 缺少 ${field}`)
      }
    }
    if (!Array.isArray(document.sections)) {
      fail(`legal-documents.json ${document.id} 缺少 sections`)
      continue
    }
    const expectation = requiredDocuments[document.id]
    if (!expectation) fail(`legal-documents.json 含未知文档 ${document.id}`)
    if (expectation && document.sections.length < expectation.minSections) {
      fail(`legal-documents.json ${document.id} 至少需要 ${expectation.minSections} 节完整内容`)
    }
    const sectionTitles = []
    const renderedText = []
    for (const section of document.sections) {
      if (typeof section?.title !== 'string' || !section.title.trim()) {
        fail(`legal-documents.json ${document.id} 存在无标题章节`)
        continue
      }
      sectionTitles.push(section.title)
      renderedText.push(section.title)
      for (const field of ['paragraphs', 'bullets']) {
        if (!Array.isArray(section[field])) {
          fail(`legal-documents.json ${document.id}/${section.title} 的 ${field} 必须是数组`)
          continue
        }
        if (section[field].some((text) => typeof text !== 'string' || !text.trim())) {
          fail(`legal-documents.json ${document.id}/${section.title} 的 ${field} 含空文本`)
        }
        renderedText.push(...section[field])
      }
      if ((section.paragraphs?.length || 0) + (section.bullets?.length || 0) === 0) {
        fail(`legal-documents.json ${document.id}/${section.title} 没有正文`)
      }
    }
    if (expectation) {
      const fullText = renderedText.join('')
      if (fullText.length < expectation.minCharacters) {
        fail(`legal-documents.json ${document.id} 正文过短：${fullText.length} 字符`)
      }
      for (const title of expectation.requiredTitles) {
        if (!sectionTitles.some((item) => item.includes(title))) {
          fail(`legal-documents.json ${document.id} 缺少“${title}”章节`)
        }
      }
    }
  }
  for (const id of Object.keys(requiredDocuments)) {
    if (!ids.has(id)) fail(`legal-documents.json 缺少 ${id}`)
  }
  metrics.legalDocuments = legalContent.documents.length
}

for (const file of allFiles(miniRoot).filter((item) => item.endsWith('.json'))) {
  const config = readJson(file)
  if (!config || !config.usingComponents || typeof config.usingComponents !== 'object') continue
  for (const [name, componentPath] of Object.entries(config.usingComponents)) {
    if (typeof componentPath !== 'string') {
      fail(`${relative(file)} 的组件 ${name} 路径无效`)
      continue
    }
    const base = componentPath.startsWith('/')
      ? path.join(miniRoot, componentPath)
      : path.resolve(path.dirname(file), componentPath)
    for (const extension of ['ts', 'json', 'wxml', 'wxss']) {
      exists(`${base}.${extension}`, `${relative(file)} 引用的组件 ${name}.${extension} 不存在`)
    }
  }
}

const sourceFiles = allFiles(miniRoot).filter((file) => /\.(ts|wxml|wxss)$/.test(file))
const runtimeSource = sourceFiles.filter((file) => file.endsWith('.ts')).map(readText).join('\n')
for (const dataName of [
  'hexagrams',
  'trigrams',
  'questions',
  'domain-rules',
  'action-templates',
  'safety-words',
  'scenario-rules',
  'legal-documents',
  'wisdom-notes'
]) {
  exists(
    path.join(miniRoot, 'data', `${dataName}-data.js`),
    `${dataName}-data.js 运行时数据模块不存在`
  )
  if (!runtimeSource.includes(`data/${dataName}-data`)) {
    fail(`${dataName}.json 对应的运行时数据模块没有被代码读取`)
  }
}
if (/require\([^\n)]*\.json["']?\)/.test(runtimeSource)) {
  fail('运行时代码不能直接 require JSON；微信开发者工具不会把 JSON 注册为 JS 模块')
}
for (const file of sourceFiles) {
  const text = readText(file)
  if (/\b(TODO|FIXME|HACK)\b|稍后实现|这里补充|占位符/i.test(text)) {
    fail(`${relative(file)} 含未完成标记`)
  }
  if (/https?:\/\//i.test(text)) {
    fail(`${relative(file)} 引用了远程资源，第一版必须离线运行`)
  }
  if (file.endsWith('.ts')) {
    const navigationMatches = text.matchAll(/url\s*:\s*['"](?<url>\/pages\/[^?'"]+)/g)
    for (const match of navigationMatches) {
      const target = match.groups?.url?.slice(1)
      if (target && !expectedPages.includes(target)) {
        fail(`${relative(file)} 导航到未注册页面 /${target}`)
      }
    }
  }
}

for (const forbiddenFolder of ['cloudfunctions', 'server', 'admin', 'database']) {
  if (fs.existsSync(path.join(root, forbiddenFolder))) {
    fail(`第一版本地方案不应包含 ${forbiddenFolder}/`)
  }
}

metrics.runtimeFiles = allFiles(miniRoot).length
metrics.runtimeBytes = allFiles(miniRoot).reduce((sum, file) => sum + fs.statSync(file).size, 0)
if (metrics.runtimeBytes > 2 * 1024 * 1024) {
  fail(`miniprogram 主包源码已超过 2 MiB：${metrics.runtimeBytes} 字节`)
}

if (issues.length) {
  console.error(`项目校验失败（${issues.length} 项）：`)
  issues.forEach((issue, index) => console.error(`${index + 1}. ${issue}`))
  process.exit(1)
}

console.log('项目校验通过')
console.log(JSON.stringify(metrics, null, 2))
