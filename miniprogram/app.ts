interface GuanxiangGlobalData {
  lowPerformance: boolean
  devicePixelRatio: number
}

App<{ globalData: GuanxiangGlobalData }>({
  globalData: {
    lowPerformance: false,
    devicePixelRatio: 1
  },

  onLaunch() {
    try {
      const info = wx.getSystemInfoSync()
      const benchmark = typeof info.benchmarkLevel === 'number' ? info.benchmarkLevel : -1
      const memory = typeof info.memorySize === 'number' ? info.memorySize : 0
      this.globalData.lowPerformance =
        (benchmark > 0 && benchmark < 10) || (memory > 0 && memory < 2048)
      this.globalData.devicePixelRatio = info.pixelRatio || 1
    } catch (_error) {
      this.globalData.lowPerformance = true
      this.globalData.devicePixelRatio = 1
    }
  }
})
