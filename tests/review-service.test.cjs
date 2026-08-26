const test = require('node:test')
const assert = require('node:assert/strict')

const {
  REVIEW_DELAY_DAYS,
  scheduleReview,
  completeReview,
  getReviewState,
  getDueReviews,
  formatReviewDate
} = require('../miniprogram/services/review-service.ts')

const DAY = 24 * 60 * 60 * 1000

test('30 天回看会固定安排在当前时刻后的第 30 天', () => {
  const now = Date.UTC(2026, 7, 26, 8, 0, 0)
  const record = scheduleReview({ id: 'record-1', createdAt: now - DAY }, now)

  assert.equal(REVIEW_DELAY_DAYS, 30)
  assert.equal(record.reviewAt, now + 30 * DAY)
  assert.equal(record.reviewedAt, 0)
  assert.equal(getReviewState(record, now), 'pending')
  assert.equal(formatReviewDate(record.reviewAt), '2026-09-25')
})

test('到期记录可筛选，完成后不会再次计入待回看', () => {
  const now = Date.UTC(2026, 9, 1, 0, 0, 0)
  const pending = { id: 'pending', createdAt: 1, reviewAt: now + DAY, reviewedAt: 0 }
  const due = { id: 'due', createdAt: 2, reviewAt: now - DAY, reviewedAt: 0 }
  const completed = completeReview({ id: 'completed', createdAt: 3, reviewAt: now - 2 * DAY }, now - 10)

  assert.equal(getReviewState(pending, now), 'pending')
  assert.equal(getReviewState(due, now), 'due')
  assert.equal(getReviewState(completed, now), 'completed')
  assert.deepEqual(getDueReviews([pending, completed, due], now).map((item) => item.id), ['due'])
  assert.equal(completed.reviewedAt, now - 10)
})

test('没有安排回看的记录保持 none，非法时间会被拒绝', () => {
  assert.equal(getReviewState({ id: 'plain', createdAt: 1 }, Date.now()), 'none')
  assert.throws(() => scheduleReview({ id: 'x', createdAt: 1 }, Number.NaN), /有效时间/)
  assert.throws(() => completeReview({ id: 'x', createdAt: 1 }, -1), /有效时间/)
})
