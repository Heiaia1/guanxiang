const test = require('node:test')
const assert = require('node:assert/strict')

const sourceQuestions = require('../miniprogram/data/questions.json')
const {
  getAssessmentQuestions,
  scoreAssessment
} = require('../miniprogram/services/assessment-engine.ts')

test('评估页与计分引擎使用同一份本地问题数据', () => {
  const questions = getAssessmentQuestions()
  assert.deepEqual(questions, sourceQuestions)

  const selections = Object.fromEntries(
    questions.map((question) => [question.id, question.options[0].id])
  )
  const result = scoreAssessment(selections)
  assert.equal(result.status, 'complete')
  assert.deepEqual(result.missingQuestionIds, [])

  for (const dimension of ['action', 'readiness', 'clarity', 'control', 'risk', 'relation', 'pressure', 'stage']) {
    const expected = Math.round(
      questions.reduce((sum, question) => sum + question.options[0].scores[dimension], 0) / questions.length
    )
    assert.equal(result.scores[dimension], expected)
  }
})

test('缺少任意一题时不会产生伪完整评分', () => {
  const questions = getAssessmentQuestions()
  const selections = Object.fromEntries(
    questions.slice(0, -1).map((question) => [question.id, question.options[0].id])
  )
  const result = scoreAssessment(selections)

  assert.equal(result.status, 'incomplete')
  assert.deepEqual(result.missingQuestionIds, [questions.at(-1).id])
  assert.equal(result.scores, null)
})
