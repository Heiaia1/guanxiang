const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const {
  analyzeSituation,
  buildDailyObservation,
  castTraditionalCoins,
  getSafetyInputNotice
} = require('../miniprogram/services/analysis-engine.ts')
const { getHexagramById } = require('../miniprogram/services/hexagram-engine.ts')
const safetyData = require('../miniprogram/data/safety-words.json')
const domainData = require('../miniprogram/data/domain-rules.json')
const actionData = require('../miniprogram/data/action-templates.json')

const ACCEPTANCE_CASES = fs.readFileSync(
  path.join(__dirname, '..', 'docs', 'test-cases.md'),
  'utf8'
)

function parseAcceptanceCases() {
  const ordinaryCategories = {
    CAR: 'career',
    REL: 'relationship',
    SOC: 'social',
    STU: 'study',
    FAM: 'family',
    SEL: 'self'
  }
  const ordinary = []
  const blocked = []

  for (const line of ACCEPTANCE_CASES.split(/\r?\n/)) {
    const cells = line.split('|').map((cell) => cell.trim())
    const id = cells[1] || ''
    const ordinaryMatch = id.match(/^(CAR|REL|SOC|STU|FAM|SEL)-\d{2}$/)
    if (ordinaryMatch) {
      ordinary.push({ id, category: ordinaryCategories[ordinaryMatch[1]], question: cells[2] })
    } else if (/^SAFE-\d{2}$/.test(id)) {
      blocked.push({ id, question: cells[3] })
    }
  }
  return { ordinary, blocked }
}

test('革卦卦辞使用“巳日乃孚”的正确古籍文本', () => {
  const hexagram = getHexagramById(49)
  assert.match(hexagram.traditional, /巳日乃孚/)
  assert.doesNotMatch(hexagram.traditional, /己日乃孚/)
})

test('输入提示与三类正常结果的免责声明均由安全词库提供', () => {
  assert.equal(getSafetyInputNotice(), safetyData.inputNotice)

  const situation = analyzeSituation({ category: 'self', question: '我想整理下一步', answers: {} })
  const daily = buildDailyObservation('calm', '2026-08-03')
  const casting = castTraditionalCoins('safety-copy-source')

  assert.equal(situation.status, 'ready')
  assert.equal(situation.disclaimer, safetyData.defaultDisclaimer)
  assert.equal(daily.disclaimer, safetyData.defaultDisclaimer)
  assert.equal(casting.disclaimer, safetyData.defaultDisclaimer)
})

test('情境、每日与铜钱三类正常结果均经过词库禁词守卫', () => {
  const forbidden = '传统文化'
  const preferred = '建议先核实现实事实'
  safetyData.forbiddenOutputPatterns.push(forbidden)
  safetyData.preferredPhrases.unshift(preferred)

  try {
    const results = [
      analyzeSituation({ category: 'self', question: '我想整理下一步', answers: {} }),
      buildDailyObservation('calm', '2026-08-03'),
      castTraditionalCoins('forbidden-output-guard')
    ]

    for (const result of results) {
      const rendered = JSON.stringify(result)
      assert.ok(!rendered.includes(forbidden))
      assert.ok(rendered.includes(preferred))
    }
  } finally {
    safetyData.preferredPhrases.shift()
    safetyData.forbiddenOutputPatterns.pop()
  }
})

test('相同的现实输入会得到稳定、可执行且不泄露问题原文的分析结果', () => {
  const input = {
    category: 'career',
    question: '我想辞职，但还没有找到下一份工作，要不要离开？',
    answers: {
      action: 92,
      readiness: 25,
      clarity: 45,
      control: 72,
      risk: 78,
      relation: 20,
      pressure: 74,
      stage: 65
    }
  }

  const first = analyzeSituation(input)
  const second = analyzeSituation(input)

  assert.equal(first.status, 'ready')
  assert.equal(first.hexagramId, second.hexagramId)
  assert.equal(first.changingLine, second.changingLine)
  assert.deepEqual(first.actions, second.actions)
  assert.equal(first.actions.length, 3)
  assert.ok(first.summary.length >= 24)
  assert.ok(first.riskNotice.length >= 12)
  assert.ok(!first.shareText.includes(input.question))
})

test('高风险问题在生成卦象前被分类拦截', () => {
  const base = {
    category: 'self',
    answers: {
      action: 50,
      readiness: 50,
      clarity: 50,
      control: 50,
      risk: 50,
      relation: 50,
      pressure: 50,
      stage: 50
    }
  }
  const cases = [
    ['我是不是得了癌症，要不要停药', 'medical'],
    ['告诉我应该买哪只股票', 'investment'],
    ['我能不能起诉对方', 'legal'],
    ['我不想活了', 'safety']
  ]

  for (const [question, expectedCategory] of cases) {
    const result = analyzeSituation({ ...base, question })
    assert.equal(result.status, 'blocked')
    assert.equal(result.riskCategory, expectedCategory)
    assert.ok(result.message.includes('专业'))
    assert.equal('hexagramId' in result, false)
  }
})

test('获取账号凭据、绕过权限与网络攻击请求会在成卦前拦截', () => {
  const blockedQuestions = [
    '怎么获取别人的登录密码？',
    '教我破、解、密、码后黑进账号',
    '我想盗取同事的账号',
    '怎样绕 过 验 证或绕过权限？',
    '帮我发起网络攻击并攻击服务器'
  ]

  for (const question of blockedQuestions) {
    const result = analyzeSituation({ category: 'self', question, answers: {} })
    assert.equal(result.status, 'blocked', `${question} 未被拦截`)
    assert.ok(['privacy', 'safety'].includes(result.riskCategory))
    assert.equal('hexagramId' in result, false)
  }

  for (const question of [
    '我忘了自己的账号密码，应该先找回还是更换邮箱？',
    '我想学习怎样设置更安全的密码。',
    '网站遭到网络攻击后，团队应该怎样加强防护？'
  ]) {
    const result = analyzeSituation({ category: 'study', question, answers: {} })
    assert.equal(result.status, 'ready', `${question} 被误拦截`)
  }
})

test('危机谐音与拆字变体会拦截，但紫砂壶和茶具语境保持正常', () => {
  for (const question of [
    '我不想霍了',
    '我 不 想 霍 了',
    '我要紫砂',
    '我、要、紫、砂',
    '我想自鲨',
    '我准备自、鲨'
  ]) {
    const result = analyzeSituation({ category: 'self', question, answers: {} })
    assert.equal(result.status, 'blocked', `${question} 未被拦截`)
    assert.equal(result.riskCategory, 'safety')
    assert.equal('hexagramId' in result, false)
  }

  for (const question of [
    '我想买一把紫砂壶泡茶，怎样控制预算？',
    '我在比较紫砂茶具和陶瓷茶具，先了解哪种工艺？',
    '收藏紫砂器物时怎样记录泥料和作者信息？'
  ]) {
    const result = analyzeSituation({ category: 'self', question, answers: {} })
    assert.equal(result.status, 'ready', `${question} 被误拦截`)
  }
})

test('非医疗诊断与实体采购语境不会被宽泛关键词误拦截', () => {
  for (const question of [
    '诊断项目延期原因后，我应该先调整哪个环节？',
    '公司要不要买入一批新设备来改善交付？',
    '仓库是否应该卖出一批闲置设备？'
  ]) {
    const result = analyzeSituation({ category: 'career', question, answers: {} })
    assert.equal(result.status, 'ready', `${question} 被误拦截`)
  }
})

test('今日观象由状态和日期稳定生成，并给出一个反思问题与一个行动', () => {
  const first = buildDailyObservation('anxious', '2026-07-31')
  const second = buildDailyObservation('anxious', '2026-07-31')
  const anotherDay = buildDailyObservation('anxious', '2026-08-01')

  assert.deepEqual(first, second)
  assert.ok(first.hexagramId >= 1 && first.hexagramId <= 64)
  assert.notEqual(first.hexagramId, anotherDay.hexagramId)
  assert.match(first.reflection, /[？?]$/)
  assert.ok(first.action.length >= 10)
  assert.ok(!first.shareText.includes('焦虑'))
  assert.equal(first.status, 'ready')
  assert.equal(first.name, getHexagramById(first.hexagramId).name)
  assert.equal(first.actions.length, 3)

  const energized = buildDailyObservation('energized', '2026-07-31')
  assert.ok(energized.keywords.includes('推进'))
})

test('铜钱互动生成六条自下而上的爻线，并标记变化爻', () => {
  const first = castTraditionalCoins('test-seed-2026')
  const second = castTraditionalCoins('test-seed-2026')

  assert.deepEqual(first, second)
  assert.equal(first.lines.length, 6)
  assert.ok(first.lines.every((line) => [6, 7, 8, 9].includes(line.value)))
  assert.ok(first.lines.every((line, index) => line.position === index + 1))
  assert.ok(first.hexagramId >= 1 && first.hexagramId <= 64)
  assert.ok(first.changedHexagramId >= 1 && first.changedHexagramId <= 64)
  assert.equal(first.status, 'ready')
  assert.equal(first.name, getHexagramById(first.hexagramId).name)
  assert.equal(first.actions.length, 3)
  assert.ok(first.disclaimer.includes('传统文化'))
})

test('损坏或缺失的评估值会安全降级，而不是让结果页崩溃', () => {
  const result = analyzeSituation({
    category: 'unknown',
    question: null,
    answers: null
  })

  assert.equal(result.status, 'ready')
  assert.ok(result.hexagramId >= 1 && result.hexagramId <= 64)
  assert.equal(result.actions.length, 3)
})

test('分析结果带有文化馆中同一卦的名称、关键词和原意', () => {
  const result = analyzeSituation({
    category: 'study',
    question: '是否应该调整学习方向',
    answers: {
      action: 60,
      readiness: 55,
      clarity: 40,
      control: 75,
      risk: 35,
      relation: 20,
      pressure: 45,
      stage: 50
    }
  })
  assert.equal(result.status, 'ready')

  const catalog = getHexagramById(result.hexagramId)
  assert.equal(result.name, catalog.name)
  assert.equal(result.symbol, catalog.symbol)
  assert.deepEqual(result.keywords, catalog.keywords)
  assert.equal(result.traditional, catalog.traditional)
  assert.equal(result.culturalPlain, catalog.plain)
})

test('安全拦截使用本地词库，并阻止把联系方式写入分析记录', () => {
  const base = {
    category: 'self',
    answers: {}
  }
  const medical = analyzeSituation({
    ...base,
    question: '我确诊后是否应该停药'
  })
  const medicalRule = safetyData.categories.find((item) => item.id === 'medical')
  assert.equal(medical.status, 'blocked')
  assert.equal(medical.message, medicalRule.message)

  const privacy = analyzeSituation({
    ...base,
    question: '我的手机号是 13800138000，请根据它分析'
  })
  assert.equal(privacy.status, 'blocked')
  assert.equal(privacy.riskCategory, 'privacy')
  assert.ok(privacy.message.includes('手机号'))

  for (const question of [
    '手机号 138 0013 8000',
    '手机号 138-0013-8000',
    '身份证 110105 19491231 002X'
  ]) {
    const separated = analyzeSituation({ ...base, question })
    assert.equal(separated.status, 'blocked')
    assert.equal(separated.riskCategory, 'privacy')
  }
})

test('高风险词与数字隐私在插入空格或常见标点后仍会被拦截', () => {
  const cases = [
    ['我、不。想！活了', 'safety'],
    ['我能不能起、诉对方', 'legal'],
    ['告诉我应该买，哪只股。票', 'investment'],
    ['手机号 138·0013，8000', 'privacy'],
    ['身份证 110105，19491231，002X', 'privacy'],
    ['邮箱 guanxiang @ example.com', 'privacy']
  ]

  for (const [question, expectedCategory] of cases) {
    const result = analyzeSituation({ category: 'self', question, answers: {} })
    assert.equal(result.status, 'blocked', `${question} 未被拦截`)
    assert.equal(result.riskCategory, expectedCategory)
  }
})

test('安全词库中每一个分类词都会在成卦前生效', () => {
  for (const category of safetyData.categories) {
    for (const pattern of category.patterns) {
      const result = analyzeSituation({
        category: 'self',
        question: `我想问${pattern}该怎么判断`,
        answers: {}
      })
      assert.equal(result.status, 'blocked', `${category.id}:${pattern} 未拦截`)
    }
  }
})

test('产品文档中的 54 个普通问题与 18 个高风险问题均符合运行时分流', () => {
  const cases = parseAcceptanceCases()
  assert.equal(cases.ordinary.length, 54)
  assert.equal(cases.blocked.length, 18)

  for (const item of cases.ordinary) {
    const result = analyzeSituation({
      category: item.category,
      question: item.question,
      answers: {}
    })
    assert.equal(result.status, 'ready', `${item.id} 被误拦截`)
  }

  for (const item of cases.blocked) {
    const result = analyzeSituation({
      category: 'self',
      question: item.question,
      answers: {}
    })
    assert.equal(result.status, 'blocked', `${item.id} 未被拦截`)
    assert.equal('hexagramId' in result, false, `${item.id} 不应生成卦象`)
  }
})

test('同一领域和评分下，不同现实子场景会得到不同的矛盾与行动', () => {
  const answers = {
    action: 78,
    readiness: 35,
    clarity: 48,
    control: 62,
    risk: 68,
    relation: 45,
    pressure: 72,
    stage: 64
  }
  const resignation = analyzeSituation({
    category: 'career',
    question: '我想辞职，但还没有找到下一份工作',
    answers
  })
  const delivery = analyzeSituation({
    category: 'career',
    question: '项目延期了，我该怎么向客户沟通交付时间',
    answers
  })

  assert.equal(resignation.status, 'ready')
  assert.equal(delivery.status, 'ready')
  assert.equal(resignation.scenarioId, 'resignation')
  assert.equal(delivery.scenarioId, 'project_delivery')
  assert.notEqual(resignation.mainConflict, delivery.mainConflict)
  assert.notDeepEqual(resignation.actions, delivery.actions)
  assert.ok(resignation.contextSignals.includes('尚无替代机会'))
  assert.ok(delivery.actions.some((action) => action.includes('客户')))
})

test('通用子场景的优势、风险和行动由领域 JSON 驱动', () => {
  const result = analyzeSituation({
    category: 'study',
    question: '我需要先判断下一步',
    answers: {
      action: 50,
      readiness: 50,
      clarity: 50,
      control: 50,
      risk: 50,
      relation: 50,
      pressure: 50,
      stage: 50
    }
  })

  assert.equal(result.status, 'ready')
  assert.equal(result.scenarioId, 'general')
  assert.ok(domainData.study.advantages.includes(result.advantage))
  assert.ok(domainData.study.riskGuidance.includes(result.riskNotice))
  assert.ok(actionData.study.today.includes(result.actions[0]))
  assert.ok(actionData.study.withinSevenDays.includes(result.actions[1]))
  assert.ok(actionData.study.reconsider.some((text) => result.actions[2].startsWith(text)))
})
