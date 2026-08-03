declare const require: (path: string) => any

const { hasSeenGuide, markGuideSeen } = require("../../services/storage-service")
const { getUiPreferences } = require("../../services/ui-preferences")
const { resolveGuideReturn } = require("../../utils/navigation")
const LEGAL_CONTENT = require("../../data/legal-documents.json") as {
  documents: any[]
}

Page({
  data: {
    accepted: false,
    submitting: false,
    reviewMode: false,
    motionOff: false,
    returnUrl: "/pages/home/home",
    legalDocuments: LEGAL_CONTENT.documents,
    activeDocument: null as any,
    legalVisible: false
  },

  onLoad(options: Record<string, string>) {
    const app = getApp<{ globalData: { lowPerformance: boolean } }>()
    const visual = getUiPreferences(Boolean(app.globalData.lowPerformance))
    this.setData({
      reviewMode: options.from === "settings",
      motionOff: visual.motionOff,
      returnUrl: resolveGuideReturn(options)
    })
  },

  openLegal(event: WechatMiniprogram.BaseEvent) {
    const id = String(event.currentTarget.dataset.document || "")
    const document = LEGAL_CONTENT.documents.find((item) => item.id === id)
    if (!document) {
      wx.showToast({ title: "说明内容暂时无法读取", icon: "none" })
      return
    }
    this.setData({ activeDocument: document, legalVisible: true })
  },

  closeLegal() {
    this.setData({ activeDocument: null, legalVisible: false })
  },

  toggleAccepted() {
    this.setData({ accepted: !this.data.accepted })
  },

  enter() {
    if (!this.data.accepted || this.data.submitting) return
    this.setData({ submitting: true })
    try {
      markGuideSeen()
      if (!hasSeenGuide()) throw new Error("guide state not persisted")
      if (this.data.reviewMode) {
        wx.navigateBack({
          fail: () => wx.reLaunch({ url: "/pages/settings/settings" })
        })
      } else if (this.data.returnUrl !== "/pages/home/home") {
        wx.redirectTo({
          url: this.data.returnUrl,
          fail: () => wx.reLaunch({ url: "/pages/home/home" })
        })
      } else {
        wx.reLaunch({ url: "/pages/home/home" })
      }
    } catch (_error) {
      this.setData({ submitting: false })
      wx.showToast({ title: "本地设置保存失败，请重试", icon: "none" })
    }
  },

  leave() {
    if (this.data.reviewMode) {
      wx.navigateBack({
        fail: () => wx.reLaunch({ url: "/pages/settings/settings" })
      })
      return
    }
    if (wx.exitMiniProgram) {
      wx.exitMiniProgram()
      return
    }
    wx.navigateBack()
  }
})
