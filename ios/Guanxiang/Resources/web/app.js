(function startDesktopApp() {
  'use strict'

  const core = window.GX_CORE
  const app = document.getElementById('app')
  const toast = document.getElementById('toast')
  const isAndroid = /GuanxiangAndroid\//.test(navigator.userAgent)
  const isIOS = /GuanxiangIOS\//.test(navigator.userAgent)
  const isMobile = isAndroid || isIOS
  const platformLabel = isAndroid ? '安卓版' : isIOS ? 'iOS 版' : '桌面版'
  const storageLabel = isMobile ? '当前手机' : '当前 Windows 用户的浏览器'
  const STORAGE = {
    records: 'gx_desktop_records',
    favorites: 'gx_desktop_favorites',
    settings: 'gx_desktop_settings'
  }
  const DAILY_STATES = [
    ['calm', '平静', '让清晰继续生长'],
    ['anxious', '焦虑', '先把事实与担心分开'],
    ['hesitant', '犹豫', '找到最小验证动作'],
    ['energized', '有冲劲', '让速度服从方向'],
    ['tired', '疲惫', '先恢复，再作重决定'],
    ['change', '想改变', '从可逆的一步开始']
  ]
  const WISDOM_CATEGORIES = [
    ['all', '全部'], ['decision', '进退'], ['work', '工作'],
    ['relationship', '关系'], ['study', '学习'], ['family', '家庭'], ['self', '自省']
  ]
  const DEFAULT_SETTINGS = { animations: true, autoSave: true }
  const state = {
    route: 'home',
    category: '',
    question: '',
    selections: {},
    assessmentIndex: 0,
    result: null,
    resultMode: '情境观象',
    currentRecordId: '',
    libraryQuery: '',
    libraryFavoritesOnly: false,
    detailId: 0,
    wisdomQuery: '',
    wisdomCategory: 'all',
    wisdomExpanded: '',
    legalDoc: ''
  }

  function h(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;')
  }

  function readStore(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null')
      return parsed == null ? fallback : parsed
    } catch (_error) {
      return fallback
    }
  }

  function writeStore(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (_error) {
      showToast('本地保存失败，请检查浏览器存储空间')
      return false
    }
  }

  function getRecords() {
    const value = readStore(STORAGE.records, [])
    return Array.isArray(value) ? value : []
  }

  function getFavorites() {
    const value = readStore(STORAGE.favorites, [])
    return Array.isArray(value) ? value.filter((id) => Number.isInteger(Number(id))).map(Number) : []
  }

  function getSettings() {
    return { ...DEFAULT_SETTINGS, ...readStore(STORAGE.settings, {}) }
  }

  function showToast(message) {
    toast.textContent = message
    toast.classList.add('is-visible')
    clearTimeout(showToast.timer)
    showToast.timer = setTimeout(() => toast.classList.remove('is-visible'), 2400)
  }

  function dateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  function pageHead(eyebrow, title, subtitle) {
    return `<div class="view__eyebrow">${h(eyebrow)}</div><h1 class="view__title">${h(title)}</h1><p class="view__subtitle">${h(subtitle)}</p>`
  }

  function navigate(route) {
    state.route = route
    if (route !== 'library') state.detailId = 0
    if (route !== 'settings') state.legalDoc = ''
    document.querySelectorAll('[data-route]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.route === route)
    })
    render()
    app.focus()
    window.scrollTo(0, 0)
  }

  function renderHome() {
    const records = getRecords()
    const favorites = getFavorites()
    const note = core.wisdom.getWisdomOfDay(dateKey())
    return `<section class="view">
      ${pageHead(isAndroid ? 'GUAN XIANG · ANDROID' : isIOS ? 'GUAN XIANG · IOS' : 'GUAN XIANG · DESKTOP', '观象录', `不问远处的定数，只看当下有哪些条件可以改变。${platformLabel}与微信小程序共用同一套离线内容和分析规则。`)}
      <div class="hero panel">
        <div class="hero__label">今日 · ${h(dateKey())}</div>
        <div class="hero__quote">${h(note ? note.principle : '先理解当前条件，再选择一个可验证的现实行动。')}</div>
        <div class="hero__actions">
          <button class="primary" data-route="ask">问一件事</button>
          <button class="secondary" data-route="daily">今日观象</button>
          <button class="ghost" data-action="coin">铜钱互动</button>
        </div>
      </div>
      <div class="section-head"><h2>继续探索</h2><span>完全离线可用</span></div>
      <div class="quick-grid">
        <button class="card card-button" data-route="library"><span class="card-button__mark">卦</span><h3>六十四卦文化馆</h3><p>完整卦辞、六爻、现代解释与行动启示。</p></button>
        <button class="card card-button" data-route="wisdom"><span class="card-button__mark">笺</span><h3>观象札记</h3><p>24 篇关于进退、工作、关系、学习、家庭与自省的短札。</p></button>
        <button class="card card-button" data-route="history"><span class="card-button__mark">录</span><h3>我的记录</h3><p>${records.length} 次反思 · ${favorites.length} 个卦象收藏，仅保存在本机。</p></button>
      </div>
      <div class="section-head"><h2>本地概览</h2><span>不上传任何问题或结果</span></div>
      <div class="stats-grid">
        <div class="card stat"><strong>10,368</strong><span>结构化选择组合</span></div>
        <div class="card stat"><strong>64</strong><span>完整卦象内容</span></div>
        <div class="card stat"><strong>24</strong><span>现实反思札记</span></div>
      </div>
    </section>`
  }

  function renderDaily() {
    return `<section class="view">
      ${pageHead('今日观象', '你此刻更接近哪种状态？', '只选当下最真实的一项。结果用于整理思路，不预测今天会发生什么。')}
      <div class="category-grid content-grid">
        ${DAILY_STATES.map(([id, label, note]) => `<button class="card card-button" data-daily="${id}"><span class="card-button__mark">${h(label.slice(0, 1))}</span><h3>${h(label)}</h3><p>${h(note)}</p></button>`).join('')}
      </div>
    </section>`
  }

  function renderAsk() {
    const domains = Object.values(core.domains)
    if (!state.category) {
      return `<section class="view">
        ${pageHead('问一件事 · 第一步', '这件事更接近哪个领域？', '选择只是为了调整分析重点，不会给问题贴标签。')}
        <div class="category-grid content-grid">
          ${domains.map((domain) => `<button class="card card-button" data-category="${h(domain.id)}"><span class="card-button__mark">${h(domain.name.slice(0, 1))}</span><h3>${h(domain.name)}</h3><p>${h(domain.description)}</p></button>`).join('')}
        </div>
      </section>`
    }
    const domain = core.domains[state.category]
    return `<section class="view">
      ${pageHead('问一件事 · 第二步', `写下关于“${domain.name}”的现实问题`, '描述当前事实、已经做过什么以及最想理清的判断。')}
      <div class="panel form-card">
        <label class="field-label" for="question">你的问题（1—100 字）</label>
        <textarea id="question" class="textarea" maxlength="100" placeholder="${h(domain.questionPrompt || '请描述一个当前需要理清的现实问题')}">${h(state.question)}</textarea>
        <p class="form-note">不要填写姓名、手机号、证件号、住址或其他可识别个人的信息。医疗、法律、投资及人身安全问题会被安全拦截。</p>
        <div class="form-actions"><button class="ghost" data-action="reset-category">重新选择领域</button><button class="primary" data-action="start-assessment">开始五题梳理</button></div>
      </div>
    </section>`
  }

  function renderAssessment() {
    const questions = core.assessment.getAssessmentQuestions()
    const question = questions[state.assessmentIndex]
    const selected = state.selections[question.id] || ''
    return `<section class="view">
      ${pageHead(`梳理现状 · ${state.assessmentIndex + 1}/${questions.length}`, question.title, question.description)}
      <div class="progress progress--${state.assessmentIndex + 1}"><span></span></div>
      <div class="option-list">
        ${question.options.map((option) => `<button class="option ${selected === option.id ? 'is-selected' : ''}" data-option="${h(option.id)}"><span class="option__dot"></span><span><strong>${h(option.label)}</strong>${option.note ? `<small>${h(option.note)}</small>` : ''}</span></button>`).join('')}
      </div>
      <div class="form-actions"><button class="ghost" data-action="assessment-back">${state.assessmentIndex ? '上一题' : '返回问题'}</button><button class="primary" data-action="assessment-next">${state.assessmentIndex === questions.length - 1 ? '生成结果' : '下一题'}</button></div>
    </section>`
  }

  function renderResult() {
    const result = state.result
    if (!result) return renderHome()
    if (result.status === 'blocked') {
      return `<section class="view">${pageHead('现实安全优先', '本次不生成卦象', '高风险事项应先交给现实支持与具备资质的专业人员处理。')}
        <div class="panel blocked"><div class="blocked__mark">止</div><h2>${h(result.title)}</h2><p>${h(result.message)}</p><p>请暂停使用文化内容替代专业判断，保存相关事实与材料，并联系可信赖的人或专业机构。</p><div class="hero__actions"><button class="secondary" data-route="ask">返回修改问题</button><button class="ghost" data-route="home">回到首页</button></div></div>
      </section>`
    }
    const labels = ['今天', '七天内', '重新判断']
    const favorite = getFavorites().includes(Number(result.hexagramId))
    const saved = Boolean(state.currentRecordId)
    return `<section class="view">
      ${pageHead(state.resultMode, '看清当前条件，再决定下一步', result.disclaimer || '传统文化互动与个人反思参考。')}
      <div class="panel result-hero"><div class="result-symbol">${h(result.symbol || '易')}</div><div><h2 class="result-name">${h(result.name)}</h2><p class="view__subtitle">${h(result.upperTrigram)}上 · ${h(result.lowerTrigram)}下 · 第${h(result.changingLine || 0)}爻</p><div class="tags">${(result.keywords || []).map((tag) => `<span class="tag">${h(tag)}</span>`).join('')}</div></div></div>
      <div class="result-stack">
        <article class="card result-card"><h3>当前之象</h3><p>${h(result.summary)}</p></article>
        ${result.reflection ? `<article class="card result-card"><h3>今日反思</h3><p>${h(result.reflection)}</p></article>` : ''}
        <article class="card result-card"><h3>主要矛盾</h3><p>${h(result.mainConflict)}</p></article>
        <article class="card result-card"><h3>有利条件</h3><p>${h(result.advantage)}</p></article>
        <article class="card result-card result-card--risk"><h3>风险提醒</h3><p>${h(result.riskNotice)}</p></article>
        <article class="card result-card"><h3>下一步行动</h3><ol class="action-list">${(result.actions || []).map((action, index) => `<li><b>${labels[index] || `第${index + 1}步`}</b><span>${h(action)}</span></li>`).join('')}</ol></article>
        <article class="card result-card"><h3>文化原意</h3><p>${h(result.traditional)}</p><p>${h(result.culturalPlain || result.plain)}</p></article>
      </div>
      <div class="hero__actions"><button class="primary" data-action="save-result">${saved ? '更新本地记录' : '保存本次观象'}</button><button class="secondary" data-action="toggle-result-favorite">${favorite ? '◆ 已收藏此卦' : '◇ 收藏此卦'}</button><button class="ghost" data-detail="${h(result.hexagramId)}">查看完整六爻</button><button class="ghost" data-route="home">完成，回到首页</button></div>
    </section>`
  }

  function renderLibrary() {
    if (state.detailId) return renderHexDetail(state.detailId)
    const favorites = getFavorites()
    const query = state.libraryQuery.trim().toLowerCase()
    const items = core.hexagrams.getAllHexagrams().filter((item) => {
      if (state.libraryFavoritesOnly && !favorites.includes(item.id)) return false
      if (!query) return true
      return [item.id, item.name, item.pinyin, ...(item.keywords || [])].join(' ').toLowerCase().includes(query)
    })
    return `<section class="view">
      ${pageHead('六十四卦 · 文化馆', '从象意中理解变化', '浏览完整卦辞、六爻、现代解释与现实行动启示。')}
      <div class="toolbar"><input id="library-search" class="search" value="${h(state.libraryQuery)}" placeholder="搜索卦名、拼音或关键词"><button class="chip ${state.libraryFavoritesOnly ? '' : 'is-active'}" data-library-scope="all">全部 64</button><button class="chip ${state.libraryFavoritesOnly ? 'is-active' : ''}" data-library-scope="favorites">我的收藏 ${favorites.length}</button></div>
      ${items.length ? `<div class="hex-grid">${items.map((item) => `<button class="card hex-card" data-detail="${item.id}"><div class="hex-card__top"><span>${String(item.id).padStart(2, '0')}</span><span class="${favorites.includes(item.id) ? 'favorite' : ''}">${favorites.includes(item.id) ? '◆' : '◇'}</span></div><div class="hex-card__symbol">${h(item.symbol)}</div><h3>${h(item.name)}</h3><p>${h(item.keywords.slice(0, 3).join(' · '))}</p></button>`).join('')}</div>` : `<div class="panel empty"><strong>没有找到匹配内容</strong>试试卦名、拼音或其他关键词。</div>`}
    </section>`
  }

  function renderHexDetail(id) {
    const item = core.hexagrams.getHexagramById(id)
    if (!item) return `<section class="view"><div class="panel empty"><strong>卦象不存在</strong><button class="secondary" data-action="back-library">返回文化馆</button></div></section>`
    const favorite = getFavorites().includes(item.id)
    const lines = core.hexagrams.getHexagramLines(item.id)
    return `<section class="view">
      <button class="ghost" data-action="back-library">← 返回六十四卦</button>
      <div class="panel result-hero"><div class="result-symbol">${h(item.symbol)}</div><div><div class="view__eyebrow">第 ${item.id} 卦 · ${h(item.pinyin)}</div><h1 class="result-name">${h(item.name)}</h1><p class="view__subtitle">${h(item.upperTrigram)}上 · ${h(item.lowerTrigram)}下</p></div></div>
      <div class="result-stack"><article class="card result-card"><h3>卦辞</h3><p>${h(item.traditional)}</p></article><article class="card result-card"><h3>现代解释</h3><p>${h(item.plain)}</p></article>${lines.map((line) => `<article class="card result-card"><h3>${h(line.label)}</h3><p>${h(line.traditional)}</p><p>${h(line.plain)}</p></article>`).join('')}</div>
      <div class="hero__actions"><button class="secondary" data-favorite="${item.id}">${favorite ? '◆ 取消收藏' : '◇ 收藏此卦'}</button><button class="ghost" data-action="back-library">返回文化馆</button></div>
    </section>`
  }

  function renderWisdom() {
    const query = state.wisdomQuery.trim().toLowerCase()
    const notes = core.wisdom.getAllWisdomNotes().filter((note) => {
      if (state.wisdomCategory !== 'all' && note.category !== state.wisdomCategory) return false
      if (!query) return true
      return Object.values(note).join(' ').toLowerCase().includes(query)
    })
    return `<section class="view">
      ${pageHead('观象札记 · 现实修习', '把古老的变化观，放回今日生活', '六个现实主题，二十四篇短札；每篇都有理解、反思问题和可执行动作。')}
      <div class="toolbar"><input id="wisdom-search" class="search" value="${h(state.wisdomQuery)}" placeholder="搜索主题、问题或行动">${WISDOM_CATEGORIES.map(([id, label]) => `<button class="chip ${state.wisdomCategory === id ? 'is-active' : ''}" data-wisdom-category="${id}">${label}</button>`).join('')}</div>
      ${notes.length ? `<div class="wisdom-list">${notes.map((note) => `<article class="card wisdom-card"><button data-wisdom="${h(note.id)}"><div class="wisdom-meta">${h(note.categoryLabel)} · ${h(note.source)}</div><h3>${h(note.title)}</h3><p>${h(note.principle)}</p></button>${state.wisdomExpanded === note.id ? `<div class="wisdom-detail"><strong>今解</strong><p>${h(note.interpretation)}</p><strong>自问</strong><p>${h(note.reflection)}</p><strong>今日可做</strong><p>${h(note.action)}</p></div>` : ''}</article>`).join('')}</div>` : `<div class="panel empty"><strong>没有找到匹配札记</strong>换一个关键词或选择“全部”。</div>`}
    </section>`
  }

  function renderHistory() {
    const records = getRecords()
    return `<section class="view">
      ${pageHead('我的记录', '在事实变化后回看当时的判断', `记录只保存在${storageLabel}本地存储中。`)}
      <div class="toolbar"><button class="danger" data-action="clear-history" ${records.length ? '' : 'disabled'}>清空全部记录</button></div>
      ${records.length ? `<div class="history-list">${records.map((record) => `<article class="card history-card"><button data-record="${h(record.id)}"><div class="wisdom-meta">${h(record.mode)} · ${h(formatDate(record.createdAt))}</div><h3>${h(record.result.name)} · ${h(record.categoryLabel || '个人反思')}</h3><p>${h(record.result.summary)}</p></button><div class="history-actions"><button class="ghost" data-record="${h(record.id)}">查看</button><button class="danger" data-delete-record="${h(record.id)}">删除</button></div></article>`).join('')}</div>` : `<div class="panel empty"><strong>还没有保存记录</strong>完成一次观象后，可在结果页选择保存。</div>`}
    </section>`
  }

  function renderSettings() {
    if (state.legalDoc) {
      const documentData = (core.legalDocuments.documents || []).find((item) => item.id === state.legalDoc)
      if (documentData) {
        return `<section class="view"><button class="ghost" data-action="back-settings">← 返回设置</button>${pageHead('本地完整文本', documentData.title, `${documentData.documentVersion} · ${documentData.effectiveDate}`)}<div class="result-stack">${documentData.sections.map((section) => `<article class="card result-card"><h3>${h(section.title)}</h3>${(section.paragraphs || []).map((text) => `<p>${h(text)}</p>`).join('')}${(section.bullets || []).map((text) => `<p>· ${h(text)}</p>`).join('')}</article>`).join('')}</div><div class="hero__actions"><button class="ghost" data-action="back-settings">返回设置</button></div></section>`
      }
    }
    const settings = getSettings()
    return `<section class="view">
      ${pageHead('本地设置', `管理${platformLabel}体验与数据`, `设置、收藏和记录仅保存在${storageLabel}；清理应用数据会删除这些内容。`)}
      <div class="panel form-card">
        <div class="setting-row"><span><strong>界面动画</strong><small>关闭后停用页面进入和按钮过渡动画</small></span><button class="switch ${settings.animations ? 'is-on' : ''}" data-setting="animations">${settings.animations ? '已开启' : '已关闭'}</button></div>
        <div class="setting-row"><span><strong>自动保存结果</strong><small>只保存正常观象结果，高风险拦截内容不会保存</small></span><button class="switch ${settings.autoSave ? 'is-on' : ''}" data-setting="autoSave">${settings.autoSave ? '已开启' : '已关闭'}</button></div>
        <div class="setting-row"><span><strong>隐私保护说明</strong><small>查看${platformLabel}和小程序共同遵循的完整本地文本</small></span><button class="ghost" data-legal="privacy">查看全文</button></div>
        <div class="setting-row"><span><strong>用户协议</strong><small>查看服务性质、使用规则和责任边界</small></span><button class="ghost" data-legal="agreement">查看全文</button></div>
        <div class="setting-row"><span><strong>清除全部本地数据</strong><small>删除${platformLabel}记录、收藏和设置，不影响微信小程序数据</small></span><button class="danger" data-action="clear-all">清除数据</button></div>
      </div>
      <div class="panel result-card boundary-card"><h3>软件边界</h3><p>观象录用于传统文化学习和个人反思，不提供医疗诊断、法律结论、投资建议、彩票预测或人身安全决策。遇到相关问题，请优先寻求现实支持和具备资质的专业人员。</p></div>
    </section>`
  }

  function render() {
    const views = {
      home: renderHome,
      daily: renderDaily,
      ask: renderAsk,
      assessment: renderAssessment,
      result: renderResult,
      library: renderLibrary,
      wisdom: renderWisdom,
      history: renderHistory,
      settings: renderSettings
    }
    app.innerHTML = (views[state.route] || renderHome)()
    document.body.classList.toggle('motion-off', !getSettings().animations)
  }

  function saveResult(showMessage = true) {
    if (!state.result || state.result.status !== 'ready') return false
    const records = getRecords()
    const id = state.currentRecordId || `desktop-${Date.now()}`
    const categoryLabel = core.domains[state.category]?.name || (state.resultMode === '今日观象' ? '今日状态' : '传统互动')
    const record = {
      id,
      mode: state.resultMode,
      category: state.category,
      categoryLabel,
      question: state.question,
      result: state.result,
      createdAt: Date.now()
    }
    const next = [record, ...records.filter((item) => item.id !== id)].slice(0, 100)
    if (!writeStore(STORAGE.records, next)) return false
    state.currentRecordId = id
    if (showMessage) showToast('已保存到本机记录')
    return true
  }

  function finishResult(result, mode) {
    state.result = result
    state.resultMode = mode
    state.currentRecordId = ''
    if (result.status === 'ready' && getSettings().autoSave) saveResult(false)
    navigate('result')
  }

  function toggleFavorite(id) {
    const number = Number(id)
    const current = getFavorites()
    const next = current.includes(number) ? current.filter((item) => item !== number) : [...current, number]
    if (writeStore(STORAGE.favorites, next)) {
      showToast(next.includes(number) ? '已收藏此卦' : '已取消收藏')
      render()
    }
  }

  document.addEventListener('click', (event) => {
    const target = event.target.closest('button')
    if (!target) return
    if (target.dataset.route) {
      if (target.dataset.route === 'ask') {
        state.category = ''
        state.question = ''
        state.selections = {}
      }
      navigate(target.dataset.route)
      return
    }
    if (target.dataset.category) {
      state.category = target.dataset.category
      state.question = ''
      render()
      return
    }
    if (target.dataset.option) {
      const question = core.assessment.getAssessmentQuestions()[state.assessmentIndex]
      state.selections[question.id] = target.dataset.option
      render()
      return
    }
    if (target.dataset.daily) {
      finishResult(core.analysis.buildDailyObservation(target.dataset.daily, dateKey()), '今日观象')
      return
    }
    if (target.dataset.detail) {
      state.detailId = Number(target.dataset.detail)
      state.route = 'library'
      render()
      window.scrollTo(0, 0)
      return
    }
    if (target.dataset.favorite) {
      toggleFavorite(target.dataset.favorite)
      return
    }
    if (target.dataset.libraryScope) {
      state.libraryFavoritesOnly = target.dataset.libraryScope === 'favorites'
      render()
      return
    }
    if (target.dataset.wisdomCategory) {
      state.wisdomCategory = target.dataset.wisdomCategory
      state.wisdomExpanded = ''
      render()
      return
    }
    if (target.dataset.wisdom) {
      state.wisdomExpanded = state.wisdomExpanded === target.dataset.wisdom ? '' : target.dataset.wisdom
      render()
      return
    }
    if (target.dataset.record) {
      const record = getRecords().find((item) => item.id === target.dataset.record)
      if (record) {
        state.result = record.result
        state.resultMode = record.mode
        state.category = record.category || ''
        state.question = record.question || ''
        state.currentRecordId = record.id
        navigate('result')
      }
      return
    }
    if (target.dataset.deleteRecord) {
      if (!window.confirm('确认删除这条本地记录？')) return
      writeStore(STORAGE.records, getRecords().filter((item) => item.id !== target.dataset.deleteRecord))
      showToast('记录已删除')
      render()
      return
    }
    if (target.dataset.setting) {
      const settings = getSettings()
      settings[target.dataset.setting] = !settings[target.dataset.setting]
      writeStore(STORAGE.settings, settings)
      render()
      return
    }
    if (target.dataset.legal) {
      state.legalDoc = target.dataset.legal
      render()
      window.scrollTo(0, 0)
      return
    }

    const action = target.dataset.action
    if (action === 'coin') finishResult(core.analysis.castTraditionalCoins(), '铜钱互动')
    if (action === 'reset-category') { state.category = ''; render() }
    if (action === 'start-assessment') {
      const input = document.getElementById('question')
      state.question = input ? input.value.trim() : state.question.trim()
      if (!state.question) { showToast('请先写下一个现实问题'); return }
      state.assessmentIndex = 0
      state.selections = {}
      navigate('assessment')
    }
    if (action === 'assessment-back') {
      if (state.assessmentIndex > 0) { state.assessmentIndex -= 1; render() } else navigate('ask')
    }
    if (action === 'assessment-next') {
      const questions = core.assessment.getAssessmentQuestions()
      const question = questions[state.assessmentIndex]
      if (!state.selections[question.id]) { showToast('请先选择最符合现状的一项'); return }
      if (state.assessmentIndex < questions.length - 1) { state.assessmentIndex += 1; render(); return }
      const scored = core.assessment.scoreAssessment(state.selections)
      if (scored.status !== 'complete') { showToast('还有问题没有选择'); return }
      finishResult(core.analysis.analyzeSituation({ category: state.category, question: state.question, answers: scored.scores }), '情境观象')
    }
    if (action === 'save-result') { saveResult(true); render() }
    if (action === 'toggle-result-favorite') toggleFavorite(state.result.hexagramId)
    if (action === 'back-library') { state.detailId = 0; navigate('library') }
    if (action === 'clear-history') {
      if (window.confirm(`确认清空全部${platformLabel}观象记录？此操作无法恢复。`)) {
        writeStore(STORAGE.records, [])
        showToast('本地记录已清空')
        render()
      }
    }
    if (action === 'clear-all') {
      if (window.confirm(`确认清除${platformLabel}全部记录、收藏和设置？此操作无法恢复。`)) {
        Object.values(STORAGE).forEach((key) => localStorage.removeItem(key))
        state.currentRecordId = ''
        showToast(`${platformLabel}本地数据已清除`)
        render()
      }
    }
    if (action === 'back-settings') { state.legalDoc = ''; navigate('settings') }
  })

  document.addEventListener('input', (event) => {
    if (event.target.id === 'question') state.question = event.target.value
    if (event.target.id === 'library-search') {
      state.libraryQuery = event.target.value
      render()
      const input = document.getElementById('library-search')
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length) }
    }
    if (event.target.id === 'wisdom-search') {
      state.wisdomQuery = event.target.value
      render()
      const input = document.getElementById('wisdom-search')
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length) }
    }
  })

  if (!core) {
    app.innerHTML = '<section class="view"><div class="panel empty"><strong>离线核心没有加载</strong>请重新安装应用或运行项目生成命令。</div></section>'
    return
  }
  function handleNativeBack() {
    if (state.legalDoc) {
      state.legalDoc = ''
      navigate('settings')
      return true
    }
    if (state.detailId) {
      state.detailId = 0
      navigate('library')
      return true
    }
    if (state.route === 'assessment' && state.assessmentIndex > 0) {
      state.assessmentIndex -= 1
      render()
      window.scrollTo(0, 0)
      return true
    }
    if (state.route !== 'home') {
      navigate('home')
      return true
    }
    return false
  }
  window.GX_NATIVE_BACK = handleNativeBack
  window.GX_ANDROID_BACK = handleNativeBack
  render()
})()
