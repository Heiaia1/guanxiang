declare const require: (path: string) => any

const {
  analyzeSituation,
  castTraditionalCoins
} = require("../../services/analysis-engine")
const { getHexagramById } = require("../../services/hexagram-engine")
const {
  getDraft,
  saveDraft,
  getSettings
} = require("../../services/storage-service")
const { getTrigramLines } = require('../../services/hexagram-engine')
const { getUiPreferences } = require('../../services/ui-preferences')
const { isUpwardCoinGesture } = require('../../utils/gesture')

interface CoinGesturePoint {
  x: number
  y: number
  time: number
}

interface CastLine {
  index: number
  yin: boolean
  changing: boolean
  value: number
}

function normalizeLine(raw: any, index: number): CastLine {
  if (typeof raw === "number") {
    const value = [6, 7, 8, 9].includes(raw) ? raw : raw ? 7 : 8
    return {
      index: index + 1,
      yin: value === 6 || value === 8,
      changing: value === 6 || value === 9,
      value
    }
  }
  const value = Number(raw?.value || raw?.number || (raw?.yin ? 8 : 7))
  return {
    index: index + 1,
    yin: typeof raw?.yin === "boolean" ? raw.yin : value === 6 || value === 8,
    changing: Boolean(raw?.changing || raw?.isChanging || value === 6 || value === 9),
    value
  }
}

function linesFromResult(result: any): CastLine[] {
  if (Array.isArray(result?.lines) && result.lines.length >= 6) {
    return result.lines.slice(0, 6).map(normalizeLine)
  }
  const lower = getTrigramLines(result?.lowerTrigram)
  const upper = getTrigramLines(result?.upperTrigram)
  return [...lower, ...upper].map((solid, index) => ({
    index: index + 1,
    yin: solid === 0,
    changing: index + 1 === Number(result?.changingLine || 0),
    value: solid === 0 ? (index + 1 === Number(result?.changingLine) ? 6 : 8) :
      (index + 1 === Number(result?.changingLine) ? 9 : 7)
  }))
}

function enrichWithHexagram(result: any): any {
  const hexagram = getHexagramById(result?.hexagramId)
  if (!hexagram) return result
  return {
    ...hexagram,
    ...result,
    upperTrigram: result?.upperTrigram || hexagram.upperTrigram,
    lowerTrigram: result?.lowerTrigram || hexagram.lowerTrigram,
    keywords: Array.isArray(result?.keywords) ? result.keywords : hexagram.keywords,
    summary: result?.summary || hexagram.summary,
    actions: Array.isArray(result?.actions) ? result.actions : hexagram.actions
  }
}

Page({
  data: {
    mode: "",
    dailyMode: false,
    started: false,
    completed: false,
    spinning: false,
    autoRunning: false,
    castCount: 0,
    lines: [] as CastLine[],
    preparedLines: [] as CastLine[],
    statusText: "选择一种成象方式",
    error: "",
    animations: true,
    sound: true,
    vibration: true,
    lowPower: false,
    motionOff: false,
    particles: [1, 2, 3, 4, 5, 6, 7, 8],
    coinValues: [
      { id: 1, value: 2 },
      { id: 2, value: 3 },
      { id: 3, value: 2 }
    ]
  },

  draft: null as any,
  result: null as any,
  timers: [] as number[],
  interrupted: false,
  audioContext: null as any,
  coinGestureStart: null as CoinGesturePoint | null,
  coinGestureLast: null as CoinGesturePoint | null,
  ignoreCoinTapUntil: 0,

  onLoad(options: Record<string, string>) {
    try {
      const draft = getDraft() || {}
      const settings = getSettings() || {}
      const app = getApp<{ globalData: { lowPerformance: boolean } }>()
      const visual = getUiPreferences(Boolean(app.globalData.lowPerformance))
      const lowPower = visual.lowPower
      this.draft = draft
      this.setData({
        animations: visual.animationsEnabled,
        sound: settings.sound !== false,
        vibration: settings.vibration !== false,
        lowPower,
        motionOff: visual.motionOff,
        particles: lowPower ? [1, 2, 3] : [1, 2, 3, 4, 5, 6, 7, 8]
      })

      if (options.mode === "daily" || draft.mode === "daily") {
        if (!draft.result) throw new Error("daily result missing")
        this.result = enrichWithHexagram(draft.result)
        const preparedLines = linesFromResult(this.result)
        this.setData({
          mode: "daily",
          dailyMode: true,
          started: true,
          preparedLines,
          statusText: "今日之象，正在展开"
        })
        this.schedule(() => this.startAutomatic(), 420)
        return
      }

      if (!draft.category || !draft.question || !draft.answers) {
        throw new Error("context draft missing")
      }
    } catch (_error) {
      this.setData({
        error: "没有读取到完整的观象内容，请返回重新填写。",
        statusText: "暂时无法成象"
      })
    }
  },

  onHide() {
    this.interrupted = true
    this.clearTimers()
    if (this.data.spinning) this.setData({ spinning: false })
    if (this.data.autoRunning) this.setData({ autoRunning: false })
  },

  onShow() {
    if (!this.interrupted || this.data.error) return
    this.interrupted = false
    if (this.data.completed) {
      wx.redirectTo({ url: "/pages/result/result" })
      return
    }
    if (this.data.mode === "coin") {
      if (this.data.castCount >= 6) this.completeCast()
      return
    }
    if (this.data.started) this.schedule(() => this.startAutomatic(), 260)
  },

  onUnload() {
    this.clearTimers()
    this.closeAudioContext()
  },

  schedule(callback: () => void, delay: number) {
    const timer = setTimeout(callback, delay) as unknown as number
    this.timers.push(timer)
  },

  clearTimers() {
    this.timers.forEach((timer) => clearTimeout(timer))
    this.timers = []
  },

  chooseContext() {
    if (this.data.started || this.data.error) return
    this.setData({ mode: "context", statusText: "让现实条件形成上下之象" })
  },

  chooseCoin() {
    if (this.data.started || this.data.error) return
    this.setData({ mode: "coin", statusText: "六次投掷，从下向上形成六爻" })
  },

  begin() {
    if (!this.data.mode || this.data.started || this.data.error) return
    if (this.data.mode === "coin") {
      this.prepareCoinMode()
      return
    }
    this.prepareContextMode()
  },

  prepareContextMode() {
    try {
      const result = enrichWithHexagram(analyzeSituation({
        category: this.draft.category,
        question: this.draft.question,
        answers: this.draft.answers
      }))
      this.result = result
      if (result?.status === "blocked") {
        const saved = saveDraft({
          ...this.draft,
          mode: "context",
          result,
          earlyBlocked: false,
          updatedAt: Date.now()
        })
        if (saved?.result?.status !== "blocked") {
          throw new Error("blocked result not persisted")
        }
        wx.redirectTo({ url: "/pages/result/result" })
        return
      }
      const preparedLines = linesFromResult(result)
      this.setData({
        started: true,
        preparedLines,
        statusText: "六爻正在由下而上形成"
      })
      this.startAutomatic()
    } catch (_error) {
      this.setData({
        error: "情境分析没有完成，请返回检查输入后再试。",
        statusText: "成象中断"
      })
    }
  },

  prepareCoinMode() {
    try {
      const raw = castTraditionalCoins()
      const result = enrichWithHexagram(raw?.result || raw)
      const sourceLines = raw?.lines || result?.lines
      const preparedLines = Array.isArray(sourceLines) && sourceLines.length >= 6
        ? sourceLines.slice(0, 6).map(normalizeLine)
        : linesFromResult(result)
      this.result = {
        ...result,
        status: result?.status || "ready",
        lines: preparedLines
      }
      this.setData({
        started: true,
        preparedLines,
        lines: [],
        castCount: 0,
        statusText: "轻触铜钱，完成第一次投掷"
      })
    } catch (_error) {
      this.setData({
        error: "铜钱互动初始化失败，请返回后重试。",
        statusText: "铜钱尚未就绪"
      })
    }
  },

  startAutomatic() {
    if (this.data.autoRunning || this.data.completed) return
    const startIndex = this.data.lines.length
    if (startIndex >= 6) {
      this.completeCast()
      return
    }
    this.setData({ autoRunning: true })

    if (!this.data.animations) {
      this.setData({
        lines: this.data.preparedLines,
        castCount: 6,
        autoRunning: false,
        statusText: "六爻已成"
      })
      this.schedule(() => this.completeCast(), 260)
      return
    }

    const interval = this.data.lowPower ? 260 : 410
    for (let index = startIndex; index < 6; index += 1) {
      this.schedule(() => {
        const nextLines = this.data.preparedLines.slice(0, index + 1)
        this.setData({
          lines: nextLines,
          castCount: index + 1,
          statusText: index === 5 ? "六爻已成" : `第 ${index + 1} 爻已定`
        })
        this.playChime(index + 1)
        if (index === 5) {
          this.setData({ autoRunning: false })
          this.schedule(() => this.completeCast(), 520)
        }
      }, (index - startIndex) * interval)
    }
  },

  tossCoin() {
    if (
      this.data.mode !== "coin" ||
      !this.data.started ||
      this.data.spinning ||
      this.data.completed ||
      this.data.castCount >= 6
    ) return

    const nextIndex = this.data.castCount
    const line = this.data.preparedLines[nextIndex]
    const rawCoinValues = line.value === 6 ? [2, 2, 2] :
      line.value === 9 ? [3, 3, 3] :
      line.value === 7 ? [3, 2, 2] : [3, 3, 2]
    const coinValues = rawCoinValues.map((value, index) => ({
      id: index + 1,
      value
    }))
    this.setData({ spinning: true, coinValues })
    const duration = !this.data.animations ? 70 :
      this.data.lowPower ? 360 :
      nextIndex < 2 ? 760 : nextIndex === 5 ? 680 : 500

    this.schedule(() => {
      const lines = [...this.data.lines, line]
      const castCount = nextIndex + 1
      this.setData({
        spinning: false,
        lines,
        castCount,
        statusText: castCount === 6 ? "六次投掷完成，六爻已成" : `第 ${castCount} 爻已定，再投 ${6 - castCount} 次`
      })
      this.playChime(castCount)
      this.haptic()
      if (castCount === 6) {
        this.schedule(() => this.completeCast(), 620)
      }
    }, duration)
  },

  coinTouchStart(event: any) {
    if (
      this.data.mode !== "coin" ||
      !this.data.started ||
      this.data.spinning ||
      this.data.completed ||
      this.data.castCount >= 6
    ) return
    const touch = event?.touches?.[0]
    if (!touch) return
    const point = {
      x: Number(touch.clientX),
      y: Number(touch.clientY),
      time: Number(event.timeStamp)
    }
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return
    if (!Number.isFinite(point.time)) point.time = Date.now()
    this.coinGestureStart = point
    this.coinGestureLast = point
  },

  coinTouchMove(event: any) {
    if (!this.coinGestureStart) return
    const touch = event?.touches?.[0]
    if (!touch) return
    const point = {
      x: Number(touch.clientX),
      y: Number(touch.clientY),
      time: Number(event.timeStamp)
    }
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return
    if (!Number.isFinite(point.time)) point.time = Date.now()
    this.coinGestureLast = point
  },

  coinTouchEnd(event: any) {
    const start = this.coinGestureStart
    const touch = event?.changedTouches?.[0]
    const fallback = this.coinGestureLast
    this.coinGestureStart = null
    this.coinGestureLast = null
    if (!start || (!touch && !fallback)) return
    const end = touch ? {
      x: Number(touch.clientX),
      y: Number(touch.clientY),
      time: Number(event.timeStamp)
    } : fallback as CoinGesturePoint
    if (!Number.isFinite(end.x) || !Number.isFinite(end.y)) return
    if (!Number.isFinite(end.time)) end.time = Date.now()
    if (!isUpwardCoinGesture(start, end)) return
    this.ignoreCoinTapUntil = Date.now() + 420
    this.tossCoin()
  },

  coinTouchCancel() {
    this.coinGestureStart = null
    this.coinGestureLast = null
  },

  tapCoin() {
    if (Date.now() < this.ignoreCoinTapUntil) return
    this.tossCoin()
  },

  playChime(step: number) {
    if (!this.data.sound) return
    try {
      const audio = this.getAudioContext()
      if (!audio) return
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      oscillator.type = "sine"
      oscillator.frequency.value = 210 + step * 24
      gain.gain.setValueAtTime(0.0001, audio.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.055, audio.currentTime + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.18)
      oscillator.connect(gain)
      gain.connect(audio.destination)
      oscillator.start()
      oscillator.stop(audio.currentTime + 0.2)
    } catch (_error) {
      // 音效不可用时不阻断核心流程。
    }
  },

  getAudioContext() {
    if (this.audioContext && this.audioContext.state !== "closed") {
      return this.audioContext
    }
    const createContext = (wx as any).createWebAudioContext
    if (typeof createContext !== "function") return null
    this.audioContext = createContext()
    return this.audioContext
  },

  closeAudioContext() {
    const audio = this.audioContext
    this.audioContext = null
    if (!audio || typeof audio.close !== "function") return
    try {
      audio.close()
    } catch (_error) {
      // 卸载阶段释放失败不再触发用户提示。
    }
  },

  haptic() {
    if (!this.data.vibration) return
    try {
      wx.vibrateShort({ type: "light" })
    } catch (_error) {
      // 设备不支持震动时保持静默。
    }
  },

  completeCast() {
    if (this.data.completed || !this.result) return
    this.setData({ completed: true, statusText: "正在整理观象内容" })
    try {
      const draft = getDraft() || this.draft || {}
      const saved = saveDraft({
        ...draft,
        mode: this.data.mode,
        result: this.result,
        castingLines: this.data.preparedLines,
        updatedAt: Date.now()
      })
      if (!saved?.result || saved?.mode !== this.data.mode) {
        throw new Error("cast result not persisted")
      }
      this.schedule(() => {
        wx.redirectTo({ url: "/pages/result/result" })
      }, this.data.animations ? 420 : 100)
    } catch (_error) {
      this.setData({
        completed: false,
        error: "结果未能保存到本机，请重试。",
        statusText: "保存中断"
      })
    }
  },

  retry() {
    wx.navigateBack()
  },

  goHome() {
    wx.reLaunch({ url: "/pages/home/home" })
  }
})
