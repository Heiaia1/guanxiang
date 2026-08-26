declare const require: (path: string) => any

const {
  saveDraft,
  getRecords,
  getFavorites,
  hasSeenGuide
} = require("../../services/storage-service")
const { getUiPreferences } = require("../../services/ui-preferences")
const { getAllWisdomNotes, getWisdomOfDay } = require("../../services/wisdom-service")
const { getDueReviews } = require("../../services/review-service")

const DAILY_STATES = [
  { id: "calm", label: "平静", note: "让清晰继续生长" },
  { id: "anxious", label: "焦虑", note: "先把事实与担心分开" },
  { id: "hesitant", label: "犹豫", note: "找到最小验证动作" },
  { id: "energized", label: "有冲劲", note: "让速度服从方向" },
  { id: "tired", label: "疲惫", note: "先恢复，再作重决定" },
  { id: "change", label: "想改变", note: "从可逆的一步开始" }
]

function todayKey(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

Page({
  data: {
    recordCount: 0,
    favoriteCount: 0,
    dueReviewCount: 0,
    dailyVisible: false,
    dailyStates: DAILY_STATES,
    creatingDaily: false,
    navigating: false,
    animationsEnabled: true,
    lowPower: false,
    motionOff: false,
    greeting: "此刻，先看清一件事",
    todayWisdom: null as any,
    wisdomCount: 0
  },

  onLoad() {
    if (!hasSeenGuide()) {
      wx.reLaunch({ url: "/pages/guide/guide" })
    }
  },

  onShow() {
    if (!hasSeenGuide()) return
    try {
      const records = getRecords() || []
      const favorites = getFavorites() || []
      const app = getApp<{ globalData: { lowPerformance: boolean } }>()
      const visual = getUiPreferences(Boolean(app.globalData.lowPerformance))
      const hour = new Date().getHours()
      const todayWisdom = getWisdomOfDay(todayKey())
      const wisdomCount = getAllWisdomNotes().length
      this.setData({
        recordCount: records.length,
        favoriteCount: favorites.length,
        dueReviewCount: getDueReviews(records).length,
        navigating: false,
        animationsEnabled: visual.animationsEnabled,
        lowPower: visual.lowPower,
        motionOff: visual.motionOff,
        todayWisdom,
        wisdomCount,
        greeting:
          hour < 11 ? "晨起观心，先定今日一事" :
          hour < 18 ? "此刻，先看清一件事" :
          "夜深宜静，回看今日得失"
      })
    } catch (_error) {
      this.setData({ recordCount: 0, favoriteCount: 0, dueReviewCount: 0 })
    }
  },

  openDaily() {
    if (this.data.navigating) return
    this.setData({ dailyVisible: true })
  },

  closeDaily() {
    if (!this.data.creatingDaily) this.setData({ dailyVisible: false })
  },

  stopPropagation() {},

  chooseDaily(event: WechatMiniprogram.BaseEvent) {
    if (this.data.creatingDaily || this.data.navigating) return
    const state = String(event.currentTarget.dataset.state || "")
    const stateInfo = DAILY_STATES.find((item) => item.id === state)
    if (!stateInfo) return
    this.setData({ creatingDaily: true })
    try {
      // The analysis engine loads the complete local knowledge base. Loading it
      // only when the user starts an observation keeps the home route fast and
      // avoids a DevTools route timeout during initial Page registration.
      const { buildDailyObservation } = require("../../services/analysis-engine")
      const result = buildDailyObservation(state, todayKey())
      const saved = saveDraft({
        mode: "daily",
        category: "self",
        question: "",
        dailyState: state,
        dailyStateLabel: stateInfo.label,
        answers: {},
        answerIds: {},
        result,
        recordId: "",
        doNotSave: false,
        earlyBlocked: false,
        castingLines: [],
        createdAt: Date.now()
      })
      if (saved?.mode !== "daily" || !saved?.result) {
        throw new Error("daily draft not persisted")
      }
      this.setData({ dailyVisible: false, creatingDaily: false })
      this.navigate("/pages/casting/casting?mode=daily")
    } catch (_error) {
      this.setData({ creatingDaily: false })
      wx.showToast({ title: "今日观象暂未生成，请重试", icon: "none" })
    }
  },

  askQuestion() {
    this.navigate("/pages/category/category")
  },

  openLibrary() {
    this.navigate("/pages/library/library")
  },

  openWisdom() {
    this.navigate("/pages/wisdom/wisdom")
  },

  openHistory() {
    this.navigate("/pages/history/history")
  },

  openSupport() {
    this.navigate("/pages/support/support")
  },

  openSettings() {
    this.navigate("/pages/settings/settings")
  },

  navigate(url: string) {
    if (this.data.navigating) return
    this.setData({ navigating: true })
    wx.navigateTo({
      url,
      fail: () => {
        this.setData({ navigating: false })
        wx.showToast({ title: "页面打开失败，请重试", icon: "none" })
      }
    })
  }
})
