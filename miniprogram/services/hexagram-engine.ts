declare const module: { exports: unknown }
declare function require(path: string): any

interface HexagramLine {
  position: number
  label: string
  traditional: string
  plain: string
}

interface Hexagram {
  id: number
  name: string
  pinyin: string
  symbol: string
  upperTrigram: string
  lowerTrigram: string
  keywords: string[]
  summary: string
  traditional: string
  plain: string
  advantages: string[]
  risks: string[]
  actions: string[]
  lines?: HexagramLine[]
}

interface TrigramContent {
  id: number
  name: string
  pinyin: string
  binary: string
}

const HEXAGRAMS = require('../data/hexagrams-data') as Hexagram[]
const TRIGRAMS = require('../data/trigrams-data') as TrigramContent[]
const TRIGRAM_ALIASES: Record<string, string> = {
  qian: '乾',
  kun: '坤',
  zhen: '震',
  xun: '巽',
  kan: '坎',
  li: '离',
  gen: '艮',
  dui: '兑'
}

const LINE_FALLBACKS: Array<Omit<HexagramLine, 'traditional'>> = [
  {
    position: 1,
    label: '初爻 · 看清起点',
    plain: '先确认问题刚出现时的事实，不急着把早期信号解释成最终走向。'
  },
  {
    position: 2,
    label: '二爻 · 建立支点',
    plain: '从身边可用的资源与可靠关系开始，建立一个能够持续推进的支点。'
  },
  {
    position: 3,
    label: '三爻 · 行动复核',
    plain: '行动临近时重新检查准备、代价和退路，避免让紧迫感替代判断。'
  },
  {
    position: 4,
    label: '四爻 · 观察影响',
    plain: '事情开始影响他人和外部环境，需要通过沟通确认边界与真实反馈。'
  },
  {
    position: 5,
    label: '五爻 · 把握关键',
    plain: '进入关键阶段后应聚焦最重要的条件，用事实决定资源和责任如何分配。'
  },
  {
    position: 6,
    label: '上爻 · 防止过度',
    plain: '当一种做法已经接近极限，应停下来复盘，给转向与恢复保留空间。'
  }
]

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function validId(value: unknown): number | null {
  const id = Number(value)
  if (!Number.isInteger(id) || id < 1 || id > 64) return null
  return id
}

function getAllHexagrams(): Hexagram[] {
  return clone(HEXAGRAMS).sort((a, b) => a.id - b.id)
}

function getHexagramById(value: unknown): Hexagram | null {
  const id = validId(value)
  if (id === null) return null
  const found = HEXAGRAMS.find((item) => item.id === id)
  return found ? clone(found) : null
}

function hasCompleteLines(lines: unknown): lines is HexagramLine[] {
  return Array.isArray(lines) &&
    lines.length === 6 &&
    lines.every((line, index) => Boolean(
      line &&
      typeof line === 'object' &&
      Number((line as HexagramLine).position) === index + 1 &&
      typeof (line as HexagramLine).plain === 'string'
    ))
}

function getHexagramLines(value: unknown): HexagramLine[] {
  const hexagram = getHexagramById(value)
  if (!hexagram) return []
  if (hasCompleteLines(hexagram.lines)) return clone(hexagram.lines)

  return LINE_FALLBACKS.map((line) => ({
    ...line,
    traditional: `${hexagram.name}卦第${line.position}爻`,
    plain: `${line.plain}${hexagram.summary}`
  }))
}

function getTrigramLines(value: unknown): number[] {
  const key = String(value || '').toLowerCase()
  const name = TRIGRAM_ALIASES[key] || String(value || '')
  const trigram = TRIGRAMS.find((item) => item.name === name || item.pinyin.toLowerCase() === key)
  const binary = trigram?.binary || '111'
  return binary.split('').reverse().map((bit) => bit === '1' ? 1 : 0)
}

module.exports = {
  getAllHexagrams,
  getHexagramById,
  getHexagramLines,
  getTrigramLines
}
