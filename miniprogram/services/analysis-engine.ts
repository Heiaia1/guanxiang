declare const module: { exports: unknown }
declare function require(path: string): any

type Category = 'career' | 'relationship' | 'social' | 'study' | 'family' | 'self'
type Trigram = 'qian' | 'kun' | 'zhen' | 'xun' | 'kan' | 'li' | 'gen' | 'dui'
type DailyState = 'calm' | 'anxious' | 'hesitant' | 'energetic' | 'energized' | 'tired' | 'change'

interface AnalysisScores {
  action: number
  readiness: number
  clarity: number
  control: number
  risk: number
  relation: number
  pressure: number
  stage: number
}

interface AnalysisInput {
  category: Category
  question: string
  answers: AnalysisScores
}

interface ReadyAnalysis {
  status: 'ready'
  hexagramId: number
  scenarioId: string
  contextSignals: string[]
  name: string
  symbol: string
  keywords: string[]
  traditional: string
  culturalPlain: string
  changingLine: number
  upperTrigram: Trigram
  lowerTrigram: Trigram
  summary: string
  mainConflict: string
  advantage: string
  riskNotice: string
  actions: [string, string, string]
  shareText: string
  disclaimer: string
}

interface BlockedAnalysis {
  status: 'blocked'
  riskCategory: 'medical' | 'legal' | 'investment' | 'lottery' | 'safety' | 'privacy'
  title: string
  message: string
}

type AnalysisResult = ReadyAnalysis | BlockedAnalysis

interface DailyObservation {
  status: 'ready'
  hexagramId: number
  name: string
  symbol: string
  keywords: [string, string, string]
  traditional: string
  culturalPlain: string
  summary: string
  mainConflict: string
  advantage: string
  riskNotice: string
  reflection: string
  action: string
  actions: [string, string, string]
  changingLine: number
  upperTrigram: string
  lowerTrigram: string
  shareText: string
  disclaimer: string
}

interface CoinLine {
  position: number
  coins: [2 | 3, 2 | 3, 2 | 3]
  value: 6 | 7 | 8 | 9
  kind: 'yin' | 'yang'
  changing: boolean
  changedKind: 'yin' | 'yang'
}

interface CoinCasting {
  status: 'ready'
  lines: CoinLine[]
  hexagramId: number
  changedHexagramId: number
  name: string
  changedName: string
  symbol: string
  keywords: string[]
  traditional: string
  culturalPlain: string
  summary: string
  mainConflict: string
  advantage: string
  riskNotice: string
  actions: string[]
  changingLine: number
  shareText: string
  disclaimer: string
  lowerTrigram: Trigram
  upperTrigram: Trigram
}

interface HexagramContent {
  id: number
  name: string
  symbol: string
  keywords: string[]
  traditional: string
  plain: string
  upperTrigram?: string
  lowerTrigram?: string
  advantages?: string[]
  risks?: string[]
  actions?: string[]
}

interface SafetyCategoryContent {
  id: string
  name: string
  severity: 'block' | 'urgent'
  patterns: string[]
  intentPatterns?: string[]
  message: string
}

interface SafetyContent {
  defaultDisclaimer: string
  inputNotice: string
  forbiddenOutputPatterns: string[]
  preferredPhrases: string[]
  categories: SafetyCategoryContent[]
  privacyPatterns: Array<{
    id: string
    pattern: string
    message: string
  }>
}

interface ScenarioRule {
  id: string
  patterns: string[]
  mainConflict: string
  advantage: string
  riskNotice: string
  today: string
  withinSevenDays: string
  reconsider: string
}

interface DomainRuleContent {
  dimensionWeights: Record<keyof AnalysisScores, number>
  conflicts: Record<string, string>
  advantages: string[]
  riskGuidance: string[]
  reconsiderSignals: string[]
}

interface ActionTemplateContent {
  today: string[]
  withinSevenDays: string[]
  reconsider: string[]
}

const HEXAGRAM_CATALOG = require('../data/hexagrams.json') as HexagramContent[]
const SAFETY_CONTENT = require('../data/safety-words.json') as SafetyContent
const SCENARIO_RULES = require('../data/scenario-rules.json') as Record<Category, ScenarioRule[]>
const DOMAIN_RULES = require('../data/domain-rules.json') as Record<Category, DomainRuleContent>
const ACTION_TEMPLATES = require('../data/action-templates.json') as Record<Category | 'universal', ActionTemplateContent>
const DEFAULT_DISCLAIMER = String(SAFETY_CONTENT.defaultDisclaimer || '').trim() ||
  '本内容用于传统文化学习与个人反思，不代表未来必然发生，也不构成专业建议。'
const INPUT_NOTICE = String(SAFETY_CONTENT.inputNotice || '').trim() ||
  '请只描述当前情境，不要填写姓名、证件号码或联系方式。'

function getSafetyInputNotice(): string {
  return INPUT_NOTICE
}

function hexagramName(id: number): string {
  return HEXAGRAM_CATALOG.find((item) => item.id === id)?.name || `第${id}卦`
}

const HEXAGRAM_IDS: Record<string, number> = {
  'qian:qian': 1, 'kun:kun': 2, 'kan:zhen': 3, 'gen:kan': 4,
  'kan:qian': 5, 'qian:kan': 6, 'kun:kan': 7, 'kan:kun': 8,
  'xun:qian': 9, 'qian:dui': 10, 'kun:qian': 11, 'qian:kun': 12,
  'qian:li': 13, 'li:qian': 14, 'kun:gen': 15, 'zhen:kun': 16,
  'dui:zhen': 17, 'gen:xun': 18, 'kun:dui': 19, 'xun:kun': 20,
  'li:zhen': 21, 'gen:li': 22, 'gen:kun': 23, 'kun:zhen': 24,
  'qian:zhen': 25, 'gen:qian': 26, 'gen:zhen': 27, 'dui:xun': 28,
  'kan:kan': 29, 'li:li': 30, 'dui:gen': 31, 'zhen:xun': 32,
  'qian:gen': 33, 'zhen:qian': 34, 'li:kun': 35, 'kun:li': 36,
  'xun:li': 37, 'li:dui': 38, 'kan:gen': 39, 'zhen:kan': 40,
  'gen:dui': 41, 'xun:zhen': 42, 'dui:qian': 43, 'qian:xun': 44,
  'dui:kun': 45, 'kun:xun': 46, 'dui:kan': 47, 'kan:xun': 48,
  'dui:li': 49, 'li:xun': 50, 'zhen:zhen': 51, 'gen:gen': 52,
  'xun:gen': 53, 'zhen:dui': 54, 'zhen:li': 55, 'li:gen': 56,
  'xun:xun': 57, 'dui:dui': 58, 'xun:kan': 59, 'kan:dui': 60,
  'xun:dui': 61, 'zhen:gen': 62, 'kan:li': 63, 'li:kan': 64
}

const DAILY_STATES: Record<Exclude<DailyState, 'energized'>, {
  ids: number[]
  keywords: [string, string, string]
  summary: string
  reflection: string
  action: string
}> = {
  calm: {
    ids: [15, 20, 31, 52, 53, 57, 58, 61, 63],
    keywords: ['观察', '从容', '分辨'],
    summary: '平静让细节更容易被看见，今天适合确认真正重要的方向。',
    reflection: '如果不急着证明什么，你最想保留的是什么？',
    action: '留出十分钟，写下今天最值得专注的一件事。'
  },
  anxious: {
    ids: [4, 5, 6, 29, 39, 47, 59, 60, 64],
    keywords: ['减速', '核实', '留有余地'],
    summary: '紧迫感正在放大未知条件，先把情绪与事实分开放置。',
    reflection: '眼前哪一项担心可以在今天得到事实验证？',
    action: '只选择一个最小未知项，向可靠来源核实一次。'
  },
  hesitant: {
    ids: [3, 8, 10, 12, 17, 33, 38, 44, 53],
    keywords: ['比较', '试探', '设定条件'],
    summary: '犹豫常常意味着两个目标尚未排出优先级，不必强迫自己立刻定论。',
    reflection: '两个选择分别要保护什么，又分别要放弃什么？',
    action: '给两个选择各写一条可验证条件，再做一次小范围尝试。'
  },
  energetic: {
    ids: [1, 14, 16, 21, 25, 34, 35, 42, 43],
    keywords: ['推进', '聚焦', '校准'],
    summary: '行动能量充足，真正的价值在于把力量用在最关键的方向。',
    reflection: '今天哪一步最能验证你的目标，而不只是让你忙碌？',
    action: '先完成一件能够留下可检查结果的关键任务。'
  },
  tired: {
    ids: [2, 7, 23, 24, 27, 36, 41, 46, 52],
    keywords: ['休整', '边界', '恢复'],
    summary: '疲惫会降低判断质量，暂缓不可逆决定也是一种有效行动。',
    reflection: '哪些任务并不需要由今天的你来承担？',
    action: '删减一项非必要任务，并安排一段不被打断的恢复时间。'
  },
  change: {
    ids: [18, 28, 32, 40, 49, 50, 51, 55, 56],
    keywords: ['启动', '试验', '保留退路'],
    summary: '改变的愿望已经出现，先用小实验判断方向是否值得持续投入。',
    reflection: '怎样用最低成本证明这次改变不是一时冲动？',
    action: '今天启动一个可在七天内结束并复盘的小实验。'
  }
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) return 50
  return Math.max(0, Math.min(100, value))
}

function normalize(scores: Partial<AnalysisScores> | null | undefined): AnalysisScores {
  const source = scores || {}
  return {
    action: clamp(Number(source.action)),
    readiness: clamp(Number(source.readiness)),
    clarity: clamp(Number(source.clarity)),
    control: clamp(Number(source.control)),
    risk: clamp(Number(source.risk)),
    relation: clamp(Number(source.relation)),
    pressure: clamp(Number(source.pressure)),
    stage: clamp(Number(source.stage))
  }
}

const MODEL_RANGES: Record<keyof AnalysisScores, [number, number]> = {
  action: [20, 80],
  readiness: [20, 75],
  clarity: [25, 75],
  control: [25, 75],
  risk: [25, 80],
  relation: [25, 60],
  pressure: [30, 80],
  stage: [35, 70]
}

function calibrateScores(scores: AnalysisScores): AnalysisScores {
  const calibrated = {} as AnalysisScores
  for (const key of Object.keys(MODEL_RANGES) as Array<keyof AnalysisScores>) {
    const [minimum, maximum] = MODEL_RANGES[key]
    calibrated[key] = clamp(((scores[key] - minimum) / (maximum - minimum)) * 100)
  }
  return calibrated
}

function chooseTrigram(scores: AnalysisScores, perspective: 'inner' | 'outer', category: Category): Trigram {
  const emphasis = DOMAIN_RULES[category]?.dimensionWeights
  const factor = perspective === 'inner' ? 120 : 175
  const s = { ...scores }
  if (emphasis) {
    for (const key of Object.keys(scores) as Array<keyof AnalysisScores>) {
      s[key] = clamp(scores[key] + ((emphasis[key] || 0.125) - 0.125) * factor)
    }
  }
  const candidates: Array<[Trigram, number]> = perspective === 'inner'
    ? [
        ['qian', s.action * 0.38 + s.readiness * 0.3 + s.control * 0.18 + s.clarity * 0.14],
        ['kun', (100 - s.action) * 0.35 + s.readiness * 0.2 + (100 - s.pressure) * 0.2 + (100 - s.stage) * 0.25],
        ['zhen', s.action * 0.32 + s.stage * 0.3 + s.pressure * 0.22 + (100 - s.readiness) * 0.16],
        ['xun', s.readiness * 0.28 + s.relation * 0.25 + s.control * 0.22 + s.clarity * 0.25],
        ['kan', s.risk * 0.28 + s.pressure * 0.3 + (100 - s.clarity) * 0.25 + (100 - s.control) * 0.17],
        ['li', s.clarity * 0.4 + s.action * 0.2 + s.readiness * 0.2 + (100 - s.pressure) * 0.2],
        ['gen', (100 - s.action) * 0.32 + s.risk * 0.25 + s.pressure * 0.18 + (100 - s.readiness) * 0.25],
        ['dui', s.relation * 0.38 + s.clarity * 0.22 + (100 - s.pressure) * 0.2 + s.readiness * 0.2]
      ]
    : [
        ['qian', s.control * 0.36 + s.clarity * 0.24 + s.readiness * 0.2 + (100 - s.risk) * 0.2],
        ['kun', (100 - s.control) * 0.34 + (100 - s.stage) * 0.24 + s.readiness * 0.2 + (100 - s.pressure) * 0.22],
        ['zhen', s.stage * 0.34 + s.pressure * 0.2 + (100 - s.clarity) * 0.2 + s.action * 0.26],
        ['xun', s.relation * 0.3 + s.readiness * 0.25 + s.control * 0.2 + s.clarity * 0.25],
        ['kan', s.risk * 0.38 + (100 - s.clarity) * 0.27 + (100 - s.control) * 0.2 + s.pressure * 0.15],
        ['li', s.clarity * 0.42 + s.relation * 0.18 + s.stage * 0.2 + s.control * 0.2],
        ['gen', s.risk * 0.3 + (100 - s.control) * 0.22 + (100 - s.action) * 0.2 + s.stage * 0.28],
        ['dui', s.relation * 0.43 + s.clarity * 0.2 + (100 - s.risk) * 0.17 + s.control * 0.2]
      ]

  candidates.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  return candidates[0][0]
}

function changingLine(stage: number, pressure: number): number {
  const blended = clamp(stage * 0.75 + pressure * 0.25)
  return Math.min(6, Math.max(1, Math.floor(blended / (100 / 6)) + 1))
}

function compactSafetyText(value: unknown): string {
  return String(value || '').toLowerCase().replace(
    /[\s\u200b-\u200f\u202a-\u202e\u3000,，.。!！?？、;；:：'"“”‘’（）()【】\[\]{}<>《》_\-—–·•…\/\\|]+/g,
    ''
  )
}

function isDefensiveCyberContext(compact: string): boolean {
  const defensive = /(遭到|遭遇|被).{0,8}(网络攻击|入侵|盗号)|防御|防范|预防|保护|安全教育|识别|应对|修复|加固|检测/.test(compact)
  const harmfulIntent = /(怎么|如何|教我|帮我|我要|我想|准备|尝试).{0,10}(获取|破解|黑进|黑入|盗取|绕过|攻击|入侵|跟踪|监控|定位)/.test(compact)
  return defensive && !harmfulIntent
}

function matchesSafetyPattern(rule: SafetyCategoryContent, pattern: string, compact: string): boolean {
  const normalizedPattern = compactSafetyText(pattern)
  if (!normalizedPattern || !compact.includes(normalizedPattern)) return false

  if (rule.id === 'medical' && normalizedPattern === '诊断') {
    const nonMedicalContext = /项目|系统|代码|故障|流程|业务|运营|性能|设备|延期/.test(compact)
    const healthContext = /身体|健康|疾病|病症|疼|痛|医生|医院|药|手术|检查|报告|心脏|怀孕|肿块|抑郁/.test(compact)
    if (nonMedicalContext && !healthContext) return false
  }

  if (rule.id === 'self_harm' && normalizedPattern === '紫砂') {
    const culturalContext = /紫砂(壶|杯|茶具|器物|器|泥|工艺|文化|陶艺|陶瓷|展览|博物馆)/.test(compact)
    if (culturalContext) return false
  }

  if (rule.id === 'investment' && (normalizedPattern === '买入' || normalizedPattern === '卖出')) {
    const tangibleContext = /设备|物资|原料|商品|库存|办公用品|机器|车辆|软件许可|采购|进货|一批/.test(compact)
    const financialContext = /股票|基金|期货|外汇|虚拟币|加密货币|比特币|证券|涨停|抄底|投资回报/.test(compact)
    if (tangibleContext && !financialContext) return false
  }

  if (rule.id === 'privacy_intrusion' && isDefensiveCyberContext(compact)) return false

  return true
}

function matchesSafetyRule(rule: SafetyCategoryContent, compact: string): boolean {
  if (rule.patterns.some((pattern) => matchesSafetyPattern(rule, pattern, compact))) return true
  if (!Array.isArray(rule.intentPatterns) || isDefensiveCyberContext(compact)) return false

  return rule.intentPatterns.some((source) => {
    try {
      return new RegExp(source, 'i').test(compact)
    } catch (_error) {
      return false
    }
  })
}

function blockRiskQuestion(question: string): BlockedAnalysis | null {
  const source = String(question || '')
  const compact = compactSafetyText(source)
  const emailNormalized = source.replace(/\s+/g, '')
  const categories = SAFETY_CONTENT.categories.slice().sort((a, b) => {
    const rank = { urgent: 0, block: 1 }
    return rank[a.severity] - rank[b.severity]
  })

  for (const rule of categories.filter((item) => item.severity === 'urgent')) {
    if (matchesSafetyRule(rule, compact)) {
      return {
        status: 'blocked',
        riskCategory: 'safety',
        title: `请先处理${rule.name}`,
        message: rule.message
      }
    }
  }

  for (const rule of SAFETY_CONTENT.privacyPatterns) {
    try {
      const pattern = new RegExp(rule.pattern, 'i')
      const normalized = rule.id === 'email' ? emailNormalized : compact
      if (pattern.test(source) || pattern.test(normalized)) {
        return {
          status: 'blocked',
          riskCategory: 'privacy',
          title: '请先删除敏感个人信息',
          message: rule.message
        }
      }
    } catch (_error) {
      // 词库单条正则失效时跳过，不影响其他安全规则。
    }
  }

  for (const rule of categories.filter((item) => item.severity !== 'urgent')) {
    if (matchesSafetyRule(rule, compact)) {
      const mapped = rule.id === 'privacy_intrusion'
        ? 'privacy'
        : ['medical', 'legal', 'investment', 'lottery'].includes(rule.id)
          ? rule.id as BlockedAnalysis['riskCategory']
          : 'safety'
      return {
        status: 'blocked',
        riskCategory: mapped,
        title: `请先处理${rule.name}`,
        message: rule.message
      }
    }
  }

  if (/会不会死|轻生|伤害他人/.test(compact)) {
    const fallback = SAFETY_CONTENT.categories.find((item) => item.id === 'personal_safety')
    return {
      status: 'blocked',
      riskCategory: 'safety',
      title: '请先处理人身安全',
      message: fallback?.message || '请停止本次分析，优先寻求现实中的安全支持和专业帮助。'
    }
  }
  return null
}

function normalizeCategory(value: unknown): Category {
  const category = String(value || '') as Category
  return DOMAIN_RULES[category] ? category : 'self'
}

function selectScenario(category: Category, question: string): ScenarioRule | null {
  const compact = String(question || '').toLowerCase().replace(/\s+/g, '')
  const candidates = (SCENARIO_RULES[category] || []).map((scenario) => {
    const matches = scenario.patterns.filter((pattern) => compact.includes(pattern.toLowerCase().replace(/\s+/g, '')))
    const score = matches.reduce((sum, pattern) => sum + Math.max(1, pattern.length), 0)
    return { scenario, score, matches: matches.length }
  }).filter((candidate) => candidate.matches > 0)

  candidates.sort((a, b) => b.score - a.score || b.matches - a.matches || a.scenario.id.localeCompare(b.scenario.id))
  return candidates[0]?.scenario || null
}

function extractContextSignals(question: string): string[] {
  const source = String(question || '')
  const compact = source.replace(/\s+/g, '')
  const signals: string[] = []

  if (/(还没|还没有|没有|尚未)(找到|拿到|获得)?(下一份工作|下家|offer|录用)/i.test(compact)) {
    signals.push('尚无替代机会')
  }
  const buffer = compact.match(/(?:有|可支持|能支持)?([一二三四五六七八九十\d]+)个?月(?:的)?(?:存款|储蓄|缓冲)/)
  if (buffer?.[1]) signals.push(`已有${buffer[1]}个月资金缓冲`)
  if (/可以再坚持|还能坚持|短期内可以继续/.test(compact)) signals.push('仍有短期验证窗口')
  if (/延期|逾期|晚于计划/.test(compact)) signals.push('进度已偏离原计划')
  if (/客户|甲方|委托方/.test(compact)) signals.push('涉及外部交付沟通')
  if (/回复.*(慢|少)|联系减少|不联系|冷淡/.test(compact)) signals.push('联系频率已经变化')
  if (/已经准备|准备完成|已有作品|已有方案/.test(compact)) signals.push('已具备部分现实准备')
  if (/很多未知|不了解|不清楚|无法判断/.test(compact)) signals.push('关键信息仍不充分')

  return Array.from(new Set(signals)).slice(0, 4)
}

function level(value: number, lowLabel: string, middleLabel: string, highLabel: string): string {
  if (value < 38) return lowLabel
  if (value >= 68) return highLabel
  return middleLabel
}

function buildSituationSummary(scores: AnalysisScores, signals: string[]): string {
  const summary = [
    `行动意愿${level(scores.action, '偏低', '适中', '较强')}`,
    `准备度${level(scores.readiness, '不足', '正在形成', '较充分')}`,
    `信息${level(scores.clarity, '仍模糊', '部分清楚', '较清楚')}`,
    `可控程度${level(scores.control, '有限', '中等', '较高')}`,
    `现实风险${level(scores.risk, '较低', '中等', '较高')}`,
    `关系依赖${level(scores.relation, '较低', '中等', '较高')}`,
    `当前压力${level(scores.pressure, '较低', '可管理', '较强')}`,
    `事情处于${level(scores.stage, '早期', '推进阶段', '关键阶段')}`
  ].join('、')
  const context = signals.length ? ` 已识别的现实条件：${signals.join('、')}。` : ''
  return `${summary}。${context}`
}

function selectDomainConflict(domain: DomainRuleContent, scores: AnalysisScores): string {
  const candidates: Array<[boolean, string]> = [
    [scores.action >= 68 && scores.readiness < 45, 'highActionLowReadiness'],
    [scores.risk >= 65 && scores.clarity < 48, 'highRiskLowClarity'],
    [scores.control < 42 && scores.pressure >= 65, 'lowControlHighPressure'],
    [scores.readiness >= 68 && scores.action < 42, 'highReadinessLowAction'],
    [scores.pressure >= 65 && scores.clarity < 48, 'highPressureLowClarity'],
    [scores.relation >= 68 && scores.control < 48, 'highRelationLowControl'],
    [scores.action >= 68 && scores.pressure >= 68, 'highActionHighPressure'],
    [scores.action < 42 && scores.relation >= 65, 'lowActionHighRelation'],
    [scores.relation >= 68 && scores.clarity < 48, 'highRelationLowClarity'],
    [scores.pressure >= 68 && scores.action >= 68, 'highPressureHighAction'],
    [scores.control < 42 && scores.relation >= 65, 'lowControlHighRelation'],
    [scores.risk >= 65 && scores.readiness < 45, 'highRiskLowReadiness'],
    [scores.action >= 68 && scores.clarity < 48, 'highActionLowClarity'],
    [scores.pressure >= 68 && scores.readiness < 45, 'highPressureLowReadiness'],
    [scores.action < 42 && scores.clarity >= 68, 'lowActionHighClarity']
  ]
  for (const [matches, key] of candidates) {
    if (matches && domain.conflicts[key]) return domain.conflicts[key]
  }
  return domain.conflicts.default || '当前需要先确认事实、资源和可以验证的下一步。'
}

function selectText(items: string[] | undefined, seed: string, fallback: string): string {
  if (!Array.isArray(items) || items.length === 0) return fallback
  return items[stableIndex(seed, items.length)]
}

function guardReadyOutput<T>(value: T): T {
  const forbidden = Array.isArray(SAFETY_CONTENT.forbiddenOutputPatterns)
    ? SAFETY_CONTENT.forbiddenOutputPatterns.map((item) => String(item || '').trim()).filter(Boolean)
    : []
  const preferred = Array.isArray(SAFETY_CONTENT.preferredPhrases)
    ? SAFETY_CONTENT.preferredPhrases
        .map((item) => String(item || '').trim())
        .find((item) => item && !forbidden.some((word) => item.includes(word)))
    : ''
  const replacement = preferred || '建议先核实现实信息'

  const visit = (current: unknown): unknown => {
    if (typeof current === 'string') {
      return forbidden.reduce(
        (text, word) => text.includes(word) ? text.split(word).join(replacement) : text,
        current
      )
    }
    if (Array.isArray(current)) return current.map(visit)
    if (current && typeof current === 'object') {
      return Object.fromEntries(
        Object.entries(current as Record<string, unknown>).map(([key, item]) => [key, visit(item)])
      )
    }
    return current
  }

  return visit(value) as T
}

function analyzeSituation(input: AnalysisInput): AnalysisResult {
  const blocked = blockRiskQuestion(input.question)
  if (blocked) return blocked

  const category = normalizeCategory(input.category)
  const question = String(input.question || '')
  const scores = calibrateScores(normalize(input.answers))
  const lowerTrigram = chooseTrigram(scores, 'inner', category)
  const upperTrigram = chooseTrigram(scores, 'outer', category)
  const hexagramId = HEXAGRAM_IDS[`${upperTrigram}:${lowerTrigram}`]
  const content = HEXAGRAM_CATALOG.find((item) => item.id === hexagramId) || {
    id: hexagramId,
    name: hexagramName(hexagramId),
    symbol: '',
    keywords: ['观察', '验证', '行动'],
    traditional: '',
    plain: '先理解当前条件，再选择一个可验证的现实行动。'
  }
  const domain = DOMAIN_RULES[category]
  const templates = ACTION_TEMPLATES[category] || ACTION_TEMPLATES.universal
  const scenario = selectScenario(category, question)
  const contextSignals = extractContextSignals(question)
  const seed = `${category}:${question}:${hexagramId}:${Math.round(scores.action / 10)}:${Math.round(scores.risk / 10)}`
  const summary = buildSituationSummary(scores, contextSignals)
  const mainConflict = scenario?.mainConflict || selectDomainConflict(domain, scores)
  const advantage = scenario?.advantage || selectText(
    domain.advantages,
    `${seed}:advantage`,
    content.advantages?.[0] || '你仍然可以从一个可控的小步骤开始。'
  )
  const riskNotice = scenario?.riskNotice || selectText(
    domain.riskGuidance,
    `${seed}:risk`,
    content.risks?.[0] || '不要把单次信号当成最终结论。'
  )
  const actions: [string, string, string] = scenario
    ? [scenario.today, scenario.withinSevenDays, scenario.reconsider]
    : [
        selectText(templates.today, `${seed}:today`, '今天确认一个最关键的未知事实。'),
        selectText(templates.withinSevenDays, `${seed}:week`, '七天内完成一次低成本的现实验证。'),
        `${selectText(templates.reconsider, `${seed}:reconsider`, '出现新的可验证事实时')}，根据新信息重新判断。`
      ]

  return guardReadyOutput<ReadyAnalysis>({
    status: 'ready',
    hexagramId,
    scenarioId: scenario?.id || 'general',
    contextSignals,
    name: content.name,
    symbol: content.symbol,
    keywords: content.keywords.slice(0, 3),
    traditional: content.traditional,
    culturalPlain: content.plain,
    changingLine: changingLine(scores.stage, scores.pressure),
    upperTrigram,
    lowerTrigram,
    summary,
    mainConflict,
    advantage,
    riskNotice,
    actions,
    shareText: '借古人的象，看见当下的条件；先验证，再决定。',
    disclaimer: DEFAULT_DISCLAIMER
  })
}

function stableIndex(text: string, length: number): number {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % length
}

function seededRandom(seed: string): () => number {
  let state = stableIndex(seed, 2147483646) + 1
  return () => {
    state = Math.imul(state, 48271) % 2147483647
    if (state <= 0) state += 2147483646
    return (state - 1) / 2147483646
  }
}

function bitsToTrigram(bits: number[]): Trigram {
  const lookup: Record<string, Trigram> = {
    '111': 'qian',
    '110': 'dui',
    '101': 'li',
    '100': 'zhen',
    '011': 'xun',
    '010': 'kan',
    '001': 'gen',
    '000': 'kun'
  }
  return lookup[bits.join('')] || 'kun'
}

function castTraditionalCoins(seed?: string | number): CoinCasting {
  const actualSeed = seed === undefined
    ? `${Date.now()}:${Math.random()}`
    : String(seed)
  const random = seededRandom(actualSeed)
  const lines: CoinLine[] = []

  for (let position = 1; position <= 6; position += 1) {
    const coins = [0, 0, 0].map(() => random() >= 0.5 ? 3 : 2) as [2 | 3, 2 | 3, 2 | 3]
    const value = (coins[0] + coins[1] + coins[2]) as 6 | 7 | 8 | 9
    const kind: 'yin' | 'yang' = value % 2 === 0 ? 'yin' : 'yang'
    const changing = value === 6 || value === 9
    lines.push({
      position,
      coins,
      value,
      kind,
      changing,
      changedKind: changing ? (kind === 'yin' ? 'yang' : 'yin') : kind
    })
  }

  const currentBits = lines.map((line) => line.kind === 'yang' ? 1 : 0)
  const changedBits = lines.map((line) => line.changedKind === 'yang' ? 1 : 0)
  const lowerTrigram = bitsToTrigram(currentBits.slice(0, 3))
  const upperTrigram = bitsToTrigram(currentBits.slice(3, 6))
  const changedLower = bitsToTrigram(changedBits.slice(0, 3))
  const changedUpper = bitsToTrigram(changedBits.slice(3, 6))
  const hexagramId = HEXAGRAM_IDS[`${upperTrigram}:${lowerTrigram}`]
  const changedHexagramId = HEXAGRAM_IDS[`${changedUpper}:${changedLower}`]
  const content = HEXAGRAM_CATALOG.find((item) => item.id === hexagramId) || {
    id: hexagramId,
    name: hexagramName(hexagramId),
    symbol: '',
    keywords: ['观察', '验证', '行动'],
    traditional: '',
    plain: '把结果作为整理思路的起点，并用现实信息继续验证。',
    advantages: ['愿意停下来观察当前条件'],
    risks: ['把随机结果误当成确定结论'],
    actions: ['写下一个最需要验证的事实', '完成一次低成本验证', '根据新事实再做决定']
  }
  const changingPositions = lines.filter((line) => line.changing).map((line) => line.position)

  return guardReadyOutput<CoinCasting>({
    status: 'ready',
    lines,
    hexagramId,
    changedHexagramId,
    name: content.name,
    changedName: hexagramName(changedHexagramId),
    symbol: content.symbol,
    keywords: content.keywords.slice(0, 3),
    traditional: content.traditional,
    culturalPlain: content.plain,
    summary: content.plain,
    mainConflict: '铜钱互动保留传统体验中的随机性，结果更适合用来提出问题，而不是替你作决定。',
    advantage: content.advantages?.[0] || '你愿意暂时停下来，从另一个角度观察当前条件。',
    riskNotice: content.risks?.[0] || '不要为了得到更喜欢的结果而对同一问题连续重复生成。',
    actions: (content.actions || [
      '写下一个最需要验证的事实',
      '完成一次低成本验证',
      '根据新事实再做决定'
    ]).slice(0, 3),
    changingLine: changingPositions[0] || 0,
    shareText: `观象录 · ${content.name}：先观察条件，再完成一个现实行动。`,
    disclaimer: DEFAULT_DISCLAIMER,
    lowerTrigram,
    upperTrigram
  })
}

function buildDailyObservation(state: DailyState, dateKey: string): DailyObservation {
  const aliasedState = state === 'energized' ? 'energetic' : state
  const normalizedState: Exclude<DailyState, 'energized'> = DAILY_STATES[aliasedState as Exclude<DailyState, 'energized'>]
    ? aliasedState as Exclude<DailyState, 'energized'>
    : 'calm'
  const config = DAILY_STATES[normalizedState]
  const hexagramId = config.ids[stableIndex(`${normalizedState}:${dateKey}`, config.ids.length)]
  const content = HEXAGRAM_CATALOG.find((item) => item.id === hexagramId) || {
    id: hexagramId,
    name: hexagramName(hexagramId),
    symbol: '',
    keywords: config.keywords,
    traditional: '',
    plain: config.summary,
    upperTrigram: '乾',
    lowerTrigram: '乾',
    advantages: ['你愿意停下来观察自己的状态'],
    risks: ['把一时情绪解释成确定结果'],
    actions: [config.action, '七天内回看一次实际变化', '根据新事实调整下一步']
  }
  const actions: [string, string, string] = [
    config.action,
    content.actions?.[1] || '七天内回看一次实际变化，并记录一个事实。',
    '当出现新的事实而不只是新的情绪时，再调整下一步。'
  ]

  return guardReadyOutput<DailyObservation>({
    status: 'ready',
    hexagramId,
    name: content.name,
    symbol: content.symbol,
    keywords: config.keywords,
    traditional: content.traditional,
    culturalPlain: content.plain,
    summary: config.summary,
    mainConflict: '今天不需要预测结果，重点是分辨当前状态正在放大或忽略哪些条件。',
    advantage: content.advantages?.[0] || '你愿意为自己留出观察和整理的时间。',
    riskNotice: content.risks?.[0] || '不要把一天的情绪状态解释成长期结论。',
    reflection: config.reflection,
    action: config.action,
    actions,
    changingLine: stableIndex(`${dateKey}:${normalizedState}:line`, 6) + 1,
    upperTrigram: content.upperTrigram || '乾',
    lowerTrigram: content.lowerTrigram || '乾',
    shareText: '今日观象：看清一个条件，完成一个行动。',
    disclaimer: DEFAULT_DISCLAIMER
  })
}

module.exports = {
  analyzeSituation,
  buildDailyObservation,
  castTraditionalCoins,
  getSafetyInputNotice
}
