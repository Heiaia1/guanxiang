declare const module: { exports: unknown }
declare function require(path: string): any

const { getSettings } = require('./storage-service')

interface VisualSettings {
  animations?: boolean
  lowPower?: boolean
}

const TRIGRAM_SCENES: Record<string, string> = {
  qian: 'qian', '乾': 'qian',
  kun: 'kun', '坤': 'kun',
  zhen: 'zhen', '震': 'zhen',
  xun: 'xun', '巽': 'xun',
  kan: 'kan', '坎': 'kan',
  li: 'li', '离': 'li',
  gen: 'gen', '艮': 'gen',
  dui: 'dui', '兑': 'dui'
}

function resolveUiPreferences(settings: VisualSettings | null | undefined, lowPerformance = false) {
  const source = settings || {}
  const animationsEnabled = source.animations !== false
  return {
    animationsEnabled,
    motionOff: !animationsEnabled,
    lowPower: Boolean(source.lowPower || lowPerformance)
  }
}

function getUiPreferences(lowPerformance = false) {
  try {
    return resolveUiPreferences(getSettings(), lowPerformance)
  } catch (_error) {
    // 动效偏好不是核心数据；读取异常时使用安全默认值，不能阻塞页面启动。
    return resolveUiPreferences(undefined, lowPerformance)
  }
}

function resolveTrigramScene(value: unknown): string {
  const key = String(value || '').trim().toLocaleLowerCase()
  return TRIGRAM_SCENES[key] || 'qian'
}

module.exports = {
  resolveUiPreferences,
  getUiPreferences,
  resolveTrigramScene
}
