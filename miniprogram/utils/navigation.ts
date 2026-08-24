declare const module: { exports: unknown }

interface GuideReturnOptions {
  returnTo?: string
  id?: string | number
}

/**
 * 首次说明只接受固定令牌，不接受任意页面路径，避免把回跳变成开放重定向。
 */
function resolveGuideReturn(options: GuideReturnOptions = {}): string {
  if (options.returnTo === "library") {
    return "/pages/library/library"
  }

  if (options.returnTo === "wisdom") {
    return "/pages/wisdom/wisdom"
  }

  if (options.returnTo === "hexagram") {
    const id = Number(options.id)
    if (Number.isInteger(id) && id >= 1 && id <= 64) {
      return `/pages/hexagram-detail/hexagram-detail?id=${id}`
    }
    return "/pages/library/library"
  }

  return "/pages/home/home"
}

module.exports = {
  resolveGuideReturn
}
