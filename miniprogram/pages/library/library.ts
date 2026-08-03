declare const require: (path: string) => any

const { getAllHexagrams } = require("../../services/hexagram-engine")
const { getFavorites, toggleFavorite, hasSeenGuide } = require("../../services/storage-service")
const { normalizePinyinSearch } = require("../../utils/text")
const { getUiPreferences } = require("../../services/ui-preferences")

Page({
  data: {
    query: "",
    scope: "all",
    hexagrams: [] as any[],
    visibleHexagrams: [] as any[],
    favoriteCount: 0,
    error: "",
    navigating: false,
    redirectingToGuide: false,
    motionOff: false
  },

  onShow() {
    const app = getApp<{ globalData: { lowPerformance: boolean } }>()
    const visual = getUiPreferences(Boolean(app.globalData.lowPerformance))
    this.setData({ navigating: false, motionOff: visual.motionOff })
    if (!hasSeenGuide()) {
      this.redirectToGuide()
      return
    }
    this.setData({ redirectingToGuide: false })
    this.loadHexagrams()
  },

  redirectToGuide() {
    if (this.data.redirectingToGuide) return
    this.setData({ redirectingToGuide: true })
    wx.redirectTo({
      url: "/pages/guide/guide?returnTo=library",
      fail: () => {
        this.setData({ redirectingToGuide: false })
        wx.showToast({ title: "首次说明打开失败，请重试", icon: "none" })
      }
    })
  },

  loadHexagrams() {
    try {
      const favorites: number[] = getFavorites() || []
      const hexagrams = (getAllHexagrams() || []).map((item: any) => ({
        ...item,
        displayId: String(item.id).padStart(2, "0"),
        isFavorite: favorites.includes(item.id)
      }))
      this.setData({
        hexagrams,
        favoriteCount: favorites.length,
        error: ""
      })
      this.applyFilter(hexagrams, this.data.query, this.data.scope)
    } catch (_error) {
      this.setData({
        hexagrams: [],
        visibleHexagrams: [],
        error: "六十四卦内容没有完整加载，请返回后重新进入。"
      })
    }
  },

  onSearch(event: WechatMiniprogram.Input) {
    const query = String(event.detail.value || "")
    this.setData({ query })
    this.applyFilter(this.data.hexagrams, query, this.data.scope)
  },

  clearSearch() {
    this.setData({ query: "" })
    this.applyFilter(this.data.hexagrams, "", this.data.scope)
  },

  setScope(event: WechatMiniprogram.BaseEvent) {
    const scope = event.currentTarget.dataset.scope === "favorites" ? "favorites" : "all"
    this.setData({ scope })
    this.applyFilter(this.data.hexagrams, this.data.query, scope)
  },

  applyFilter(hexagrams: any[], query: string, scope: string) {
    const term = normalizePinyinSearch(query)
    const visibleHexagrams = hexagrams.filter((item) => {
      if (scope === "favorites" && !item.isFavorite) return false
      if (!term) return true
      const searchable = [
        item.id,
        item.name,
        item.pinyin,
        item.upperTrigram,
        item.lowerTrigram,
        ...(item.keywords || [])
      ].map((value) => normalizePinyinSearch(value)).join("")
      return searchable.includes(term)
    })
    this.setData({ visibleHexagrams })
  },

  openDetail(event: WechatMiniprogram.BaseEvent) {
    if (!hasSeenGuide()) {
      this.redirectToGuide()
      return
    }
    if (this.data.navigating) return
    const id = Number(event.currentTarget.dataset.id)
    if (!Number.isInteger(id)) return
    this.setData({ navigating: true })
    wx.navigateTo({
      url: `/pages/hexagram-detail/hexagram-detail?id=${id}`,
      fail: () => {
        this.setData({ navigating: false })
        wx.showToast({ title: "卦象详情打开失败，请重试", icon: "none" })
      }
    })
  },

  toggleFavorite(event: WechatMiniprogram.BaseEvent) {
    if (!hasSeenGuide()) {
      this.redirectToGuide()
      return
    }
    const id = Number(event.currentTarget.dataset.id)
    if (!Number.isInteger(id)) return
    try {
      const current = this.data.hexagrams.find((item) => item.id === id)
      const expected = !current?.isFavorite
      toggleFavorite(id)
      const isFavorite = (getFavorites() || []).includes(id)
      if (isFavorite !== expected) throw new Error("favorite not persisted")
      const hexagrams = this.data.hexagrams.map((item) =>
        item.id === id ? { ...item, isFavorite: expected } : item
      )
      const favoriteCount = hexagrams.filter((item) => item.isFavorite).length
      this.setData({ hexagrams, favoriteCount })
      this.applyFilter(hexagrams, this.data.query, this.data.scope)
    } catch (_error) {
      wx.showToast({ title: "收藏状态更新失败", icon: "none" })
    }
  }
})
