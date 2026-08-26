declare const module: { exports: unknown }

interface ReviewRecord {
  id: string
  createdAt: number
  reviewAt?: number
  reviewedAt?: number
  [key: string]: unknown
}

type ReviewState = 'none' | 'pending' | 'due' | 'completed'

const REVIEW_DELAY_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

function assertTimestamp(value: number): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('回看功能需要有效时间')
  }
}

function scheduleReview(record: ReviewRecord, now: number = Date.now()): ReviewRecord {
  assertTimestamp(now)
  return {
    ...record,
    reviewAt: now + REVIEW_DELAY_DAYS * DAY_MS,
    reviewedAt: 0
  }
}

function completeReview(record: ReviewRecord, now: number = Date.now()): ReviewRecord {
  assertTimestamp(now)
  if (!Number.isFinite(record.reviewAt) || Number(record.reviewAt) <= 0) return { ...record }
  return { ...record, reviewedAt: now }
}

function getReviewState(record: ReviewRecord, now: number = Date.now()): ReviewState {
  assertTimestamp(now)
  if (!Number.isFinite(record.reviewAt) || Number(record.reviewAt) <= 0) return 'none'
  if (Number.isFinite(record.reviewedAt) && Number(record.reviewedAt) > 0) return 'completed'
  return Number(record.reviewAt) <= now ? 'due' : 'pending'
}

function getDueReviews(records: ReviewRecord[], now: number = Date.now()): ReviewRecord[] {
  if (!Array.isArray(records)) return []
  return records
    .filter((record) => getReviewState(record, now) === 'due')
    .sort((left, right) => Number(left.reviewAt) - Number(right.reviewAt))
}

function formatReviewDate(timestamp: number): string {
  assertTimestamp(timestamp)
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

module.exports = {
  REVIEW_DELAY_DAYS,
  scheduleReview,
  completeReview,
  getReviewState,
  getDueReviews,
  formatReviewDate
}
