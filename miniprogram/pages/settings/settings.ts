declare const require: (path: string) => any

const {
  getSettings,
  updateSettings,
  getRecords,
  clearRecords,
  getDraft,
  clearDraft,
  resetSettings,
  storageErrorMessage
} = require("../../services/storage-service")
const { getUiPreferences, resolveUiPreferences } = require("../../services/ui-preferences")
const LEGAL_CONTENT = require("../../data/legal-documents-data") as {
  documents: LegalDocument[]
}

interface LegalSection {
  title: string
  paragraphs: string[]
  bullets: string[]
}

interface LegalDocument {
  id: string
  title: string
  summary: string
  documentVersion: string
  publishedDate: string
  effectiveDate: string
  appliesTo: string
  sections: LegalSection[]
}

interface SwitchChangeEvent extends WechatMiniprogram.BaseEvent {
  detail: {
    value: boolean
  }
}

Page({
  data: {
    settings: {
      animations: true,
      sound: true,
      vibration: true,
      lowPower: false,
      autoSave: true
    },
    recordCount: 0,
    recordSummary: "当前设备共 0 条，文化馆收藏独立保留",
    settingsReadFailed: false,
    recordsReadFailed: false,
    storageError: "",
    expanded: "",
    confirmVisible: false,
    confirmTitle: "清空本地观象数据？",
    confirmMessage: "全部观象记录和当前未完成草稿将从本机永久移除；体验设置与文化馆收藏会保留。",
    legalDocuments: LEGAL_CONTENT.documents,
    activeDocument: null as LegalDocument | null,
    legalVisible: false,
    motionOff: false
  },

  onShow() {
    const app = getApp<{ globalData: { lowPerformance: boolean } }>()
    const visual = getUiPreferences(Boolean(app.globalData.lowPerformance))
    this.setData({ motionOff: visual.motionOff })
    this.loadSettings()
  },

  loadSettings() {
    const errors: string[] = []
    let settingsReadFailed = false
    let recordsReadFailed = false
    let settings = this.data.settings
    let recordCount = this.data.recordCount
    try {
      const restored = getSettings() || {}
      settings = {
        animations: restored.animations !== false,
        sound: restored.sound !== false,
        vibration: restored.vibration !== false,
        lowPower: Boolean(restored.lowPower),
        autoSave: restored.autoSave !== false
      }
    } catch (error) {
      settingsReadFailed = true
      errors.push(storageErrorMessage(error))
    }
    try {
      recordCount = (getRecords() || []).length
    } catch (error) {
      recordsReadFailed = true
      recordCount = 0
      errors.push(storageErrorMessage(error))
    }
    this.setData({
      settings,
      recordCount,
      recordSummary: recordsReadFailed
        ? "记录暂未安全读取，原数据未被覆盖"
        : `当前设备共 ${recordCount} 条，文化馆收藏独立保留`,
      settingsReadFailed,
      recordsReadFailed,
      storageError: Array.from(new Set(errors)).join("\n")
    })
    if (errors.length) wx.showToast({ title: "部分本地数据未能安全读取", icon: "none" })
  },

  updateToggle(event: SwitchChangeEvent) {
    const key = String(event.currentTarget.dataset.key || "")
    if (!["animations", "sound", "vibration", "lowPower", "autoSave"].includes(key)) return
    const value = Boolean(event.detail.value)
    try {
      const settings = updateSettings({ [key]: value })
      if (Boolean(settings[key]) !== value) {
        throw new Error("setting not persisted")
      }
      this.setData({
        settings: {
          animations: settings.animations !== false,
          sound: settings.sound !== false,
          vibration: settings.vibration !== false,
          lowPower: Boolean(settings.lowPower),
          autoSave: settings.autoSave !== false
        },
        motionOff: resolveUiPreferences(settings, false).motionOff,
        settingsReadFailed: false,
        storageError: this.data.recordsReadFailed ? this.data.storageError : ""
      })
    } catch (error) {
      this.loadSettings()
      wx.showToast({ title: storageErrorMessage(error), icon: "none" })
    }
  },

  toggleSection(event: WechatMiniprogram.BaseEvent) {
    const section = String(event.currentTarget.dataset.section || "")
    this.setData({ expanded: this.data.expanded === section ? "" : section })
  },

  openLegal(event: WechatMiniprogram.BaseEvent) {
    const id = String(event.currentTarget.dataset.document || "")
    const document = LEGAL_CONTENT.documents.find((item) => item.id === id)
    if (!document) {
      wx.showToast({ title: "说明内容暂时无法读取", icon: "none" })
      return
    }
    this.setData({
      activeDocument: document,
      legalVisible: true
    })
  },

  closeLegal() {
    this.setData({
      activeDocument: null,
      legalVisible: false
    })
  },

  askClear() {
    if (this.data.recordsReadFailed) {
      this.setData({
        confirmVisible: true,
        confirmTitle: "清理无法读取的观象数据？",
        confirmMessage: "当前记录结构异常或暂时无法读取。只有确认后才会删除观象记录与草稿；体验设置和文化馆收藏仍会保留。"
      })
      return
    }
    if (!this.data.recordCount) {
      try {
        const cleared = clearDraft()
        if (!cleared || getDraft()) {
          wx.showToast({ title: "草稿未能清理，请重试", icon: "none" })
        } else {
          wx.showToast({ title: "当前草稿已清理", icon: "none" })
        }
      } catch (error) {
        wx.showToast({ title: storageErrorMessage(error), icon: "none" })
      }
      return
    }
    this.setData({
      confirmVisible: true,
      confirmTitle: "清空本地观象数据？",
      confirmMessage: `全部 ${this.data.recordCount} 条观象记录和当前未完成草稿将从本机永久移除；体验设置与文化馆收藏会保留。`
    })
  },

  closeConfirm() {
    this.setData({ confirmVisible: false })
  },

  confirmClear() {
    this.setData({ confirmVisible: false })
    try {
      const recordsCleared = clearRecords()
      const draftCleared = clearDraft()
      const remaining = getRecords() || []
      this.setData({ recordCount: remaining.length })
      if (recordsCleared && draftCleared && remaining.length === 0 && !getDraft()) {
        this.setData({ recordsReadFailed: false })
        this.loadSettings()
        wx.showToast({ title: "本地观象数据已清空", icon: "success" })
      } else {
        wx.showToast({ title: "仍有本地数据未清除，请重试", icon: "none" })
      }
    } catch (error) {
      wx.showToast({ title: storageErrorMessage(error), icon: "none" })
    }
  },

  replayGuide() {
    wx.navigateTo({
      url: "/pages/guide/guide?from=settings",
      fail: () => wx.showToast({ title: "使用说明打开失败，请重试", icon: "none" })
    })
  },

  retryStorage() {
    this.loadSettings()
  },

  resetLocalSettings() {
    try {
      const settings = resetSettings()
      this.setData({
        settings: {
          animations: settings.animations !== false,
          sound: settings.sound !== false,
          vibration: settings.vibration !== false,
          lowPower: Boolean(settings.lowPower),
          autoSave: settings.autoSave !== false
        },
        motionOff: resolveUiPreferences(settings, false).motionOff,
        settingsReadFailed: false
      })
      this.loadSettings()
      wx.showToast({ title: "体验设置已恢复默认", icon: "success" })
    } catch (error) {
      wx.showToast({ title: storageErrorMessage(error), icon: "none" })
    }
  }
})
