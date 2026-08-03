declare const require: (path: string) => any

const { getDraft, saveDraft } = require("../../services/storage-service")
const { analyzeSituation, getSafetyInputNotice } = require("../../services/analysis-engine")
const { getUiPreferences } = require("../../services/ui-preferences")
const DOMAIN_RULES = require('../../data/domain-rules.json') as Record<string, {
  name: string
  questionPrompt: string
}>

function characterCount(value: string): number {
  return Array.from(value).length
}

function isMeaningful(value: string): boolean {
  const compact = value.replace(/[\s\u200b-\u200f\u202a-\u202e]/g, "")
  return compact.length > 0 && /[\u3400-\u9fffA-Za-z0-9]/.test(compact)
}

Page({
  data: {
    category: "",
    categoryLabel: "",
    questionPrompt: "",
    question: "",
    count: 0,
    error: "",
    inputNotice: getSafetyInputNotice(),
    submitting: false,
    motionOff: false
  },

  onLoad() {
    const app = getApp<{ globalData: { lowPerformance: boolean } }>()
    const visual = getUiPreferences(Boolean(app.globalData.lowPerformance))
    this.setData({ motionOff: visual.motionOff })
    try {
      const draft = getDraft() || {}
      const domain = DOMAIN_RULES[draft.category]
      if (!draft.category || !domain) {
        wx.showToast({ title: "请先选择问题领域", icon: "none" })
        setTimeout(() => wx.redirectTo({ url: "/pages/category/category" }), 350)
        return
      }
      const question = String(draft.question || "").slice(0, 100)
      this.setData({
        category: draft.category,
        categoryLabel: domain.name,
        questionPrompt: domain.questionPrompt,
        question,
        count: characterCount(question)
      })
    } catch (_error) {
      wx.showToast({ title: "未读取到上一步内容", icon: "none" })
    }
  },

  onInput(event: WechatMiniprogram.Input) {
    let question = String(event.detail.value || "")
    if (characterCount(question) > 100) {
      question = Array.from(question).slice(0, 100).join("")
    }
    this.setData({
      question,
      count: characterCount(question),
      error: ""
    })
  },

  useExample(event: WechatMiniprogram.BaseEvent) {
    const example = String(event.currentTarget.dataset.example || "")
    this.setData({
      question: example,
      count: characterCount(example),
      error: ""
    })
  },

  submit() {
    if (this.data.submitting) return
    const question = this.data.question.trim()
    if (!question) {
      this.setData({ error: "请先写下一件具体的事。" })
      return
    }
    if (!isMeaningful(question)) {
      this.setData({ error: "请用文字描述现实问题，不能只输入符号或表情。" })
      return
    }
    if (characterCount(question) > 100) {
      this.setData({ error: "问题不能超过 100 个字。" })
      return
    }

    this.setData({ submitting: true })
    try {
      const draft = getDraft() || {}
      const safetyCheck = analyzeSituation({
        category: this.data.category,
        question,
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
      if (safetyCheck?.status === "blocked") {
        const blockedDraft = saveDraft({
          ...draft,
          question,
          answers: {},
          answerIds: {},
          result: safetyCheck,
          earlyBlocked: true,
          castingLines: [],
          updatedAt: Date.now()
        })
        if (blockedDraft?.result?.status !== "blocked") {
          throw new Error("safety result not persisted")
        }
        wx.navigateTo({
          url: "/pages/result/result",
          fail: () => wx.showToast({ title: "安全提示页打开失败，请重试", icon: "none" }),
          complete: () => this.setData({ submitting: false })
        })
        return
      }
      const saved = saveDraft({
        ...draft,
        question,
        result: null,
        earlyBlocked: false,
        castingLines: [],
        updatedAt: Date.now()
      })
      if (saved?.question !== question) throw new Error("question not persisted")
      wx.navigateTo({
        url: "/pages/assessment/assessment",
        fail: () => wx.showToast({ title: "现状梳理页打开失败，请重试", icon: "none" }),
        complete: () => this.setData({ submitting: false })
      })
    } catch (_error) {
      this.setData({ submitting: false })
      wx.showToast({ title: "问题未保存，请重试", icon: "none" })
    }
  }
})
