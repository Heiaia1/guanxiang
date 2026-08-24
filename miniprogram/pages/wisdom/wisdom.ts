declare const require: (path: string) => any

const { getAllWisdomNotes, getWisdomOfDay } = require("../../services/wisdom-service")
const { hasSeenGuide } = require("../../services/storage-service")
const { getUiPreferences } = require("../../services/ui-preferences")

const CATEGORIES = [
  { id: "all", label: "全部" },
  { id: "decision", label: "进退" },
  { id: "work", label: "工作" },
  { id: "relationship", label: "关系" },
  { id: "study", label: "学习" },
  { id: "family", label: "家庭" },
  { id: "self", label: "自省" }
]

function todayKey(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

Page({
  data: {
    categories: CATEGORIES,
    activeCategory: "all",
    query: "",
    notes: [] as any[],
    visibleNotes: [] as any[],
    featured: null as any,
    expandedId: "",
    error: "",
    motionOff: false,
    redirectingToGuide: false
  },

  onShow() {
    const app = getApp<{ globalData: { lowPerformance: boolean } }>()
    const visual = getUiPreferences(Boolean(app.globalData.lowPerformance))
    this.setData({ motionOff: visual.motionOff })
    if (!hasSeenGuide()) {
      this.redirectToGuide()
      return
    }
    this.setData({ redirectingToGuide: false })
    this.loadNotes()
  },

  redirectToGuide() {
    if (this.data.redirectingToGuide) return
    this.setData({ redirectingToGuide: true })
    wx.redirectTo({
      url: "/pages/guide/guide?returnTo=wisdom",
      fail: () => {
        this.setData({ redirectingToGuide: false })
        wx.showToast({ title: "首次说明打开失败，请重试", icon: "none" })
      }
    })
  },

  loadNotes() {
    try {
      const notes = getAllWisdomNotes()
      const featured = getWisdomOfDay(todayKey())
      if (!notes.length || !featured) throw new Error("wisdom notes unavailable")
      this.setData({ notes, featured, error: "" })
      this.applyFilter(notes, this.data.activeCategory, this.data.query)
    } catch (_error) {
      this.setData({
        notes: [],
        visibleNotes: [],
        featured: null,
        error: "札记内容没有完整加载，请返回后重新进入。"
      })
    }
  },

  setCategory(event: WechatMiniprogram.BaseEvent) {
    const category = String(event.currentTarget.dataset.category || "all")
    if (!CATEGORIES.some((item) => item.id === category)) return
    this.setData({ activeCategory: category, expandedId: "" })
    this.applyFilter(this.data.notes, category, this.data.query)
  },

  onSearch(event: WechatMiniprogram.Input) {
    const query = String(event.detail.value || "")
    this.setData({ query, expandedId: "" })
    this.applyFilter(this.data.notes, this.data.activeCategory, query)
  },

  clearSearch() {
    this.setData({ query: "", expandedId: "" })
    this.applyFilter(this.data.notes, this.data.activeCategory, "")
  },

  applyFilter(notes: any[], category: string, query: string) {
    const term = query.trim().toLocaleLowerCase()
    const visibleNotes = notes.filter((item) => {
      if (category !== "all" && item.category !== category) return false
      if (!term) return true
      return [
        item.categoryLabel,
        item.title,
        item.source,
        item.principle,
        item.interpretation,
        item.reflection,
        item.action
      ].join(" ").toLocaleLowerCase().includes(term)
    })
    this.setData({ visibleNotes })
  },

  toggleNote(event: WechatMiniprogram.BaseEvent) {
    const id = String(event.currentTarget.dataset.id || "")
    if (!this.data.notes.some((item: any) => item.id === id)) return
    this.setData({ expandedId: this.data.expandedId === id ? "" : id })
  }
})
