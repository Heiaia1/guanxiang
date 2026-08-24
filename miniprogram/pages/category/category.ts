declare const require: (path: string) => any

const {
  getDraft,
  saveDraft,
  hasSeenGuide
} = require('../../services/storage-service')
const { getUiPreferences } = require('../../services/ui-preferences')
const DOMAIN_RULES = require('../../data/domain-rules-data') as Record<string, {
  id: string
  name: string
  description: string
  questionPrompt: string
}>

const CATEGORY_MARKS: Record<string, string> = {
  career: '业',
  relationship: '情',
  social: '交',
  study: '学',
  family: '家',
  self: '心'
}

const CATEGORIES = Object.values(DOMAIN_RULES).map((domain) => ({
  id: domain.id,
  mark: CATEGORY_MARKS[domain.id] || '象',
  title: domain.name,
  description: domain.description,
  prompt: domain.questionPrompt
}))

Page({
  data: {
    categories: CATEGORIES,
    selected: '',
    navigating: false,
    motionOff: false
  },

  onLoad() {
    const app = getApp<{ globalData: { lowPerformance: boolean } }>()
    const visual = getUiPreferences(Boolean(app.globalData.lowPerformance))
    this.setData({ motionOff: visual.motionOff })
    if (!hasSeenGuide()) {
      wx.reLaunch({ url: '/pages/guide/guide' })
      return
    }
    try {
      const draft = getDraft() || {}
      this.setData({ selected: draft.category || '' })
    } catch (_error) {
      this.setData({ selected: '' })
    }
  },

  onShow() {
    this.setData({ navigating: false })
  },

  selectCategory(event: WechatMiniprogram.BaseEvent) {
    if (this.data.navigating) return
    const category = String(event.currentTarget.dataset.category || '')
    if (!CATEGORIES.some((item) => item.id === category)) return
    this.setData({ selected: category, navigating: true })
    try {
      const draft = getDraft() || {}
      const saved = saveDraft({
        mode: 'context',
        category,
        question: draft.mode === 'context' ? String(draft.question || '') : '',
        answerIds: {},
        answers: null,
        result: null,
        recordId: '',
        doNotSave: false,
        earlyBlocked: false,
        castingLines: [],
        dailyState: '',
        dailyStateLabel: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      })
      if (saved?.category !== category || saved?.mode !== 'context') {
        throw new Error('category not persisted')
      }
      wx.navigateTo({
        url: '/pages/question/question',
        fail: () => {
          this.setData({ navigating: false })
          wx.showToast({ title: '问题页打开失败，请重试', icon: 'none' })
        }
      })
    } catch (_error) {
      this.setData({ navigating: false })
      wx.showToast({ title: '选择未保存，请重试', icon: 'none' })
    }
  }
})
