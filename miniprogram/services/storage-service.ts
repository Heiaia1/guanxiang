declare const module: { exports: unknown }

interface StorageAdapter {
  get(key: string): unknown
  set(key: string, value: unknown): void
  remove(key: string): void
}

interface Settings {
  animation: boolean
  animations: boolean
  sound: boolean
  vibration: boolean
  powerSave: boolean
  lowPower: boolean
  autoSave: boolean
}

interface ObservationRecord {
  id: string
  hexagramId: number
  favorite?: boolean
  createdAt: number
  reviewAt?: number
  reviewedAt?: number
  [key: string]: unknown
}

interface StorageMetadata {
  schemaVersion: number
  migratedAt: number
}

type StorageErrorCode =
  | 'READ_FAILED'
  | 'WRITE_FAILED'
  | 'REMOVE_FAILED'
  | 'CORRUPT_DATA'
  | 'FUTURE_SCHEMA'
  | 'VERIFY_FAILED'

class StorageServiceError extends Error {
  code: StorageErrorCode

  constructor(code: StorageErrorCode, message: string) {
    super(message)
    this.name = 'StorageServiceError'
    this.code = code
  }
}

const STORAGE_SCHEMA_VERSION = 1

const STORAGE_KEYS = {
  metadata: 'gx_meta',
  settings: 'gx_settings',
  guideSeen: 'gx_guide_seen',
  draft: 'gx_draft',
  records: 'gx_records',
  favorites: 'gx_favorites'
}

const DEFAULT_SETTINGS: Settings = {
  animation: true,
  animations: true,
  sound: true,
  vibration: true,
  powerSave: false,
  lowPower: false,
  autoSave: true
}

function clone<T>(value: T): T {
  if (value === undefined || value === null) return value
  return JSON.parse(JSON.stringify(value)) as T
}

function isMissing(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function errorDetail(error: unknown): string {
  return error instanceof Error && error.message ? `：${error.message}` : ''
}

function storageErrorMessage(error: unknown): string {
  if (!(error instanceof StorageServiceError)) {
    return '本地数据暂时无法处理。旧数据没有被主动覆盖，请重新进入后再试。'
  }
  if (error.code === 'FUTURE_SCHEMA') {
    return '本地数据来自更高版本，当前版本已停止读写以保护原数据。请更新小程序后重试。'
  }
  if (error.code === 'CORRUPT_DATA') {
    return '本地数据结构异常，原数据已保留且不会被新内容覆盖。可重试，或在设置中确认后清理对应数据。'
  }
  if (error.code === 'READ_FAILED') {
    return '本地存储暂时无法读取，原数据未被覆盖。请释放设备空间或重新进入后再试。'
  }
  if (error.code === 'WRITE_FAILED' || error.code === 'VERIFY_FAILED') {
    return '本地数据没有可靠写入，页面不会显示伪成功。请检查设备存储空间后重试。'
  }
  return '本地数据未能安全清理，原数据可能仍然保留。请重新进入后再试。'
}

function createMemoryAdapter(initial: Record<string, unknown> = {}): StorageAdapter {
  const values = new Map<string, unknown>()
  Object.keys(initial).forEach((key) => values.set(key, clone(initial[key])))

  return {
    get(key: string): unknown {
      return clone(values.get(key))
    },
    set(key: string, value: unknown): void {
      values.set(key, clone(value))
    },
    remove(key: string): void {
      values.delete(key)
    }
  }
}

function assertBooleanFields(candidate: Record<string, unknown>, fields: string[], label: string): void {
  for (const field of fields) {
    if (field in candidate && typeof candidate[field] !== 'boolean') {
      throw new StorageServiceError('CORRUPT_DATA', `${label}字段 ${field} 类型异常`)
    }
  }
}

function normalizeSettings(value: unknown): Settings {
  if (isMissing(value)) return { ...DEFAULT_SETTINGS }
  if (!isPlainObject(value)) {
    throw new StorageServiceError('CORRUPT_DATA', '本地设置结构异常')
  }
  assertBooleanFields(
    value,
    ['animation', 'animations', 'sound', 'vibration', 'powerSave', 'lowPower', 'autoSave'],
    '本地设置'
  )
  const candidate = value as Partial<Settings>
  const animations = typeof candidate.animations === 'boolean'
    ? candidate.animations
    : typeof candidate.animation === 'boolean'
      ? candidate.animation
      : DEFAULT_SETTINGS.animations
  const lowPower = typeof candidate.lowPower === 'boolean'
    ? candidate.lowPower
    : typeof candidate.powerSave === 'boolean'
      ? candidate.powerSave
      : DEFAULT_SETTINGS.lowPower
  return {
    animation: animations,
    animations,
    sound: typeof candidate.sound === 'boolean' ? candidate.sound : DEFAULT_SETTINGS.sound,
    vibration: typeof candidate.vibration === 'boolean' ? candidate.vibration : DEFAULT_SETTINGS.vibration,
    powerSave: lowPower,
    lowPower,
    autoSave: typeof candidate.autoSave === 'boolean' ? candidate.autoSave : DEFAULT_SETTINGS.autoSave
  }
}

function normalizeRecord(value: unknown): ObservationRecord {
  if (!isPlainObject(value)) {
    throw new StorageServiceError('CORRUPT_DATA', '本地记录存在非对象条目')
  }
  if (typeof value.id !== 'string' || !value.id) {
    throw new StorageServiceError('CORRUPT_DATA', '本地记录缺少有效 ID')
  }
  if (!Number.isInteger(value.hexagramId) || Number(value.hexagramId) < 1 || Number(value.hexagramId) > 64) {
    throw new StorageServiceError('CORRUPT_DATA', `本地记录 ${value.id} 的卦象编号无效`)
  }
  if (!Number.isFinite(value.createdAt)) {
    throw new StorageServiceError('CORRUPT_DATA', `本地记录 ${value.id} 的创建时间无效`)
  }
  if ('favorite' in value && typeof value.favorite !== 'boolean') {
    throw new StorageServiceError('CORRUPT_DATA', `本地记录 ${value.id} 的收藏状态无效`)
  }
  for (const field of ['reviewAt', 'reviewedAt']) {
    if (field in value && (!Number.isFinite(value[field]) || Number(value[field]) < 0)) {
      throw new StorageServiceError('CORRUPT_DATA', `本地记录 ${value.id} 的回看时间无效`)
    }
  }
  return clone(value) as ObservationRecord
}

function normalizeRecords(value: unknown): ObservationRecord[] {
  if (isMissing(value)) return []
  if (!Array.isArray(value)) {
    throw new StorageServiceError('CORRUPT_DATA', '本地记录列表结构异常')
  }
  const records = value.map(normalizeRecord)
  const ids = new Set<string>()
  for (const record of records) {
    if (ids.has(record.id)) {
      throw new StorageServiceError('CORRUPT_DATA', `本地记录 ID ${record.id} 重复`)
    }
    ids.add(record.id)
  }
  return records.sort((a, b) => b.createdAt - a.createdAt)
}

function normalizeDraft(value: unknown): Record<string, unknown> | null {
  if (isMissing(value)) return null
  if (!isPlainObject(value)) {
    throw new StorageServiceError('CORRUPT_DATA', '本地草稿结构异常')
  }
  return clone(value)
}

function normalizeFavorites(value: unknown): number[] {
  if (isMissing(value)) return []
  if (!Array.isArray(value)) {
    throw new StorageServiceError('CORRUPT_DATA', '文化馆收藏结构异常')
  }
  const normalized = value.map((item) => Number(item))
  if (normalized.some((item) => !Number.isInteger(item) || item < 1 || item > 64)) {
    throw new StorageServiceError('CORRUPT_DATA', '文化馆收藏包含无效卦象编号')
  }
  return Array.from(new Set(normalized)).sort((a, b) => a - b)
}

function createStorageService(adapter: StorageAdapter) {
  let schemaReady = false

  function readRaw(key: string, label: string): unknown {
    try {
      return adapter.get(key)
    } catch (error) {
      throw new StorageServiceError('READ_FAILED', `${label}读取失败${errorDetail(error)}`)
    }
  }

  function writeRaw(key: string, value: unknown, label: string): void {
    try {
      adapter.set(key, clone(value))
    } catch (error) {
      throw new StorageServiceError('WRITE_FAILED', `${label}写入失败${errorDetail(error)}`)
    }
  }

  function removeRaw(key: string, label: string): void {
    try {
      adapter.remove(key)
    } catch (error) {
      throw new StorageServiceError('REMOVE_FAILED', `${label}删除失败${errorDetail(error)}`)
    }
  }

  function readMetadata(): StorageMetadata | null {
    const raw = readRaw(STORAGE_KEYS.metadata, '存储版本')
    if (isMissing(raw)) return null
    if (
      !isPlainObject(raw) ||
      !Number.isInteger(raw.schemaVersion) ||
      Number(raw.schemaVersion) < 0 ||
      !Number.isFinite(raw.migratedAt)
    ) {
      throw new StorageServiceError('CORRUPT_DATA', '存储版本元数据结构异常')
    }
    return {
      schemaVersion: Number(raw.schemaVersion),
      migratedAt: Number(raw.migratedAt)
    }
  }

  function migrateStorage(fromVersion: number): number {
    if (fromVersion > STORAGE_SCHEMA_VERSION) {
      throw new StorageServiceError(
        'FUTURE_SCHEMA',
        `存储版本 ${fromVersion} 高于当前支持版本 ${STORAGE_SCHEMA_VERSION}`
      )
    }
    if (fromVersion < 0 || !Number.isInteger(fromVersion)) {
      throw new StorageServiceError('CORRUPT_DATA', '存储版本号无效')
    }
    if (fromVersion === STORAGE_SCHEMA_VERSION) return fromVersion

    // v0 是历史无元数据格式。迁移只增加独立版本元数据，不重写任何业务键。
    if (fromVersion === 0) {
      const metadata: StorageMetadata = {
        schemaVersion: 1,
        migratedAt: Date.now()
      }
      writeRaw(STORAGE_KEYS.metadata, metadata, '存储版本')
      const persisted = readMetadata()
      if (!persisted || persisted.schemaVersion !== 1) {
        throw new StorageServiceError('VERIFY_FAILED', '存储版本迁移后校验失败')
      }
      return 1
    }

    throw new StorageServiceError('CORRUPT_DATA', `没有可用的 v${fromVersion} 数据迁移路径`)
  }

  function ensureSchema(): number {
    if (schemaReady) return STORAGE_SCHEMA_VERSION
    const metadata = readMetadata()
    let version = metadata?.schemaVersion ?? 0
    if (version > STORAGE_SCHEMA_VERSION) {
      throw new StorageServiceError(
        'FUTURE_SCHEMA',
        `存储版本 ${version} 高于当前支持版本 ${STORAGE_SCHEMA_VERSION}`
      )
    }
    while (version < STORAGE_SCHEMA_VERSION) version = migrateStorage(version)
    schemaReady = true
    return version
  }

  function getStorageStatus(): { ok: boolean; schemaVersion: number | null; code: string; message: string } {
    try {
      return {
        ok: true,
        schemaVersion: ensureSchema(),
        code: '',
        message: ''
      }
    } catch (error) {
      return {
        ok: false,
        schemaVersion: null,
        code: error instanceof StorageServiceError ? error.code : 'UNKNOWN',
        message: storageErrorMessage(error)
      }
    }
  }

  function getSettings(): Settings {
    ensureSchema()
    return normalizeSettings(readRaw(STORAGE_KEYS.settings, '本地设置'))
  }

  function updateSettings(partial: Partial<Settings>): Settings {
    const current = getSettings()
    const mapped = { ...partial }
    if (typeof partial.animation === 'boolean' && typeof partial.animations !== 'boolean') {
      mapped.animations = partial.animation
    }
    if (typeof partial.animations === 'boolean' && typeof partial.animation !== 'boolean') {
      mapped.animation = partial.animations
    }
    if (typeof partial.powerSave === 'boolean' && typeof partial.lowPower !== 'boolean') {
      mapped.lowPower = partial.powerSave
    }
    if (typeof partial.lowPower === 'boolean' && typeof partial.powerSave !== 'boolean') {
      mapped.powerSave = partial.lowPower
    }
    const next = normalizeSettings({ ...current, ...mapped })
    writeRaw(STORAGE_KEYS.settings, next, '本地设置')
    const persisted = getSettings()
    if (JSON.stringify(persisted) !== JSON.stringify(next)) {
      throw new StorageServiceError('VERIFY_FAILED', '本地设置写入后校验失败')
    }
    return persisted
  }

  function resetSettings(): Settings {
    ensureSchema()
    removeRaw(STORAGE_KEYS.settings, '本地设置')
    const remaining = readRaw(STORAGE_KEYS.settings, '本地设置')
    if (!isMissing(remaining)) {
      throw new StorageServiceError('VERIFY_FAILED', '本地设置重置后校验失败')
    }
    return getSettings()
  }

  function getRecords(): ObservationRecord[] {
    ensureSchema()
    return normalizeRecords(readRaw(STORAGE_KEYS.records, '观象记录'))
  }

  function limitRecords(records: ObservationRecord[]): ObservationRecord[] {
    const sorted = records.slice().sort((a, b) => b.createdAt - a.createdAt)
    const favorites = sorted.filter((record) => record.favorite === true)
    const regular = sorted.filter((record) => record.favorite !== true)
    const kept = favorites.concat(regular.slice(0, 100))
    return kept.sort((a, b) => b.createdAt - a.createdAt)
  }

  function saveRecord(record: Partial<ObservationRecord>): ObservationRecord {
    const createdAt = Number.isFinite(record.createdAt) ? Number(record.createdAt) : Date.now()
    const normalized = normalizeRecord({
      ...clone(record),
      id: typeof record.id === 'string' && record.id
        ? record.id
        : `gx-${createdAt}-${Math.random().toString(36).slice(2, 8)}`,
      hexagramId: Number.isFinite(record.hexagramId)
        ? Math.max(1, Math.min(64, Math.round(Number(record.hexagramId))))
        : 1,
      createdAt
    })
    const records = getRecords().filter((item) => item.id !== normalized.id)
    const next = limitRecords([normalized, ...records])
    writeRaw(STORAGE_KEYS.records, next, '观象记录')
    const persisted = getRecords().find((item) => item.id === normalized.id)
    if (!persisted || JSON.stringify(persisted) !== JSON.stringify(normalized)) {
      throw new StorageServiceError('VERIFY_FAILED', '本地记录写入后校验失败')
    }
    return clone(persisted)
  }

  function deleteRecord(id: string): boolean {
    const current = getRecords()
    const next = current.filter((record) => record.id !== id)
    if (next.length === current.length) return false
    writeRaw(STORAGE_KEYS.records, next, '观象记录')
    const persisted = getRecords()
    if (
      persisted.some((record) => record.id === id) ||
      JSON.stringify(persisted) !== JSON.stringify(next)
    ) {
      throw new StorageServiceError('VERIFY_FAILED', '本地记录删除后校验失败')
    }
    return true
  }

  function clearRecords(): boolean {
    try {
      ensureSchema()
      removeRaw(STORAGE_KEYS.records, '观象记录')
      return isMissing(readRaw(STORAGE_KEYS.records, '观象记录'))
    } catch (_error) {
      return false
    }
  }

  function hasSeenGuide(): boolean {
    try {
      ensureSchema()
      const value = readRaw(STORAGE_KEYS.guideSeen, '首次说明状态')
      if (isMissing(value)) return false
      if (typeof value !== 'boolean') {
        throw new StorageServiceError('CORRUPT_DATA', '首次说明状态结构异常')
      }
      return value
    } catch (_error) {
      // 无法确认时重新展示说明，不冒充已同意状态。
      return false
    }
  }

  function markGuideSeen(): void {
    ensureSchema()
    writeRaw(STORAGE_KEYS.guideSeen, true, '首次说明状态')
    if (readRaw(STORAGE_KEYS.guideSeen, '首次说明状态') !== true) {
      throw new StorageServiceError('VERIFY_FAILED', '首次说明状态写入后校验失败')
    }
  }

  function getDraft(): Record<string, unknown> | null {
    ensureSchema()
    return normalizeDraft(readRaw(STORAGE_KEYS.draft, '当前草稿'))
  }

  function saveDraft(partial: Record<string, unknown>): Record<string, unknown> {
    const current = getDraft() || {}
    const next = { ...current, ...clone(partial) }
    writeRaw(STORAGE_KEYS.draft, next, '当前草稿')
    const persisted = getDraft()
    if (!persisted || JSON.stringify(persisted) !== JSON.stringify(next)) {
      throw new StorageServiceError('VERIFY_FAILED', '本地草稿写入后校验失败')
    }
    return persisted
  }

  function clearDraft(): boolean {
    try {
      ensureSchema()
      removeRaw(STORAGE_KEYS.draft, '当前草稿')
      return isMissing(readRaw(STORAGE_KEYS.draft, '当前草稿'))
    } catch (_error) {
      return false
    }
  }

  function getFavorites(): number[] {
    ensureSchema()
    return normalizeFavorites(readRaw(STORAGE_KEYS.favorites, '文化馆收藏'))
  }

  function toggleFavorite(hexagramId: number): boolean {
    const normalized = Math.max(1, Math.min(64, Math.round(Number(hexagramId) || 1)))
    const favorites = getFavorites()
    const exists = favorites.includes(normalized)
    const next = exists
      ? favorites.filter((id) => id !== normalized)
      : favorites.concat(normalized).sort((a, b) => a - b)
    writeRaw(STORAGE_KEYS.favorites, next, '文化馆收藏')
    const persisted = getFavorites()
    if (JSON.stringify(persisted) !== JSON.stringify(next)) {
      throw new StorageServiceError('VERIFY_FAILED', '文化馆收藏写入后校验失败')
    }
    return !exists
  }

  return {
    getSettings,
    updateSettings,
    resetSettings,
    getRecords,
    saveRecord,
    deleteRecord,
    clearRecords,
    hasSeenGuide,
    markGuideSeen,
    getDraft,
    saveDraft,
    clearDraft,
    getFavorites,
    toggleFavorite,
    getStorageStatus
  }
}

function createRuntimeAdapter(): StorageAdapter {
  const wxApi = (globalThis as { wx?: {
    getStorageSync(key: string): unknown
    setStorageSync(key: string, value: unknown): void
    removeStorageSync(key: string): void
  } }).wx
  if (!wxApi) return createMemoryAdapter()

  return {
    get(key: string): unknown {
      return wxApi.getStorageSync(key)
    },
    set(key: string, value: unknown): void {
      wxApi.setStorageSync(key, value)
    },
    remove(key: string): void {
      wxApi.removeStorageSync(key)
    }
  }
}

const defaultService = createStorageService(createRuntimeAdapter())

module.exports = {
  STORAGE_SCHEMA_VERSION,
  STORAGE_KEYS,
  StorageServiceError,
  storageErrorMessage,
  createMemoryAdapter,
  createStorageService,
  ...defaultService
}
