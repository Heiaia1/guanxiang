declare const module: { exports: unknown }

const PINYIN_TONE_GROUPS: Array<[RegExp, string]> = [
  [/[āáǎà]/g, 'a'],
  [/[ēéěè]/g, 'e'],
  [/[īíǐì]/g, 'i'],
  [/[ōóǒò]/g, 'o'],
  [/[ūúǔù]/g, 'u'],
  [/[üǖǘǚǜ]/g, 'v']
]

function normalizePinyinSearch(value: unknown): string {
  let normalized = String(value || '').trim().toLocaleLowerCase()
  for (const [pattern, replacement] of PINYIN_TONE_GROUPS) {
    normalized = normalized.replace(pattern, replacement)
  }
  return normalized.replace(/\s+/g, '')
}

module.exports = {
  normalizePinyinSearch
}
