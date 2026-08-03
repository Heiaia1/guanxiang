const test = require('node:test')
const assert = require('node:assert/strict')

const {
  getAllHexagrams,
  getHexagramById,
  getHexagramLines,
  getTrigramLines
} = require('../miniprogram/services/hexagram-engine.ts')

test('文化馆公开完整的六十四卦，并能读取单卦六爻', () => {
  const all = getAllHexagrams()
  assert.equal(all.length, 64)
  assert.deepEqual(all.map((item) => item.id), Array.from({ length: 64 }, (_, index) => index + 1))

  const kan = getHexagramById(29)
  assert.equal(kan.name, '坎')
  assert.equal(kan.upperTrigram, '坎')
  assert.equal(kan.lowerTrigram, '坎')
  assert.equal(kan.keywords.length, 3)

  const lines = getHexagramLines(29)
  assert.equal(lines.length, 6)
  assert.deepEqual(lines.map((line) => line.position), [1, 2, 3, 4, 5, 6])
  assert.ok(lines.every((line) => line.plain.length >= 8))
  assert.equal(getHexagramById(0), null)
  assert.equal(getHexagramById(65), null)
})

test('八卦线序直接来自 trigrams.json，并转为自下而上', () => {
  assert.deepEqual(getTrigramLines('乾'), [1, 1, 1])
  assert.deepEqual(getTrigramLines('震'), [1, 0, 0])
  assert.deepEqual(getTrigramLines('zhen'), [1, 0, 0])
  assert.deepEqual(getTrigramLines('巽'), [0, 1, 1])
  assert.deepEqual(getTrigramLines('兑'), [1, 1, 0])
  assert.deepEqual(getTrigramLines('unknown'), [1, 1, 1])
})
