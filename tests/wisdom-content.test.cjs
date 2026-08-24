const test = require('node:test')
const assert = require('node:assert/strict')

const notes = require('../miniprogram/data/wisdom-notes.json')

test('观象札记包含六类至少二十四篇完整的现实反思内容', () => {
  assert.ok(Array.isArray(notes))
  assert.ok(notes.length >= 24)

  const expectedCategories = ['decision', 'work', 'relationship', 'study', 'family', 'self']
  const categories = new Set(notes.map((item) => item.category))
  assert.deepEqual([...categories].sort(), expectedCategories.sort())

  const ids = new Set()
  for (const note of notes) {
    assert.ok(note.id && !ids.has(note.id), `札记 id 重复或为空：${note.id}`)
    ids.add(note.id)
    const minimumLengths = {
      categoryLabel: 4,
      title: 4,
      source: 6,
      principle: 12,
      interpretation: 30,
      reflection: 12,
      action: 12
    }
    for (const [field, minimum] of Object.entries(minimumLengths)) {
      assert.equal(typeof note[field], 'string', `${note.id} 缺少 ${field}`)
      assert.ok(note[field].trim().length >= minimum, `${note.id}.${field} 内容过短`)
    }
  }
})

test('观象札记不使用预测、保证或付费转运式表达', () => {
  const rendered = JSON.stringify(notes)
  for (const phrase of [
    '必定成功', '保证发财', '百分之百准确', '花钱消灾',
    '付费转运', '寿命将尽', '血光之灾', '改命成功'
  ]) {
    assert.ok(!rendered.includes(phrase), `札记含禁用表达：${phrase}`)
  }
})
