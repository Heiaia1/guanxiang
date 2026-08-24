declare const module: { exports: unknown }
declare function require(path: string): any

type Dimension = 'action' | 'readiness' | 'clarity' | 'control' | 'risk' | 'relation' | 'pressure' | 'stage'

interface AssessmentOption {
  id: string
  label: string
  note?: string
  scores: Record<Dimension, number>
}

interface AssessmentQuestion {
  id: string
  dimension: Dimension
  title: string
  description: string
  options: AssessmentOption[]
}

const QUESTIONS = require('../data/questions-data') as AssessmentQuestion[]
const DIMENSIONS: Dimension[] = ['action', 'readiness', 'clarity', 'control', 'risk', 'relation', 'pressure', 'stage']

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function getAssessmentQuestions(): AssessmentQuestion[] {
  return clone(QUESTIONS)
}

function scoreAssessment(selections: Record<string, string> | null | undefined) {
  const source = selections || {}
  const missingQuestionIds = QUESTIONS
    .filter((question) => !question.options.some((option) => option.id === source[question.id]))
    .map((question) => question.id)

  if (missingQuestionIds.length) {
    return {
      status: 'incomplete' as const,
      missingQuestionIds,
      scores: null
    }
  }

  const totals = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension, 0])) as Record<Dimension, number>
  for (const question of QUESTIONS) {
    const option = question.options.find((item) => item.id === source[question.id]) as AssessmentOption
    for (const dimension of DIMENSIONS) {
      totals[dimension] += Number(option.scores[dimension] || 0)
    }
  }

  const scores = Object.fromEntries(
    DIMENSIONS.map((dimension) => [dimension, Math.round(totals[dimension] / QUESTIONS.length)])
  ) as Record<Dimension, number>

  return {
    status: 'complete' as const,
    missingQuestionIds: [] as string[],
    scores
  }
}

module.exports = {
  getAssessmentQuestions,
  scoreAssessment
}
