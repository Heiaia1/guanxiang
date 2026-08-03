const test = require('node:test')
const assert = require('node:assert/strict')

const {
  STORAGE_SCHEMA_VERSION,
  STORAGE_KEYS,
  createMemoryAdapter,
  createStorageService
} = require('../miniprogram/services/storage-service.ts')

test('设置只更新指定字段，并在重新创建服务后保持', () => {
  const adapter = createMemoryAdapter()
  const first = createStorageService(adapter)

  const defaults = first.getSettings()
  assert.equal(defaults.animation, true)
  assert.equal(defaults.sound, true)

  first.updateSettings({ animation: false, powerSave: true })
  const second = createStorageService(adapter)
  const restored = second.getSettings()

  assert.equal(restored.animation, false)
  assert.equal(restored.powerSave, true)
  assert.equal(restored.sound, true)
  assert.equal(restored.vibration, true)
})

test('设置兼容页面使用的 animations 与 lowPower 键名', () => {
  const adapter = createMemoryAdapter()
  const storage = createStorageService(adapter)

  storage.updateSettings({ animations: false, lowPower: true })
  const restored = createStorageService(adapter).getSettings()

  assert.equal(restored.animations, false)
  assert.equal(restored.animation, false)
  assert.equal(restored.lowPower, true)
  assert.equal(restored.powerSave, true)
})

test('历史记录保留最新一百条普通记录，收藏记录不占这一百条配额', () => {
  const storage = createStorageService(createMemoryAdapter())

  for (let index = 0; index < 105; index += 1) {
    storage.saveRecord({
      id: `record-${index}`,
      hexagramId: (index % 64) + 1,
      favorite: index === 0,
      createdAt: index,
      question: `问题 ${index}`
    })
  }

  const records = storage.getRecords()
  assert.equal(records.length, 101)
  assert.equal(records[0].id, 'record-104')
  assert.ok(records.some((record) => record.id === 'record-0'))
  assert.ok(!records.some((record) => record.id === 'record-1'))
})

test('一百零一条收藏记录都不会被静默删除，卦号始终为整数', () => {
  const storage = createStorageService(createMemoryAdapter())
  for (let index = 0; index < 101; index += 1) {
    storage.saveRecord({
      id: `favorite-${index}`,
      hexagramId: index === 0 ? 1.5 : (index % 64) + 1,
      favorite: true,
      createdAt: index
    })
  }

  const records = storage.getRecords()
  assert.equal(records.length, 101)
  assert.ok(records.some((record) => record.id === 'favorite-0'))
  assert.equal(records.find((record) => record.id === 'favorite-0').hexagramId, 2)
})

test('引导、草稿、收藏与历史记录都能保存并由用户主动清除', () => {
  const storage = createStorageService(createMemoryAdapter())

  assert.equal(storage.hasSeenGuide(), false)
  storage.markGuideSeen()
  assert.equal(storage.hasSeenGuide(), true)

  storage.saveDraft({ category: 'career', question: '是否调整方向' })
  storage.saveDraft({ answers: { action: 80 } })
  assert.deepEqual(storage.getDraft(), {
    category: 'career',
    question: '是否调整方向',
    answers: { action: 80 }
  })
  assert.equal(storage.clearDraft(), true)
  assert.equal(storage.getDraft(), null)

  assert.equal(storage.toggleFavorite(29), true)
  assert.deepEqual(storage.getFavorites(), [29])
  assert.equal(storage.toggleFavorite(29), false)
  assert.deepEqual(storage.getFavorites(), [])

  storage.saveRecord({ id: 'a', hexagramId: 1, createdAt: 1 })
  storage.saveRecord({ id: 'b', hexagramId: 2, createdAt: 2 })
  storage.deleteRecord('a')
  assert.deepEqual(storage.getRecords().map((record) => record.id), ['b'])
  assert.equal(storage.clearRecords(), true)
  assert.deepEqual(storage.getRecords(), [])
})

test('本地存储写入或删除失败时不会误报成功', () => {
  const failingAdapter = {
    get() { return undefined },
    set() { throw new Error('quota exceeded') },
    remove() { throw new Error('storage unavailable') }
  }
  const storage = createStorageService(failingAdapter)

  assert.throws(() => storage.saveRecord({ id: 'x', hexagramId: 1, createdAt: 1 }), /quota exceeded/)
  assert.throws(() => storage.saveDraft({ question: '测试' }), /quota exceeded/)
  assert.equal(storage.clearRecords(), false)
  assert.equal(storage.clearDraft(), false)
})

test('无版本的既有数据只补充独立版本元数据，不重写业务内容', () => {
  const legacy = {
    [STORAGE_KEYS.settings]: {
      animation: false,
      sound: false,
      vibration: true,
      powerSave: true,
      autoSave: false
    },
    [STORAGE_KEYS.records]: [
      { id: 'legacy-record', hexagramId: 29, createdAt: 100, question: '旧问题' }
    ],
    [STORAGE_KEYS.draft]: { category: 'career', question: '旧草稿' },
    [STORAGE_KEYS.favorites]: [29, 1]
  }
  const adapter = createMemoryAdapter(legacy)
  const before = Object.fromEntries(
    Object.keys(legacy).map((key) => [key, adapter.get(key)])
  )
  const storage = createStorageService(adapter)

  assert.equal(adapter.get(STORAGE_KEYS.metadata), undefined)
  assert.equal(storage.getSettings().animations, false)
  assert.equal(storage.getSettings().lowPower, true)
  assert.deepEqual(storage.getRecords().map((item) => item.id), ['legacy-record'])
  assert.deepEqual(storage.getDraft(), { category: 'career', question: '旧草稿' })
  assert.deepEqual(storage.getFavorites(), [1, 29])

  const metadata = adapter.get(STORAGE_KEYS.metadata)
  assert.equal(metadata.schemaVersion, STORAGE_SCHEMA_VERSION)
  assert.ok(Number.isFinite(metadata.migratedAt))
  for (const key of Object.keys(legacy)) {
    assert.deepEqual(adapter.get(key), before[key], `${key} 在迁移时不应被重写`)
  }
})

test('未来版本数据会拒绝读取和写入，原数据保持不变', () => {
  const originalRecords = [
    { id: 'future-record', hexagramId: 8, createdAt: 8, question: '未来数据' }
  ]
  const adapter = createMemoryAdapter({
    [STORAGE_KEYS.metadata]: {
      schemaVersion: STORAGE_SCHEMA_VERSION + 1,
      migratedAt: 1
    },
    [STORAGE_KEYS.records]: originalRecords
  })
  const storage = createStorageService(adapter)

  assert.throws(() => storage.getRecords(), /高于当前支持版本/)
  assert.throws(
    () => storage.saveRecord({ id: 'new', hexagramId: 1, createdAt: 9 }),
    /高于当前支持版本/
  )
  assert.deepEqual(adapter.get(STORAGE_KEYS.records), originalRecords)
  assert.deepEqual(storage.getStorageStatus(), {
    ok: false,
    schemaVersion: null,
    code: 'FUTURE_SCHEMA',
    message: '本地数据来自更高版本，当前版本已停止读写以保护原数据。请更新小程序后重试。'
  })
})

test('观象记录瞬时读取失败时拒绝保存和删除，不会用空数组覆盖旧记录', () => {
  const originalRecords = [
    { id: 'old', hexagramId: 1, createdAt: 1, question: '可恢复旧数据' }
  ]
  const values = {
    [STORAGE_KEYS.metadata]: {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      migratedAt: 1
    },
    [STORAGE_KEYS.records]: structuredClone(originalRecords)
  }
  let failRecordReads = 2
  let recordWrites = 0
  const adapter = {
    get(key) {
      if (key === STORAGE_KEYS.records && failRecordReads > 0) {
        failRecordReads -= 1
        throw new Error('transient read failure')
      }
      return structuredClone(values[key])
    },
    set(key, value) {
      if (key === STORAGE_KEYS.records) recordWrites += 1
      values[key] = structuredClone(value)
    },
    remove(key) {
      delete values[key]
    }
  }
  const storage = createStorageService(adapter)

  assert.throws(
    () => storage.saveRecord({ id: 'new', hexagramId: 2, createdAt: 2 }),
    /transient read failure/
  )
  assert.throws(() => storage.deleteRecord('old'), /transient read failure/)
  assert.equal(recordWrites, 0)
  assert.deepEqual(values[STORAGE_KEYS.records], originalRecords)
  assert.deepEqual(storage.getRecords(), originalRecords)
})

test('损坏的记录、草稿、设置和收藏不会被普通写操作覆盖', () => {
  const cases = [
    {
      key: STORAGE_KEYS.records,
      value: { broken: true },
      mutate(storage) {
        storage.saveRecord({ id: 'new', hexagramId: 1, createdAt: 1 })
      }
    },
    {
      key: STORAGE_KEYS.draft,
      value: ['broken'],
      mutate(storage) {
        storage.saveDraft({ question: '新问题' })
      }
    },
    {
      key: STORAGE_KEYS.settings,
      value: { animations: 'yes' },
      mutate(storage) {
        storage.updateSettings({ animations: false })
      }
    },
    {
      key: STORAGE_KEYS.favorites,
      value: { id: 29 },
      mutate(storage) {
        storage.toggleFavorite(29)
      }
    }
  ]

  for (const item of cases) {
    const adapter = createMemoryAdapter({
      [STORAGE_KEYS.metadata]: {
        schemaVersion: STORAGE_SCHEMA_VERSION,
        migratedAt: 1
      },
      [item.key]: item.value
    })
    const storage = createStorageService(adapter)
    assert.throws(() => item.mutate(storage), /结构异常|类型异常/)
    assert.deepEqual(adapter.get(item.key), item.value)
  }
})

test('设置读取失败不会覆盖原值，用户显式重置后才恢复默认设置', () => {
  const original = { animations: false, sound: false, vibration: false, lowPower: true, autoSave: false }
  const values = {
    [STORAGE_KEYS.metadata]: {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      migratedAt: 1
    },
    [STORAGE_KEYS.settings]: structuredClone(original)
  }
  let failNextSettingsRead = true
  let settingsWrites = 0
  const adapter = {
    get(key) {
      if (key === STORAGE_KEYS.settings && failNextSettingsRead) {
        failNextSettingsRead = false
        throw new Error('settings temporarily unavailable')
      }
      return structuredClone(values[key])
    },
    set(key, value) {
      if (key === STORAGE_KEYS.settings) settingsWrites += 1
      values[key] = structuredClone(value)
    },
    remove(key) {
      delete values[key]
    }
  }
  const storage = createStorageService(adapter)

  assert.throws(() => storage.updateSettings({ sound: true }), /temporarily unavailable/)
  assert.equal(settingsWrites, 0)
  assert.deepEqual(values[STORAGE_KEYS.settings], original)

  const defaults = storage.resetSettings()
  assert.equal(defaults.animations, true)
  assert.equal(defaults.sound, true)
  assert.equal(values[STORAGE_KEYS.settings], undefined)
})

test('静默丢弃写入也会被回读校验识别，不会返回伪成功', () => {
  const values = {
    [STORAGE_KEYS.metadata]: {
      schemaVersion: STORAGE_SCHEMA_VERSION,
      migratedAt: 1
    },
    [STORAGE_KEYS.records]: []
  }
  const adapter = {
    get(key) {
      return structuredClone(values[key])
    },
    set(key, value) {
      if (key !== STORAGE_KEYS.records) values[key] = structuredClone(value)
    },
    remove(key) {
      delete values[key]
    }
  }
  const storage = createStorageService(adapter)

  assert.throws(
    () => storage.saveRecord({ id: 'lost', hexagramId: 1, createdAt: 1 }),
    /校验失败/
  )
  assert.deepEqual(values[STORAGE_KEYS.records], [])
})

test('动效偏好读取异常时使用安全默认值，不阻塞页面启动', () => {
  const Module = require('node:module')
  const storagePath = require.resolve('../miniprogram/services/storage-service.ts')
  const preferencesPath = require.resolve('../miniprogram/services/ui-preferences.ts')
  const originalWx = globalThis.wx
  const originalResolveFilename = Module._resolveFilename

  try {
    delete require.cache[storagePath]
    delete require.cache[preferencesPath]
    globalThis.wx = {
      getStorageSync() {
        throw new Error('temporary device storage failure')
      },
      setStorageSync() {
        throw new Error('temporary device storage failure')
      },
      removeStorageSync() {
        throw new Error('temporary device storage failure')
      }
    }
    Module._resolveFilename = function resolveTypeScript(request, parent, isMain, options) {
      if (request === './storage-service' && parent?.filename === preferencesPath) return storagePath
      return originalResolveFilename.call(this, request, parent, isMain, options)
    }
    const { getUiPreferences } = require(preferencesPath)
    assert.deepEqual(getUiPreferences(true), {
      animationsEnabled: true,
      motionOff: false,
      lowPower: true
    })
  } finally {
    Module._resolveFilename = originalResolveFilename
    delete require.cache[storagePath]
    delete require.cache[preferencesPath]
    if (originalWx === undefined) delete globalThis.wx
    else globalThis.wx = originalWx
  }
})
