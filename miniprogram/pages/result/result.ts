declare const require: (path: string) => any

const {
  getHexagramById
} = require("../../services/hexagram-engine")
const {
  getDraft,
  saveDraft,
  saveRecord,
  getRecords,
  deleteRecord,
  getSettings,
  getFavorites,
  toggleFavorite
} = require("../../services/storage-service")
const { getUiPreferences, resolveTrigramScene } = require("../../services/ui-preferences")
const { scheduleReview, getReviewState, formatReviewDate } = require("../../services/review-service")
const DOMAIN_RULES = require('../../data/domain-rules-data') as Record<string, { name: string }>
const CATEGORY_LABELS = Object.fromEntries(
  Object.entries(DOMAIN_RULES).map(([id, domain]) => [id, domain.name])
) as Record<string, string>

const TRIGRAM_LABELS: Record<string, string> = {
  qian: "乾",
  kun: "坤",
  zhen: "震",
  xun: "巽",
  kan: "坎",
  li: "离",
  gen: "艮",
  dui: "兑"
}

function safeArray(value: any): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item)).filter(Boolean)
    : []
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${date.getFullYear()}.${month}.${day} ${hour}:${minute}`
}

function normalizeTrigram(value: string): string {
  return TRIGRAM_LABELS[value] || value || "乾"
}

Page({
  data: {
    loading: true,
    error: "",
    blocked: false,
    blockTitle: "",
    blockMessage: "",
    blockCategory: "",
    mode: "context",
    modeLabel: "情境观象",
    categoryLabel: "",
    dateText: "",
    name: "",
    pinyin: "",
    symbol: "",
    hexagramId: 1,
    upperTrigram: "乾",
    lowerTrigram: "乾",
    upperScene: "qian",
    lowerScene: "qian",
    changingLine: 0,
    keywords: [] as string[],
    summary: "",
    reflection: "",
    mainConflict: "",
    advantage: "",
    riskNotice: "",
    actions: [] as string[],
    traditional: "",
    plain: "",
    disclaimer: "",
    shareText: "",
    saved: false,
    saving: false,
    doNotSave: false,
    removing: false,
    removeConfirmVisible: false,
    removeConfirmTitle: "",
    removeConfirmMessage: "",
    isFavorite: false,
    shareGenerating: false,
    shareCardPath: "",
    sharePreviewVisible: false,
    motionOff: false
    ,reviewState: "none",
    reviewDate: ""
  },

  draft: null as any,
  rawResult: null as any,
  hexagram: null as any,
  recordId: "",
  fromHistory: false,

  onLoad(options: Record<string, string>) {
    const app = getApp<{ globalData: { lowPerformance: boolean } }>()
    const visual = getUiPreferences(Boolean(app.globalData.lowPerformance))
    this.setData({ motionOff: visual.motionOff })
    this.setShareAvailability(false)
    this.loadResult(options)
  },

  loadResult(options: Record<string, string>) {
    try {
      let draft: any = null
      let rawResult: any = null
      let record: any = null

      if (options.id) {
        record = (getRecords() || []).find((item: any) => item.id === options.id)
        if (!record) throw new Error("record not found")
        this.fromHistory = true
        this.recordId = record.id
        draft = record
        rawResult = record.result || {
          status: "ready",
          hexagramId: record.hexagramId,
          changingLine: record.changingLine,
          summary: record.resultSummary,
          mainConflict: record.mainConflict,
          advantage: record.advantage,
          riskNotice: record.riskNotice,
          actions: record.actions,
          disclaimer: record.disclaimer,
          shareText: record.shareText
        }
      } else {
        draft = getDraft() || {}
        rawResult = draft.result
      }

      if (!rawResult) throw new Error("result missing")
      this.draft = draft
      this.rawResult = rawResult

      if (rawResult.status === "blocked") {
        this.setData({
          loading: false,
          blocked: true,
          blockTitle: rawResult.title || "请优先寻求专业帮助",
          blockMessage: rawResult.message || "这个问题超出了传统文化反思工具可以提供帮助的范围。",
          blockCategory: rawResult.riskCategory || "professional"
        })
        return
      }

      const hexagramId = Number(rawResult.hexagramId || draft.hexagramId)
      const hexagram = getHexagramById(hexagramId)
      if (!hexagram) throw new Error("hexagram missing")
      this.hexagram = hexagram

      const mode = String(draft.mode || "context")
      const createdAt = Number(draft.createdAt || Date.now())
      const keywords = safeArray(rawResult.keywords).length
        ? safeArray(rawResult.keywords)
        : safeArray(hexagram.keywords)
      const actions = safeArray(rawResult.actions).length
        ? safeArray(rawResult.actions)
        : rawResult.action
          ? [String(rawResult.action)]
          : safeArray(hexagram.actions)
      const favorites = getFavorites() || []
      const changingLine = Number(rawResult.changingLine || draft.changingLine || 0)
      const lowerTrigram = normalizeTrigram(rawResult.lowerTrigram || hexagram.lowerTrigram)
      const upperTrigram = normalizeTrigram(rawResult.upperTrigram || hexagram.upperTrigram)

      this.setData({
        loading: false,
        blocked: false,
        mode,
        modeLabel: mode === "daily" ? "今日观象" : mode === "coin" ? "铜钱互动" : "情境观象",
        categoryLabel: CATEGORY_LABELS[draft.category] || "自我反思",
        dateText: formatDate(createdAt),
        name: rawResult.name || hexagram.name,
        pinyin: hexagram.pinyin || "",
        symbol: hexagram.symbol || "",
        hexagramId,
        upperTrigram,
        lowerTrigram,
        upperScene: resolveTrigramScene(upperTrigram),
        lowerScene: resolveTrigramScene(lowerTrigram),
        changingLine,
        keywords,
        summary: rawResult.summary || hexagram.summary,
        reflection: rawResult.reflection || "",
        mainConflict:
          rawResult.mainConflict ||
          (mode === "daily" ? rawResult.reflection : "当前最重要的是把感受转化为可以验证的现实问题。"),
        advantage:
          rawResult.advantage ||
          safeArray(hexagram.advantages)[0] ||
          "你仍有机会从一个可控制的小步骤开始。",
        riskNotice:
          rawResult.riskNotice ||
          safeArray(hexagram.risks).join("；") ||
          "不要在信息不足时作出难以撤回的决定。",
        actions,
        traditional: hexagram.traditional || "",
        plain: hexagram.plain || hexagram.summary || "",
        disclaimer:
          rawResult.disclaimer ||
          "本内容为传统文化互动和个人反思参考，不代表未来必然发生，也不构成专业建议。",
        shareText:
          rawResult.shareText ||
          actions[0] ||
          "先看清条件，再完成一个可以验证的小行动。",
        isFavorite: favorites.includes(hexagramId),
        saved: Boolean(record),
        doNotSave: draft.doNotSave === true,
        reviewState: record ? getReviewState(record) : "none",
        reviewDate: record?.reviewAt ? formatReviewDate(record.reviewAt) : ""
      })
      this.setShareAvailability(true)

      if (!record) {
        const settings = getSettings() || {}
        if (settings.autoSave !== false && draft.doNotSave !== true) {
          this.saveCurrent(true)
        }
      }
    } catch (_error) {
      this.setShareAvailability(false)
      this.setData({
        loading: false,
        error: "结果内容没有完整加载。你可以返回上一步重新生成，已填写的问题仍保留在本机。"
      })
    }
  },

  setShareAvailability(available: boolean) {
    try {
      if (available && typeof wx.showShareMenu === "function") {
        wx.showShareMenu({ menus: ["shareAppMessage"] })
      } else if (!available && typeof wx.hideShareMenu === "function") {
        wx.hideShareMenu({ menus: ["shareAppMessage", "shareTimeline"] })
      }
    } catch (_error) {
      // 分享菜单不可用时不影响结果阅读。
    }
  },

  buildRecord() {
    const draft = this.draft || {}
    const createdAt = Number(draft.createdAt || Date.now())
    if (!this.recordId) {
      this.recordId = typeof draft.recordId === "string" && draft.recordId
        ? draft.recordId
        : `gx-${createdAt}-${this.data.hexagramId}-${this.data.mode}`
    }
    return {
      id: this.recordId,
      mode: this.data.mode,
      category: draft.category || "self",
      question: String(draft.question || ""),
      answers: draft.answers || {},
      answerIds: draft.answerIds || {},
      hexagramId: this.data.hexagramId,
      changingLine: this.data.changingLine,
      resultSummary: this.data.summary,
      mainConflict: this.data.mainConflict,
      advantage: this.data.advantage,
      riskNotice: this.data.riskNotice,
      actions: this.data.actions,
      disclaimer: this.data.disclaimer,
      shareText: this.data.shareText,
      result: this.rawResult,
      castingLines: draft.castingLines || [],
      dailyState: draft.dailyState || "",
      dailyStateLabel: draft.dailyStateLabel || "",
      createdAt,
      favorite: this.data.isFavorite,
      reviewAt: Number(draft.reviewAt || 0),
      reviewedAt: Number(draft.reviewedAt || 0)
    }
  },

  saveCurrent(silent = false) {
    if (this.data.blocked || this.data.saving || this.data.removing || this.data.error) return
    this.setData({ saving: true })
    try {
      const record = saveRecord(this.buildRecord())
      this.recordId = record.id
      const persisted = (getRecords() || []).some((item: any) => item.id === record.id)
      if (!persisted) throw new Error("record not persisted")
      if (!this.fromHistory) {
        const savedDraft = saveDraft({
          ...this.draft,
          recordId: record.id,
          doNotSave: false
        })
        if (savedDraft?.recordId !== record.id || savedDraft?.doNotSave === true) {
          throw new Error("draft save preference not persisted")
        }
        this.draft = savedDraft
      }
      this.setData({ saved: true, saving: false, doNotSave: false })
      if (!silent) wx.showToast({ title: "已保存到本机", icon: "success" })
    } catch (_error) {
      this.setData({ saving: false })
      if (!silent) wx.showToast({ title: "保存失败，请检查存储空间", icon: "none" })
    }
  },

  manualSave() {
    this.saveCurrent(false)
  },

  scheduleThirtyDayReview() {
    if (this.data.blocked || this.data.error || this.data.saving) return
    this.setData({ saving: true })
    try {
      const record = saveRecord(scheduleReview(this.buildRecord()))
      this.recordId = record.id
      this.draft = record
      const persisted = (getRecords() || []).find((item: any) => item.id === record.id)
      if (!persisted?.reviewAt) throw new Error("review not persisted")
      this.setData({
        saved: true,
        saving: false,
        doNotSave: false,
        reviewState: getReviewState(persisted),
        reviewDate: formatReviewDate(persisted.reviewAt)
      })
      wx.showToast({ title: "已安排 30 天后回看", icon: "success" })
    } catch (_error) {
      this.setData({ saving: false })
      wx.showToast({ title: "回看计划保存失败", icon: "none" })
    }
  },

  askRemoveRecord() {
    if (this.data.blocked || this.data.error || this.data.removing) return
    this.setData({
      removeConfirmVisible: true,
      removeConfirmTitle: this.data.saved ? "移除本条记录？" : "确认本次不保存？",
      removeConfirmMessage: this.data.saved
        ? "本次问题、分析与行动建议将从本机记录中移除；文化馆收藏不会受影响。"
        : "本次结果将继续停留在当前页面，但不会加入本机记录。"
    })
  },

  closeRemoveConfirm() {
    if (this.data.removing) return
    this.setData({ removeConfirmVisible: false })
  },

  confirmRemoveRecord() {
    if (this.data.removing || this.data.blocked || this.data.error) return
    const recordId = String(this.recordId || this.draft?.recordId || "")
    this.setData({ removeConfirmVisible: false, removing: true })
    try {
      if (recordId) {
        deleteRecord(recordId)
        if ((getRecords() || []).some((item: any) => item.id === recordId)) {
          throw new Error("record still exists")
        }
      }

      const liveDraft = getDraft()
      const shouldSuppressDraft = !this.fromHistory || liveDraft?.recordId === recordId
      if (shouldSuppressDraft) {
        const draftSource = this.fromHistory ? liveDraft : this.draft
        if (draftSource) {
          const savedDraft = saveDraft({
            ...draftSource,
            recordId: "",
            doNotSave: true,
            updatedAt: Date.now()
          })
          if (savedDraft?.recordId || savedDraft?.doNotSave !== true) {
            throw new Error("do-not-save preference not persisted")
          }
          if (!this.fromHistory) this.draft = savedDraft
        }
      }

      this.recordId = ""
      this.setData({
        saved: false,
        doNotSave: true,
        removing: false
      })
      wx.showToast({ title: recordId ? "本条记录已移除" : "本次将不保存", icon: "none" })
    } catch (_error) {
      // 故障可能来自持续的读取异常；兜底分支不能再次把同一异常抛给页面。
      let stillSaved = Boolean(recordId) && Boolean(this.data.saved)
      try {
        stillSaved = Boolean(recordId) && (getRecords() || []).some((item: any) => item.id === recordId)
      } catch (_readError) {
        // 无法确认持久化状态时保留原 UI 状态，并明确提示用户重试。
      }
      this.setData({ saved: stillSaved, removing: false })
      wx.showToast({ title: "本地记录未完全移除，请重试", icon: "none" })
    }
  },

  toggleFavorite() {
    if (this.data.blocked || this.data.error) return
    try {
      const expected = !this.data.isFavorite
      toggleFavorite(this.data.hexagramId)
      const isFavorite = (getFavorites() || []).includes(this.data.hexagramId)
      if (isFavorite !== expected) throw new Error("favorite not persisted")
      this.setData({ isFavorite: expected })
      if (this.data.saved) {
        saveRecord({ ...this.buildRecord(), favorite: expected })
      }
      wx.showToast({ title: expected ? "已收藏此卦" : "已取消收藏", icon: "none" })
    } catch (_error) {
      wx.showToast({ title: "收藏状态更新失败", icon: "none" })
    }
  },

  openHexagram() {
    const url = `/pages/hexagram-detail/hexagram-detail?id=${this.data.hexagramId}`
    if (getCurrentPages().length >= 9) {
      wx.redirectTo({ url })
      return
    }
    wx.navigateTo({
      url,
      fail: () => wx.redirectTo({ url })
    })
  },

  modifyQuestion() {
    if (this.fromHistory) {
      wx.navigateBack()
      return
    }
    if (this.draft?.earlyBlocked) {
      wx.navigateBack()
      return
    }
    const pages = getCurrentPages()
    if (pages.length >= 3) {
      wx.navigateBack({ delta: 2 })
    } else {
      wx.reLaunch({ url: "/pages/category/category" })
    }
  },

  goHome() {
    wx.reLaunch({ url: "/pages/home/home" })
  },

  openHistory() {
    wx.redirectTo({
      url: "/pages/history/history",
      fail: () => wx.reLaunch({ url: "/pages/history/history" })
    })
  },

  drawRoundRect(context: any, x: number, y: number, width: number, height: number, radius: number) {
    context.beginPath()
    context.moveTo(x + radius, y)
    context.lineTo(x + width - radius, y)
    context.quadraticCurveTo(x + width, y, x + width, y + radius)
    context.lineTo(x + width, y + height - radius)
    context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    context.lineTo(x + radius, y + height)
    context.quadraticCurveTo(x, y + height, x, y + height - radius)
    context.lineTo(x, y + radius)
    context.quadraticCurveTo(x, y, x + radius, y)
    context.closePath()
  },

  drawWrappedText(
    context: any,
    text: string,
    x: number,
    startY: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number
  ) {
    const characters = Array.from(text)
    let line = ""
    let y = startY
    let lineCount = 0
    for (let index = 0; index < characters.length; index += 1) {
      const candidate = line + characters[index]
      if (context.measureText(candidate).width > maxWidth && line) {
        context.fillText(line, x, y)
        line = characters[index]
        y += lineHeight
        lineCount += 1
        if (lineCount >= maxLines - 1) break
      } else {
        line = candidate
      }
    }
    if (line && lineCount < maxLines) context.fillText(line, x, y)
  },

  generateShareCard() {
    if (this.data.shareGenerating || this.data.blocked || this.data.error) return
    this.setData({ shareGenerating: true })
    const query = wx.createSelectorQuery().in(this)
    query.select("#shareCanvas").fields({ node: true, size: true }).exec((result) => {
      const canvasInfo = result && result[0]
      if (!canvasInfo?.node) {
        this.setData({ shareGenerating: false })
        wx.showToast({ title: "分享卡画布初始化失败", icon: "none" })
        return
      }

      try {
        const canvas = canvasInfo.node
        const context = canvas.getContext("2d")
        const width = 600
        const height = 800
        const pixelRatio = Math.min(3, wx.getSystemInfoSync().pixelRatio || 1)
        canvas.width = width * pixelRatio
        canvas.height = height * pixelRatio
        context.scale(pixelRatio, pixelRatio)

        const gradient = context.createLinearGradient(0, 0, width, height)
        gradient.addColorStop(0, "#172221")
        gradient.addColorStop(0.55, "#101718")
        gradient.addColorStop(1, "#0b1011")
        context.fillStyle = gradient
        context.fillRect(0, 0, width, height)

        context.strokeStyle = "rgba(179,154,101,0.28)"
        context.lineWidth = 1
        this.drawRoundRect(context, 24, 24, 552, 752, 24)
        context.stroke()

        context.fillStyle = "rgba(179,154,101,0.11)"
        context.beginPath()
        context.arc(465, 145, 112, 0, Math.PI * 2)
        context.fill()
        context.strokeStyle = "rgba(179,154,101,0.22)"
        context.beginPath()
        context.arc(465, 145, 82, 0, Math.PI * 2)
        context.stroke()

        context.fillStyle = "#bba36d"
        context.font = "22px sans-serif"
        context.fillText("观 象 录", 62, 78)

        context.fillStyle = "#f0e8d8"
        context.font = "76px serif"
        context.fillText(this.data.name, 62, 202)

        context.fillStyle = "rgba(234,229,216,0.48)"
        context.font = "18px sans-serif"
        context.fillText(`${this.data.upperTrigram}上 · ${this.data.lowerTrigram}下`, 66, 238)

        const keywords = this.data.keywords.slice(0, 3)
        context.font = "17px sans-serif"
        let keywordX = 62
        keywords.forEach((keyword) => {
          const keywordWidth = context.measureText(keyword).width + 30
          context.fillStyle = "rgba(102,132,122,0.2)"
          this.drawRoundRect(context, keywordX, 280, keywordWidth, 34, 17)
          context.fill()
          context.fillStyle = "#b8c5bf"
          context.fillText(keyword, keywordX + 15, 303)
          keywordX += keywordWidth + 10
        })

        context.fillStyle = "#d9d1c2"
        context.font = "28px serif"
        this.drawWrappedText(context, this.data.shareText, 62, 390, 470, 45, 4)

        context.strokeStyle = "rgba(179,154,101,0.22)"
        context.beginPath()
        context.moveTo(62, 594)
        context.lineTo(538, 594)
        context.stroke()

        context.fillStyle = "rgba(234,229,216,0.46)"
        context.font = "16px sans-serif"
        context.fillText("今日行动", 62, 636)
        context.fillStyle = "#bfa872"
        context.font = "21px sans-serif"
        this.drawWrappedText(context, this.data.actions[0] || this.data.shareText, 62, 678, 470, 34, 2)

        context.fillStyle = "rgba(234,229,216,0.3)"
        context.font = "14px sans-serif"
        context.fillText("传统文化互动与个人反思参考", 62, 744)

        wx.canvasToTempFilePath({
          canvas,
          fileType: "png",
          quality: 1,
          success: (file) => {
            this.setData({
              shareGenerating: false,
              shareCardPath: file.tempFilePath,
              sharePreviewVisible: true
            })
          },
          fail: () => {
            this.setData({ shareGenerating: false })
            wx.showToast({ title: "分享卡生成失败，请重试", icon: "none" })
          }
        }, this)
      } catch (_error) {
        this.setData({ shareGenerating: false })
        wx.showToast({ title: "分享卡生成失败，请重试", icon: "none" })
      }
    })
  },

  closeSharePreview() {
    this.setData({ sharePreviewVisible: false })
  },

  stopPropagation() {},

  previewShareCard() {
    if (!this.data.shareCardPath) return
    wx.previewImage({
      current: this.data.shareCardPath,
      urls: [this.data.shareCardPath]
    })
  },

  onShareAppMessage() {
    if (this.data.loading || this.data.blocked || this.data.error || !this.data.name) {
      return {
        title: "观象录 · 借古人的象，理清今天的事",
        path: "/pages/home/home"
      }
    }
    const payload: WechatMiniprogram.Page.ICustomShareContent = {
      title: `观象录 · ${this.data.name}：${this.data.shareText}`,
      path: `/pages/hexagram-detail/hexagram-detail?id=${this.data.hexagramId}`
    }
    if (this.data.shareCardPath) payload.imageUrl = this.data.shareCardPath
    return payload
  }
})
