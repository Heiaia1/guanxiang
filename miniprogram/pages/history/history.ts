declare const require: (path: string) => any

const { getHexagramById } = require("../../services/hexagram-engine")
const {
  getRecords,
  saveRecord,
  deleteRecord,
  clearRecords,
  getDraft,
  clearDraft,
  hasSeenGuide,
  storageErrorMessage
} = require("../../services/storage-service")
const { getUiPreferences } = require("../../services/ui-preferences")

const DOMAIN_RULES = require('../../data/domain-rules-data') as Record<string, { name: string }>
const CATEGORY_LABELS = Object.fromEntries(
  Object.entries(DOMAIN_RULES).map(([id, domain]) => [id, domain.name])
) as Record<string, string>

function formatDate(timestamp: number): { day: string; year: string; time: string } {
  const date = new Date(timestamp)
  return {
    day: `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`,
    year: String(date.getFullYear()),
    time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  }
}

Page({
  data: {
    records: [] as any[],
    visibleRecords: [] as any[],
    scope: "all",
    recordCount: 0,
    favoriteCount: 0,
    error: "",
    storageFailed: false,
    confirmVisible: false,
    confirmTitle: "",
    confirmMessage: "",
    confirmText: "删除",
    pendingAction: "",
    pendingId: "",
    navigating: false,
    motionOff: false
  },

  rawRecords: [] as any[],

  onShow() {
    const app = getApp<{ globalData: { lowPerformance: boolean } }>()
    const visual = getUiPreferences(Boolean(app.globalData.lowPerformance))
    this.setData({ motionOff: visual.motionOff, navigating: false })
    this.loadRecords()
  },

  loadRecords() {
    try {
      this.rawRecords = getRecords() || []
      const records = this.rawRecords.map((record: any) => {
        const hexagram = getHexagramById(record.hexagramId) || {}
        const date = formatDate(record.createdAt)
        return {
          ...record,
          hexagramName: record.result?.name || hexagram.name || `第 ${record.hexagramId} 卦`,
          upperTrigram: record.result?.upperTrigram || hexagram.upperTrigram || "乾",
          lowerTrigram: record.result?.lowerTrigram || hexagram.lowerTrigram || "乾",
          keywords: record.result?.keywords || hexagram.keywords || [],
          categoryLabel: CATEGORY_LABELS[record.category] || "自我反思",
          modeLabel: record.mode === "daily" ? "今日观象" : record.mode === "coin" ? "铜钱互动" : "情境观象",
          questionPreview:
            record.mode === "daily"
              ? `${record.dailyStateLabel || "当日状态"} · 每日反思`
              : String(record.question || "未记录原问题"),
          day: date.day,
          year: date.year,
          time: date.time,
          isFavorite: record.favorite === true
        }
      })
      this.setData({
        records,
        recordCount: records.length,
        favoriteCount: records.filter((item) => item.isFavorite).length,
        error: "",
        storageFailed: false
      })
      this.applyScope(records, this.data.scope)
    } catch (error) {
      this.rawRecords = []
      this.setData({
        records: [],
        visibleRecords: [],
        recordCount: 0,
        favoriteCount: 0,
        storageFailed: true,
        error: storageErrorMessage(error)
      })
    }
  },

  setScope(event: WechatMiniprogram.BaseEvent) {
    const scope = event.currentTarget.dataset.scope === "favorites" ? "favorites" : "all"
    this.setData({ scope })
    this.applyScope(this.data.records, scope)
  },

  applyScope(records: any[], scope: string) {
    this.setData({
      visibleRecords: scope === "favorites"
        ? records.filter((record) => record.isFavorite)
        : records
    })
  },

  openRecord(event: WechatMiniprogram.BaseEvent) {
    if (this.data.navigating) return
    const id = encodeURIComponent(String(event.currentTarget.dataset.id || ""))
    if (!id) return
    this.setData({ navigating: true })
    wx.navigateTo({
      url: `/pages/result/result?id=${id}`,
      fail: () => {
        this.setData({ navigating: false })
        wx.showToast({ title: "记录详情打开失败，请重试", icon: "none" })
      }
    })
  },

  toggleRecordFavorite(event: WechatMiniprogram.BaseEvent) {
    const id = String(event.currentTarget.dataset.id || "")
    const raw = this.rawRecords.find((record) => record.id === id)
    if (!raw) return
    try {
      const expected = raw.favorite !== true
      saveRecord({ ...raw, favorite: expected })
      const persisted = (getRecords() || []).find((record: any) => record.id === id)
      if (!persisted || persisted.favorite !== expected) {
        throw new Error("record favorite not persisted")
      }
      this.loadRecords()
    } catch (_error) {
      wx.showToast({ title: "记录收藏更新失败", icon: "none" })
    }
  },

  askDelete(event: WechatMiniprogram.BaseEvent) {
    const id = String(event.currentTarget.dataset.id || "")
    const record = this.data.records.find((item) => item.id === id)
    if (!record) return
    this.setData({
      confirmVisible: true,
      confirmTitle: "删除这条记录？",
      confirmMessage: `“${record.hexagramName}”及本次问题、分析和行动建议将从本机永久移除。`,
      confirmText: "确认删除",
      pendingAction: "delete",
      pendingId: id
    })
  },

  askClear() {
    if (!this.data.recordCount) return
    this.setData({
      confirmVisible: true,
      confirmTitle: "清空全部记录？",
      confirmMessage: `本机保存的 ${this.data.recordCount} 条观象记录和当前未完成草稿将永久移除，文化馆收藏不会受影响。`,
      confirmText: "全部清空",
      pendingAction: "clear",
      pendingId: ""
    })
  },

  closeConfirm() {
    this.setData({
      confirmVisible: false,
      pendingAction: "",
      pendingId: ""
    })
  },

  confirmAction() {
    const action = this.data.pendingAction
    const id = this.data.pendingId
    this.closeConfirm()
    try {
      if (action === "delete" && id) {
        const deleted = deleteRecord(id)
        if (!deleted) {
          wx.showToast({ title: "这条记录已不存在", icon: "none" })
          this.loadRecords()
          return
        }
        const draft = getDraft()
        if (draft?.recordId === id) {
          const draftCleared = clearDraft()
          if (!draftCleared || getDraft()?.recordId === id) {
            throw new Error("linked draft not cleared")
          }
        }
        if ((getRecords() || []).some((record: any) => record.id === id)) {
          throw new Error("record still exists")
        }
      } else if (action === "clear") {
        const recordsCleared = clearRecords()
        const draftCleared = clearDraft()
        if (!recordsCleared || !draftCleared || (getRecords() || []).length || getDraft()) {
          throw new Error("local data still exists")
        }
      } else {
        return
      }
      this.loadRecords()
      wx.showToast({ title: action === "clear" ? "记录已清空" : "记录已删除", icon: "success" })
    } catch (_error) {
      this.loadRecords()
      wx.showToast({ title: "本地数据未完全清理，请重试", icon: "none" })
    }
  },

  startObservation() {
    if (!hasSeenGuide()) {
      wx.reLaunch({ url: "/pages/guide/guide" })
      return
    }
    wx.reLaunch({
      url: "/pages/home/home",
      success: () => {
        setTimeout(() => {
          wx.navigateTo({
            url: "/pages/category/category",
            fail: () => wx.showToast({ title: "页面打开失败，请重试", icon: "none" })
          })
        }, 80)
      }
    })
  },

  openLibrary() {
    wx.navigateTo({
      url: "/pages/library/library",
      fail: () => wx.showToast({ title: "文化馆打开失败，请重试", icon: "none" })
    })
  },

  retryLoad() {
    this.loadRecords()
  },

  openSettings() {
    wx.navigateTo({
      url: "/pages/settings/settings",
      fail: () => wx.showToast({ title: "设置页打开失败，请重试", icon: "none" })
    })
  }
})
