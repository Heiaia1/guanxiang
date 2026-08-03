const test = require('node:test')
const assert = require('node:assert/strict')

const { getAssessmentQuestions, scoreAssessment } = require('../miniprogram/services/assessment-engine.ts')
const { analyzeSituation } = require('../miniprogram/services/analysis-engine.ts')

function allSelections() {
  const questions = getAssessmentQuestions()
  const result = []
  function visit(index, selections) {
    if (index === questions.length) {
      result.push({ ...selections })
      return
    }
    const question = questions[index]
    for (const option of question.options) {
      selections[question.id] = option.id
      visit(index + 1, selections)
    }
  }
  visit(0, {})
  return result
}

test('合法评估组合能覆盖八个基础卦、六个变化阶段和足够多的六十四卦', () => {
  const categories = ['career', 'relationship', 'social', 'study', 'family', 'self']
  const trigrams = ['qian', 'kun', 'zhen', 'xun', 'kan', 'li', 'gen', 'dui'].sort()
  const lower = new Set()
  const upper = new Set()
  const lines = new Set()
  const hexagrams = new Set()
  const idCounts = new Map()

  for (const selections of allSelections()) {
    const scored = scoreAssessment(selections)
    assert.equal(scored.status, 'complete')
    for (const category of categories) {
      const result = analyzeSituation({ category, question: '我想先看清条件再决定', answers: scored.scores })
      assert.equal(result.status, 'ready')
      lower.add(result.lowerTrigram)
      upper.add(result.upperTrigram)
      lines.add(result.changingLine)
      hexagrams.add(result.hexagramId)
      idCounts.set(result.hexagramId, (idCounts.get(result.hexagramId) || 0) + 1)
    }
  }

  assert.deepEqual([...lower].sort(), trigrams)
  assert.deepEqual([...upper].sort(), trigrams)
  assert.deepEqual([...lines].sort(), [1, 2, 3, 4, 5, 6])
  assert.ok(hexagrams.size >= 48, `只覆盖 ${hexagrams.size}/64 卦`)

  const total = [...idCounts.values()].reduce((sum, count) => sum + count, 0)
  const maxShare = Math.max(...idCounts.values()) / total
  assert.ok(maxShare < 0.18, `单卦集中度过高：${(maxShare * 100).toFixed(1)}%`)
})

test('完整组合不会被压缩成少量重复现实解读', () => {
  const narratives = new Map()
  for (const selections of allSelections()) {
    const scored = scoreAssessment(selections)
    const result = analyzeSituation({
      category: 'career',
      question: '我想先看清条件再决定',
      answers: scored.scores
    })
    const narrative = [result.summary, result.mainConflict, result.advantage, result.riskNotice, ...result.actions].join('|')
    narratives.set(narrative, (narratives.get(narrative) || 0) + 1)
  }

  assert.ok(narratives.size >= 100, `只生成 ${narratives.size} 种现实解读`)
  const maxShare = Math.max(...narratives.values()) / 1536
  assert.ok(maxShare < 0.1, `最大重复组占 ${(maxShare * 100).toFixed(1)}%`)
})
