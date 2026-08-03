declare const require: (path: string) => any

const { getDraft, saveDraft } = require('../../services/storage-service')
const {
  getAssessmentQuestions,
  scoreAssessment
} = require('../../services/assessment-engine')
const { getUiPreferences } = require('../../services/ui-preferences')

interface AssessmentOption {
  id: string
  label: string
  note?: string
  scores: Record<string, number>
}

interface AssessmentQuestion {
  id: string
  dimension: string
  title: string
  description: string
  options: AssessmentOption[]
}

const QUESTIONS = getAssessmentQuestions() as AssessmentQuestion[]

Page({
  data: {
    questions: QUESTIONS,
    currentIndex: 0,
    current: QUESTIONS[0],
    selectedId: '',
    selections: {} as Record<string, string>,
    progress: 20,
    finishing: false,
    motionOff: false
  },

  onLoad() {
    const app = getApp<{ globalData: { lowPerformance: boolean } }>()
    const visual = getUiPreferences(Boolean(app.globalData.lowPerformance))
    this.setData({ motionOff: visual.motionOff })
    try {
      const draft = getDraft() || {}
      if (!draft.question) {
        wx.showToast({ title: '请先写下问题', icon: 'none' })
        setTimeout(() => wx.redirectTo({ url: '/pages/question/question' }), 350)
        return
      }
      const selections = draft.answerIds || {}
      this.setData({
        selections,
        selectedId: selections[QUESTIONS[0].id] || ''
      })
    } catch (_error) {
      wx.showToast({ title: '未读取到问题内容', icon: 'none' })
    }
  },

  selectOption(event: WechatMiniprogram.BaseEvent) {
    if (this.data.finishing) return
    const selectedId = String(event.currentTarget.dataset.id || '')
    if (!this.data.current.options.some((item: AssessmentOption) => item.id === selectedId)) return
    this.setData({ selectedId })
  },

  previous() {
    if (this.data.finishing) return
    if (this.data.currentIndex === 0) {
      wx.navigateBack()
      return
    }
    const currentIndex = this.data.currentIndex - 1
    const current = QUESTIONS[currentIndex]
    this.setData({
      currentIndex,
      current,
      progress: ((currentIndex + 1) / QUESTIONS.length) * 100,
      selectedId: this.data.selections[current.id] || ''
    })
  },

  next() {
    if (!this.data.selectedId || this.data.finishing) return
    const selections = {
      ...this.data.selections,
      [this.data.current.id]: this.data.selectedId
    }

    if (this.data.currentIndex < QUESTIONS.length - 1) {
      const currentIndex = this.data.currentIndex + 1
      const current = QUESTIONS[currentIndex]
      this.setData({
        selections,
        currentIndex,
        current,
        progress: ((currentIndex + 1) / QUESTIONS.length) * 100,
        selectedId: selections[current.id] || ''
      })
      return
    }

    this.finish(selections)
  },

  finish(selections: Record<string, string>) {
    this.setData({ finishing: true, selections })
    const scored = scoreAssessment(selections)
    if (scored.status !== 'complete' || !scored.scores) {
      this.setData({ finishing: false })
      wx.showToast({ title: '还有问题没有选择', icon: 'none' })
      return
    }

    try {
      const draft = getDraft() || {}
      const saved = saveDraft({
        ...draft,
        answerIds: selections,
        answers: scored.scores,
        result: null,
        castingLines: [],
        updatedAt: Date.now()
      })
      if (!saved?.answers) throw new Error('assessment not persisted')
      wx.navigateTo({
        url: '/pages/casting/casting',
        complete: () => this.setData({ finishing: false })
      })
    } catch (_error) {
      this.setData({ finishing: false })
      wx.showToast({ title: '现状未保存，请重试', icon: 'none' })
    }
  }
})
