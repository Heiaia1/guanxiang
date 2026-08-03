declare const require: (path: string) => any

const { hasSeenGuide } = require("../../services/storage-service")
const { getUiPreferences } = require("../../services/ui-preferences")

Page({
  data: {
    leaving: false,
    reducedMotion: false,
    motionOff: false
  },

  timer: 0 as number,

  onLoad() {
    const app = getApp<{ globalData: { lowPerformance: boolean } }>()
    const lowPerformance = Boolean(app.globalData.lowPerformance)
    const visual = getUiPreferences(lowPerformance)
    this.setData({
      reducedMotion: lowPerformance || visual.lowPower || visual.motionOff,
      motionOff: visual.motionOff
    })
  },

  onReady() {
    this.timer = setTimeout(() => this.continue(), this.data.reducedMotion ? 900 : 2600) as unknown as number
  },

  onUnload() {
    if (this.timer) clearTimeout(this.timer)
  },

  skip() {
    this.continue()
  },

  continue() {
    if (this.data.leaving) return
    this.setData({ leaving: true })
    let guided = false
    try {
      guided = Boolean(hasSeenGuide())
    } catch (_error) {
      guided = false
    }
    wx.reLaunch({
      url: guided ? "/pages/home/home" : "/pages/guide/guide"
    })
  }
})
