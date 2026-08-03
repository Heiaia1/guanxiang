declare const require: (path: string) => any

const {
  getHexagramById,
  getHexagramLines
} = require("../../services/hexagram-engine")
const {
  getFavorites,
  toggleFavorite,
  hasSeenGuide
} = require("../../services/storage-service")
const { getUiPreferences } = require("../../services/ui-preferences")

Page({
  data: {
    loading: true,
    error: "",
    hexagram: null as any,
    lines: [] as any[],
    activeLine: 0,
    isFavorite: false,
    motionOff: false
  },

  onLoad(options: Record<string, string>) {
    const app = getApp<{ globalData: { lowPerformance: boolean } }>()
    const visual = getUiPreferences(Boolean(app.globalData.lowPerformance))
    this.setData({ motionOff: visual.motionOff })
    const id = Number(options.id)
    if (!hasSeenGuide()) {
      this.redirectToGuide(id)
      return
    }
    if (!Number.isInteger(id) || id < 1 || id > 64) {
      this.setData({
        loading: false,
        error: "卦象编号无效，请返回文化馆重新选择。"
      })
      return
    }
    try {
      const hexagram = getHexagramById(id)
      const lines = getHexagramLines(id)
      if (!hexagram || !Array.isArray(lines) || lines.length !== 6) {
        throw new Error("hexagram incomplete")
      }
      const favorites = getFavorites() || []
      this.setData({
        loading: false,
        hexagram,
        lines,
        isFavorite: favorites.includes(id)
      })
      wx.setNavigationBarTitle({ title: `${hexagram.name}卦 · 文化详解` })
    } catch (_error) {
      this.setData({
        loading: false,
        error: "这条卦象内容没有完整加载，请稍后重新进入。"
      })
    }
  },

  redirectToGuide(id: number) {
    const validId = Number.isInteger(id) && id >= 1 && id <= 64
    const url = validId
      ? `/pages/guide/guide?returnTo=hexagram&id=${id}`
      : "/pages/guide/guide?returnTo=library"
    wx.redirectTo({
      url,
      fail: () => {
        this.setData({ loading: false, error: "首次说明打开失败，请返回后重试。" })
      }
    })
  },

  toggleLine(event: WechatMiniprogram.BaseEvent) {
    const position = Number(event.currentTarget.dataset.position)
    this.setData({
      activeLine: this.data.activeLine === position ? 0 : position
    })
  },

  toggleFavorite() {
    if (!hasSeenGuide()) {
      this.redirectToGuide(Number(this.data.hexagram?.id))
      return
    }
    if (!this.data.hexagram) return
    try {
      const expected = !this.data.isFavorite
      toggleFavorite(this.data.hexagram.id)
      const isFavorite = (getFavorites() || []).includes(this.data.hexagram.id)
      if (isFavorite !== expected) throw new Error("favorite not persisted")
      this.setData({ isFavorite: expected })
      wx.showToast({ title: expected ? "已收藏" : "已取消收藏", icon: "none" })
    } catch (_error) {
      wx.showToast({ title: "收藏状态更新失败", icon: "none" })
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

  backToLibrary() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack()
    } else {
      wx.reLaunch({ url: "/pages/library/library" })
    }
  },

  onShareAppMessage() {
    const hexagram = this.data.hexagram
    return {
      title: hexagram
        ? `观象录 · ${hexagram.name}：${hexagram.summary}`
        : "观象录 · 六十四卦文化馆",
      path: hexagram
        ? `/pages/hexagram-detail/hexagram-detail?id=${hexagram.id}`
        : "/pages/library/library"
    }
  }
})
