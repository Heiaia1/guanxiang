const OFFICIAL_SITE = ["https:", "//guanxiang-app.scfj8gkrzf.chatgpt.site"].join("")
const GITHUB_REPO = ["https:", "//github.com/Heiaia1/guanxiang"].join("")
const COOPERATION_URL = [GITHUB_REPO, "/issues/new?title=", encodeURIComponent("商业合作")].join("")
const { getUiPreferences } = require("../../services/ui-preferences")

Page({
  data: { motionOff: false },

  onLoad() {
    const app = getApp<{ globalData: { lowPerformance: boolean } }>()
    this.setData({ motionOff: getUiPreferences(Boolean(app.globalData.lowPerformance)).motionOff })
  },

  copyLink(event: WechatMiniprogram.BaseEvent) {
    const kind = String(event.currentTarget.dataset.kind || "site")
    const value = kind === "github" ? GITHUB_REPO : kind === "cooperation" ? COOPERATION_URL : OFFICIAL_SITE
    wx.setClipboardData({
      data: value,
      success: () => wx.showToast({ title: "链接已复制", icon: "success" }),
      fail: () => wx.showToast({ title: "复制失败，请重试", icon: "none" })
    })
  },

  onShareAppMessage() {
    return {
      title: "观象录｜传统文化互动与现实行动参考",
      path: "/pages/launch/launch"
    }
  }
})
