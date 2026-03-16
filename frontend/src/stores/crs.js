import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { crsDefaultSettings, crsMockTrades } from '@/data/crsMockData'
import api from '@/services/api'
import {
  buildAnalyticsSeries,
  buildChecklistSummary,
  buildDashboardMetrics,
  buildFilterOptions,
  calculateActualRiskAmount,
  calculateNetPnl,
  calculatePipsMoved,
  calculateResultR,
  calculateRiskAmount,
  calculateRiskPercentOfAccount,
  calculatePlannedRR,
  inferContractMultiplier,
  inferPipSize,
  sortTradesDesc
} from '@/utils/crsAnalytics'

export const useCrsStore = defineStore('crs', () => {
  const sourceTrades = ref(crsMockTrades)
  const settings = ref(structuredClone(crsDefaultSettings))
  const availableSetupTypes = ref([...new Set([...crsDefaultSettings.customSetupTypes, ...crsMockTrades.map((trade) => trade.setupType)])].sort())
  const availableTags = ref([...new Set([...crsDefaultSettings.customTags, ...crsMockTrades.flatMap((trade) => trade.tags)])].sort())
  const persistenceLoading = ref(false)
  const persistenceReady = ref(false)
  const persistenceError = ref(null)
  const persistedAccounts = ref([])
  const tradesLoading = ref(false)
  const tradesReady = ref(false)
  const tradesError = ref(null)
  const trades = computed(() => (settings.value.previewEmptyState ? [] : sourceTrades.value))

  const sortedTrades = computed(() => sortTradesDesc(trades.value))
  const filterOptions = computed(() => {
    const options = buildFilterOptions(trades.value)
    return {
      ...options,
      setupTypes: [...new Set([...availableSetupTypes.value, ...options.setupTypes])].sort(),
      tags: [...new Set([...availableTags.value, ...options.tags])].sort()
    }
  })
  const dashboardMetrics = computed(() => buildDashboardMetrics(trades.value))
  const analytics = computed(() => buildAnalyticsSeries(trades.value, settings.value))
  const checklistSummary = computed(() => buildChecklistSummary(trades.value, settings.value.checklistItems || []))
  const recentTrades = computed(() => sortedTrades.value.slice(0, 5))
  const riskAmount = computed(() => calculateRiskAmount(settings.value))
  const journalEntries = computed(() =>
    sortedTrades.value.map((trade) => ({
      id: trade.id,
      date: trade.date,
      pair: trade.pair,
      setupType: trade.setupType,
      followedPlan: trade.journal.followedPlan,
      mistakeMade: trade.journal.mistakeMade,
      lessonLearned: trade.journal.lessonLearned,
      notes: trade.journal.notes,
      emotions: `${trade.journal.emotionBefore} -> ${trade.journal.emotionAfter}`
    }))
  )

  function getTradeById(id) {
    const trade = sourceTrades.value.find((item) => item.id === id)

    if (!trade) {
      return null
    }

    return {
      ...trade,
      plannedRR: calculatePlannedRR(trade)
    }
  }

  function filterTrades(filters = {}) {
    const {
      pair = '',
      session = '',
      setupType = '',
      setupTypes = [],
      tags = [],
      status = '',
      query = '',
      startDate = '',
      endDate = ''
    } = filters

    const normalizedQuery = query.trim().toLowerCase()

    return sortedTrades.value.filter((trade) => {
      const matchesPair = !pair || trade.pair === pair
      const matchesSession = !session || trade.session === session
      const activeSetups = setupTypes.length ? setupTypes : setupType ? [setupType] : []
      const matchesSetup =
        !activeSetups.length ||
        activeSetups.some((setup) => trade.setupType === setup || trade.setupStack?.includes(setup) || trade.tags.includes(setup))
      const matchesTags = !tags.length || tags.some((tag) => trade.tags.includes(tag))
      const matchesStatus = !status || trade.status === status
      const matchesStart = !startDate || trade.date >= startDate
      const matchesEnd = !endDate || trade.date <= endDate
      const matchesQuery =
        !normalizedQuery ||
        [
          trade.pair,
          trade.direction,
          trade.setupType,
          trade.session,
          trade.status,
          trade.tags.join(' '),
          trade.journal.notes,
          trade.journal.mistakeMade,
          trade.journal.lessonLearned
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)

      return (
        matchesPair &&
        matchesSession &&
        matchesSetup &&
        matchesTags &&
        matchesStatus &&
        matchesStart &&
        matchesEnd &&
        matchesQuery
      )
    })
  }

  function updateSettings(patch) {
    settings.value = {
      ...settings.value,
      ...patch
    }

    refreshAvailableOptions()
  }

  function addTag(tag) {
    const normalized = String(tag || '').trim()
    if (!normalized) {
      return
    }

    if (!availableTags.value.includes(normalized)) {
      availableTags.value = [...availableTags.value, normalized].sort()
    }

    if (!settings.value.customTags.includes(normalized)) {
      settings.value = {
        ...settings.value,
        customTags: [...settings.value.customTags, normalized].sort()
      }
    }
  }

  function addSetupType(setupType) {
    const normalized = String(setupType || '').trim()
    if (!normalized) {
      return
    }

    if (!availableSetupTypes.value.includes(normalized)) {
      availableSetupTypes.value = [...availableSetupTypes.value, normalized].sort()
    }

    if (!settings.value.customSetupTypes.includes(normalized)) {
      settings.value = {
        ...settings.value,
        customSetupTypes: [...settings.value.customSetupTypes, normalized].sort()
      }
    }
  }

  function saveTrade(tradeDraft) {
    const normalizedTrade = normalizeTrade(tradeDraft)
    const existingIndex = sourceTrades.value.findIndex((trade) => trade.id === normalizedTrade.id)

    if (existingIndex >= 0) {
      sourceTrades.value.splice(existingIndex, 1, normalizedTrade)
      normalizedTrade.setupStack.forEach(addSetupType)
      normalizedTrade.tags.forEach(addTag)
      return normalizedTrade
    }

    sourceTrades.value.unshift(normalizedTrade)
    normalizedTrade.setupStack.forEach(addSetupType)
    normalizedTrade.tags.forEach(addTag)
    return normalizedTrade
  }

  function replaceTrades(nextTrades) {
    sourceTrades.value = [...nextTrades]
    refreshAvailableOptions()
  }

  function resetPreviewEmptyState() {
    settings.value = {
      ...settings.value,
      previewEmptyState: false
    }
  }

  async function hydratePersistence(force = false) {
    if (persistenceLoading.value || (persistenceReady.value && !force)) {
      return
    }

    if (!localStorage.getItem('token')) {
      return
    }

    persistenceLoading.value = true
    persistenceError.value = null

    try {
      const [settingsResponse, accountsResponse, tagsResponse] = await Promise.allSettled([
        api.get('/settings'),
        api.get('/accounts'),
        api.get('/settings/tags')
      ])

      const backendSettings = settingsResponse.status === 'fulfilled'
        ? settingsResponse.value.data?.settings || {}
        : {}
      const backendAccounts = accountsResponse.status === 'fulfilled'
        ? accountsResponse.value.data?.data || []
        : []
      const backendTags = tagsResponse.status === 'fulfilled'
        ? (tagsResponse.value.data?.tags || []).map((tag) => tag.name).filter(Boolean)
        : []

      persistedAccounts.value = sanitizeAccounts(backendAccounts.map(mapAccountFromBackend))
      const hydratedAccounts = persistedAccounts.value.length ? persistedAccounts.value : []
      const crsPreferences = backendSettings.crsPreferences || {}
      const activeAccountId = resolveActiveAccountId(crsPreferences.activeAccountId, hydratedAccounts)

      settings.value = {
        ...settings.value,
        currency: crsPreferences.currency || settings.value.currency,
        riskMode: crsPreferences.riskMode || settings.value.riskMode,
        riskPerTrade: crsPreferences.riskPerTrade ?? settings.value.riskPerTrade,
        preferredPeriod: crsPreferences.preferredPeriod || settings.value.preferredPeriod,
        reviewCadence: crsPreferences.reviewCadence || settings.value.reviewCadence,
        activeAccountId,
        accounts: hydratedAccounts,
        customTags: mergeUniqueStrings(settings.value.customTags, crsPreferences.customTags, backendTags),
        customSetupTypes: mergeUniqueStrings(settings.value.customSetupTypes, crsPreferences.customSetupTypes),
        checklistItems: normalizeChecklistItems(crsPreferences.checklistItems || settings.value.checklistItems)
      }

      refreshAvailableOptions(backendTags)
      await hydrateTrades(force)
      persistenceReady.value = true
    } catch (error) {
      persistenceError.value = error
      console.error('Failed to hydrate CRS persistence:', error)
    } finally {
      persistenceLoading.value = false
    }
  }

  async function hydrateTrades(force = false) {
    if (tradesLoading.value || (tradesReady.value && !force)) {
      return
    }

    if (!localStorage.getItem('token')) {
      return
    }

    tradesLoading.value = true
    tradesError.value = null

    try {
      const response = await api.get('/trades', {
        params: {
          limit: 500,
          offset: 0,
          skipCount: true
        }
      })

      const backendTrades = response.data?.trades || []
      replaceTrades(backendTrades.map((trade) => mapTradeFromBackend(trade, settings.value.accounts)))
      tradesReady.value = true
      return sourceTrades.value
    } catch (error) {
      tradesError.value = error
      console.error('Failed to hydrate CRS trades:', error)
      throw error
    } finally {
      tradesLoading.value = false
    }
  }

  async function persistTrade(tradeDraft) {
    const normalizedTrade = normalizeTrade(tradeDraft)

    if (!localStorage.getItem('token')) {
      return saveTrade(normalizedTrade)
    }

    tradesLoading.value = true
    tradesError.value = null

    try {
      const payload = mapTradeToBackend(normalizedTrade, settings.value)
      const response = normalizedTrade.id && isPersistedTradeId(normalizedTrade.id)
        ? await api.put(`/trades/${normalizedTrade.id}`, payload)
        : await api.post('/trades', payload)

      const savedTrade = mapTradeFromBackend(response.data?.trade || response.data, settings.value.accounts)
      const existingIndex = sourceTrades.value.findIndex((trade) => trade.id === savedTrade.id)

      if (existingIndex >= 0) {
        sourceTrades.value.splice(existingIndex, 1, savedTrade)
      } else {
        sourceTrades.value.unshift(savedTrade)
      }

      savedTrade.setupStack.forEach(addSetupType)
      savedTrade.tags.forEach(addTag)
      tradesReady.value = true
      return savedTrade
    } catch (error) {
      tradesError.value = error
      console.error('Failed to persist CRS trade:', error)
      throw error
    } finally {
      tradesLoading.value = false
    }
  }

  async function deleteTrade(id) {
    if (!id) {
      return
    }

    if (!localStorage.getItem('token') || !isPersistedTradeId(id)) {
      sourceTrades.value = sourceTrades.value.filter((trade) => trade.id !== id)
      return
    }

    tradesLoading.value = true
    tradesError.value = null

    try {
      await api.delete(`/trades/${id}`)
      sourceTrades.value = sourceTrades.value.filter((trade) => trade.id !== id)
    } catch (error) {
      tradesError.value = error
      console.error('Failed to delete CRS trade:', error)
      throw error
    } finally {
      tradesLoading.value = false
    }
  }

  async function deleteAllTrades() {
    const ids = sourceTrades.value.map((trade) => trade.id).filter(Boolean)

    if (!ids.length) {
      return
    }

    if (!localStorage.getItem('token')) {
      sourceTrades.value = []
      return
    }

    tradesLoading.value = true
    tradesError.value = null

    try {
      for (const id of ids) {
        if (isPersistedTradeId(id)) {
          await api.delete(`/trades/${id}`)
        }
      }

      sourceTrades.value = sourceTrades.value.filter((trade) => !ids.includes(trade.id))
    } catch (error) {
      tradesError.value = error
      console.error('Failed to delete all CRS trades:', error)
      throw error
    } finally {
      tradesLoading.value = false
    }
  }

  async function persistSettings(nextSettings) {
    if (!localStorage.getItem('token')) {
      updateSettings(nextSettings)
      return settings.value
    }

    persistenceLoading.value = true
    persistenceError.value = null

    try {
      const preservedPreviewState = nextSettings.previewEmptyState
      const syncedAccounts = await syncAccounts(nextSettings.accounts || [], nextSettings.activeAccountId)
      const resolvedSettings = {
        ...cloneSettings(nextSettings),
        accounts: syncedAccounts,
        activeAccountId: resolveActiveAccountId(nextSettings.activeAccountId, syncedAccounts),
        previewEmptyState: preservedPreviewState
      }

      const response = await api.put('/settings', {
        crsPreferences: buildCrsPreferencesPayload(resolvedSettings)
      })

      const backendSettings = response.data?.settings || {}
      const crsPreferences = backendSettings.crsPreferences || {}

      settings.value = {
        ...settings.value,
        currency: crsPreferences.currency || resolvedSettings.currency,
        riskMode: crsPreferences.riskMode || resolvedSettings.riskMode,
        riskPerTrade: crsPreferences.riskPerTrade ?? resolvedSettings.riskPerTrade,
        preferredPeriod: crsPreferences.preferredPeriod || resolvedSettings.preferredPeriod,
        reviewCadence: crsPreferences.reviewCadence || resolvedSettings.reviewCadence,
        activeAccountId: resolveActiveAccountId(crsPreferences.activeAccountId, syncedAccounts),
        accounts: syncedAccounts,
        customTags: mergeUniqueStrings(resolvedSettings.customTags),
        customSetupTypes: mergeUniqueStrings(resolvedSettings.customSetupTypes),
        checklistItems: normalizeChecklistItems(resolvedSettings.checklistItems),
        previewEmptyState: preservedPreviewState
      }

      refreshAvailableOptions()
      persistenceReady.value = true
      return settings.value
    } catch (error) {
      persistenceError.value = error
      console.error('Failed to persist CRS settings:', error)
      throw error
    } finally {
      persistenceLoading.value = false
    }
  }

  async function syncAccounts(accountsDraft, desiredActiveAccountId) {
    const desiredAccounts = Array.isArray(accountsDraft) ? accountsDraft : []
    const existingById = new Map(persistedAccounts.value.map((account) => [account.id, account]))
    const synced = []
    const accountsToSync = [
      ...desiredAccounts.filter((account) => account.id !== desiredActiveAccountId),
      ...desiredAccounts.filter((account) => account.id === desiredActiveAccountId)
    ]

    for (const account of accountsToSync) {
      const payload = mapAccountToBackend(account, account.id === desiredActiveAccountId)
      let savedAccount

      if (existingById.has(account.id)) {
        const response = await api.put(`/accounts/${account.id}`, payload)
        savedAccount = mapAccountFromBackend(response.data?.data || response.data)
      } else {
        const response = await api.post('/accounts', payload)
        savedAccount = mapAccountFromBackend(response.data?.data || response.data)
      }

      synced.push(savedAccount)
    }

    const syncedIds = new Set(synced.map((account) => account.id))
    const deletedAccounts = persistedAccounts.value.filter((account) => !syncedIds.has(account.id))

    for (const account of deletedAccounts) {
      await api.delete(`/accounts/${account.id}`)
    }

    persistedAccounts.value = sanitizeAccounts(synced)
    return persistedAccounts.value
  }

  function refreshAvailableOptions(extraTags = []) {
    availableTags.value = mergeUniqueStrings(
      settings.value.customTags,
      sourceTrades.value.flatMap((trade) => trade.tags),
      extraTags
    )

    availableSetupTypes.value = mergeUniqueStrings(
      settings.value.customSetupTypes,
      sourceTrades.value.flatMap((trade) => trade.setupStack?.length ? trade.setupStack : [trade.setupType])
    )
  }

  return {
    trades,
    sourceTrades,
    settings,
    sortedTrades,
    filterOptions,
    dashboardMetrics,
    analytics,
    checklistSummary,
    recentTrades,
    availableSetupTypes,
    availableTags,
    riskAmount,
    journalEntries,
    persistenceLoading,
    persistenceReady,
    persistenceError,
    tradesLoading,
    tradesReady,
    tradesError,
    getTradeById,
    filterTrades,
    updateSettings,
    hydratePersistence,
    hydrateTrades,
    persistSettings,
    resetPreviewEmptyState,
    addSetupType,
    addTag,
    saveTrade,
    persistTrade,
    deleteTrade,
    deleteAllTrades
  }
})

function normalizeTrade(tradeDraft) {
  const closePrice = Number(tradeDraft.closePrice ?? tradeDraft.exitPrice ?? 0)
  const pair = String(tradeDraft.pair || '').toUpperCase()
  const volume = Number(tradeDraft.volume ?? tradeDraft.quantity ?? 0)
  const contractMultiplier = Number(tradeDraft.contractMultiplier ?? inferContractMultiplier(pair))
  const pipSize = Number(tradeDraft.pipSize ?? inferPipSize(pair))
  const commission = Number(tradeDraft.commission || 0)
  const swap = Number(tradeDraft.swap || 0)
  const derivedResultR = calculateResultR({
    entry: tradeDraft.entry,
    stopLoss: tradeDraft.stopLoss,
    closePrice,
    direction: tradeDraft.direction
  })
  const resultAmount = Number(tradeDraft.resultAmount ?? calculateNetPnl({
    entry: tradeDraft.entry,
    closePrice,
    direction: tradeDraft.direction,
    volume,
    contractMultiplier,
    commission,
    swap
  }) ?? 0)
  const resultR = Number(tradeDraft.resultR ?? (calculateActualRiskAmount({
    entry: tradeDraft.entry,
    stopLoss: tradeDraft.stopLoss,
    volume,
    contractMultiplier
  }) ? resultAmount / calculateActualRiskAmount({
    entry: tradeDraft.entry,
    stopLoss: tradeDraft.stopLoss,
    volume,
    contractMultiplier
  }) : derivedResultR) ?? 0)
  const journal = tradeDraft.journal || {}
  const checklist = tradeDraft.checklist || {}
  const setupStack = Array.isArray(tradeDraft.setupStack)
    ? tradeDraft.setupStack.filter(Boolean)
    : Array.isArray(tradeDraft.setupTypes)
      ? tradeDraft.setupTypes.filter(Boolean)
      : [String(tradeDraft.setupType || '').trim()].filter(Boolean)
  const normalizedSetupStack = [...new Set(setupStack)].filter(Boolean)
  const normalizedTags = [
    ...new Set(
      (
        Array.isArray(tradeDraft.tags)
          ? tradeDraft.tags.filter(Boolean)
          : String(tradeDraft.tags || '')
              .split(',')
              .map((tag) => tag.trim())
              .filter(Boolean)
      ).concat(normalizedSetupStack.slice(1))
    )
  ]

  return {
    id: tradeDraft.id || `crs-${Date.now()}`,
    date: tradeDraft.date,
    openTime: normalizeDateTimeValue(tradeDraft.openTime) || `${tradeDraft.date}T00:00:00`,
    closeTime: normalizeDateTimeValue(tradeDraft.closeTime),
    pair,
    direction: tradeDraft.direction,
    setupType: normalizedSetupStack[0] || 'Custom',
    setupStack: normalizedSetupStack[0] ? normalizedSetupStack : ['Custom'],
    session: tradeDraft.session,
    accountId: tradeDraft.accountId || null,
    accountName: tradeDraft.accountName || '',
    volume,
    contractMultiplier,
    pipSize,
    commission,
    swap,
    entry: Number(tradeDraft.entry || 0),
    stopLoss: Number(tradeDraft.stopLoss || 0),
    takeProfit: Number(tradeDraft.takeProfit || 0),
    closePrice,
    status: resultR > 0 ? 'Win' : resultR < 0 ? 'Loss' : 'Breakeven',
    resultR,
    resultAmount,
    actualRiskAmount: Number(tradeDraft.actualRiskAmount ?? calculateActualRiskAmount({
      entry: tradeDraft.entry,
      stopLoss: tradeDraft.stopLoss,
      volume,
      contractMultiplier
    })),
    riskPercentOfAccount: Number(tradeDraft.riskPercentOfAccount || 0),
    pips: Number(tradeDraft.pips ?? calculatePipsMoved({
      pair,
      entry: tradeDraft.entry,
      closePrice,
      direction: tradeDraft.direction,
      pipSize
    })),
    tags: normalizedTags,
    screenshot: tradeDraft.screenshot || null,
    journal: {
      whyTaken: journal.whyTaken || '',
      htfBias: journal.htfBias || '',
      entryModel: journal.entryModel || '',
      followedPlan: Boolean(journal.followedPlan),
      emotionBefore: journal.emotionBefore || '',
      emotionAfter: journal.emotionAfter || '',
      mistakeMade: journal.mistakeMade || '',
      lessonLearned: journal.lessonLearned || '',
      notes: journal.notes || ''
    },
    checklist: Object.fromEntries(Object.entries(checklist).map(([key, value]) => [key, Boolean(value)]))
  }
}

function buildCrsPreferencesPayload(settings) {
  return {
    currency: settings.currency || 'USD',
    riskMode: settings.riskMode || 'amount',
    riskPerTrade: Number(settings.riskPerTrade || 0),
    preferredPeriod: settings.preferredPeriod || 'monthly',
    reviewCadence: settings.reviewCadence || 'weekend',
    activeAccountId: settings.activeAccountId || '',
    customTags: mergeUniqueStrings(settings.customTags),
    customSetupTypes: mergeUniqueStrings(settings.customSetupTypes),
    checklistItems: normalizeChecklistItems(settings.checklistItems)
  }
}

function mapTradeToBackend(trade, settings) {
  const normalizedTrade = normalizeTrade(trade)
  const instrumentType = inferInstrumentType(normalizedTrade.pair)
  const entryPrice = Number(normalizedTrade.entry || 0)
  const stopLoss = Number(normalizedTrade.stopLoss || 0) || null
  const takeProfit = Number(normalizedTrade.takeProfit || 0) || null
  const resultR = Number(normalizedTrade.resultR || 0)
  const resultAmount = Number(normalizedTrade.resultAmount || 0)
  const exitPrice = Number(normalizedTrade.closePrice || deriveExitPrice(normalizedTrade))
  const quantity = deriveQuantity({
    entryPrice,
    exitPrice,
    resultAmount,
    instrumentType
  })
  const tags = mergeUniqueStrings(normalizedTrade.tags, normalizedTrade.setupStack.slice(1))
  const metadata = {
    version: 1,
    session: normalizedTrade.session || '',
    accountName: normalizedTrade.accountName || resolveAccountName(normalizedTrade.accountId, settings.accounts),
    setupStack: normalizedTrade.setupStack,
    volume: normalizedTrade.volume,
    contractMultiplier: normalizedTrade.contractMultiplier,
    pipSize: normalizedTrade.pipSize,
    openTime: normalizedTrade.openTime,
    closeTime: normalizedTrade.closeTime,
    commission: normalizedTrade.commission,
    swap: normalizedTrade.swap,
    closePrice: normalizedTrade.closePrice,
    actualRiskAmount: normalizedTrade.actualRiskAmount,
    riskPercentOfAccount: normalizedTrade.riskPercentOfAccount,
    pips: normalizedTrade.pips,
    resultAmount,
    resultR,
    screenshot: normalizedTrade.screenshot || '',
    journal: normalizedTrade.journal,
    checklist: normalizedTrade.checklist
  }

  return {
    symbol: normalizedTrade.pair,
    tradeDate: normalizedTrade.date,
    entryTime: normalizedTrade.openTime || `${normalizedTrade.date}T00:00:00`,
    exitTime: normalizedTrade.closeTime || normalizedTrade.openTime || `${normalizedTrade.date}T00:00:00`,
    entryPrice,
    exitPrice,
    quantity: normalizedTrade.volume || quantity,
    side: normalizedTrade.direction === 'Short' ? 'short' : 'long',
    instrumentType,
    account_identifier: normalizedTrade.accountId || '',
    strategy: normalizedTrade.session || '',
    setup: normalizedTrade.setupType,
    tags,
    notes: serializeCrsNotes(normalizedTrade.journal?.notes, metadata),
    commission: normalizedTrade.commission || 0,
    fees: normalizedTrade.swap || 0,
    stopLoss,
    takeProfit,
    chartUrl: normalizedTrade.screenshot || null,
    pointValue: normalizedTrade.contractMultiplier || null,
    confidence: deriveConfidence(normalizedTrade.checklist),
    manualTargetHitFirst: resultR >= 0 ? 'take_profit' : 'stop_loss'
  }
}

function mapTradeFromBackend(trade, accounts = []) {
  const metadata = parseCrsNotes(trade.notes)
  const accountId = trade.account_identifier || trade.accountIdentifier || null
  const accountName = metadata.accountName || resolveAccountName(accountId, accounts)
  const setupStack = metadata.setupStack?.length
    ? metadata.setupStack
    : [String(trade.setup || 'Custom').trim()].filter(Boolean)
  const resultAmount = metadata.resultAmount ?? Number(trade.pnl || 0)
  const resultR = metadata.resultR ?? Number(trade.rValue ?? trade.r_value ?? 0)
  const journal = metadata.journal || {}
  const checklist = metadata.checklist || {}

  return normalizeTrade({
    id: trade.id,
    date: trade.tradeDate || trade.trade_date || trade.entryTime?.slice(0, 10) || trade.entry_time?.slice(0, 10) || currentDateString(),
    openTime: metadata.openTime || trade.entryTime || trade.entry_time || '',
    closeTime: metadata.closeTime || trade.exitTime || trade.exit_time || '',
    pair: trade.symbol,
    direction: trade.side === 'short' ? 'Short' : 'Long',
    setupType: trade.setup || setupStack[0] || 'Custom',
    setupStack,
    session: metadata.session || trade.strategy || 'London',
    accountId,
    accountName,
    volume: Number(metadata.volume ?? trade.quantity ?? 0),
    contractMultiplier: Number(metadata.contractMultiplier ?? trade.pointValue ?? trade.point_value ?? inferContractMultiplier(trade.symbol)),
    pipSize: Number(metadata.pipSize ?? inferPipSize(trade.symbol)),
    commission: Number(metadata.commission ?? trade.commission ?? 0),
    swap: Number(metadata.swap ?? trade.fees ?? 0),
    entry: Number(trade.entryPrice ?? trade.entry_price ?? 0),
    stopLoss: Number(trade.stopLoss ?? trade.stop_loss ?? 0),
    takeProfit: Number(trade.takeProfit ?? trade.take_profit ?? 0),
    closePrice: Number(trade.exitPrice ?? trade.exit_price ?? 0),
    resultR,
    resultAmount,
    actualRiskAmount: Number(metadata.actualRiskAmount || 0),
    riskPercentOfAccount: Number(metadata.riskPercentOfAccount || calculateRiskPercentOfAccount({
      entry: Number(trade.entryPrice ?? trade.entry_price ?? 0),
      stopLoss: Number(trade.stopLoss ?? trade.stop_loss ?? 0),
      volume: Number(metadata.volume ?? trade.quantity ?? 0),
      contractMultiplier: Number(metadata.contractMultiplier ?? trade.pointValue ?? trade.point_value ?? inferContractMultiplier(trade.symbol))
    }, resolveAccountSize(accountId, accounts))),
    pips: Number(metadata.pips ?? calculatePipsMoved({
      pair: trade.symbol,
      entry: Number(trade.entryPrice ?? trade.entry_price ?? 0),
      closePrice: Number(trade.exitPrice ?? trade.exit_price ?? 0),
      direction: trade.side === 'short' ? 'Short' : 'Long',
      pipSize: Number(metadata.pipSize ?? inferPipSize(trade.symbol))
    })),
    tags: trade.tags || [],
    screenshot: metadata.screenshot || trade.chartUrl || trade.chart_url || null,
    journal: {
      whyTaken: journal.whyTaken || '',
      htfBias: journal.htfBias || '',
      entryModel: journal.entryModel || '',
      followedPlan: Boolean(journal.followedPlan),
      emotionBefore: journal.emotionBefore || '',
      emotionAfter: journal.emotionAfter || '',
      mistakeMade: journal.mistakeMade || '',
      lessonLearned: journal.lessonLearned || '',
      notes: journal.notes || metadata.visibleNotes || ''
    },
    checklist: {
      htfBosConfirmed: Boolean(checklist.htfBosConfirmed),
      pullbackToOb: Boolean(checklist.pullbackToOb),
      m15Confirmation: Boolean(checklist.m15Confirmation),
      tradedWithBias: Boolean(checklist.tradedWithBias),
      validSession: Boolean(checklist.validSession),
      minimumRRMet: Boolean(checklist.minimumRRMet)
    }
  })
}

function mapAccountFromBackend(account) {
  return {
    id: account.id,
    name: account.accountName || account.account_name || 'Account',
    size: Number(account.initialBalance ?? account.initial_balance ?? 0)
  }
}

function mapAccountToBackend(account, isPrimary = false) {
  return {
    accountName: String(account.name || '').trim() || 'Account',
    initialBalance: Number(account.size || 0),
    initialBalanceDate: currentDateString(),
    isPrimary,
    notes: 'CRS account'
  }
}

function resolveActiveAccountId(activeAccountId, accounts) {
  if (activeAccountId && accounts.some((account) => account.id === activeAccountId)) {
    return activeAccountId
  }

  return accounts[0]?.id || null
}

function normalizeChecklistItems(items = []) {
  const normalized = (Array.isArray(items) ? items : [])
    .map((item) => {
      const label = String(item?.label || '').trim()
      const id = String(item?.id || slugifyChecklistLabel(label)).trim()

      if (!label || !id) {
        return null
      }

      return { id, label }
    })
    .filter(Boolean)

  return normalized.length ? normalized : structuredClone(crsDefaultSettings.checklistItems)
}

function mergeUniqueStrings(...groups) {
  return [...new Set(groups.flat().filter(Boolean).map((value) => String(value).trim()).filter(Boolean))].sort()
}

function sanitizeAccounts(accounts = []) {
  const unique = []
  const seenIds = new Set()

  for (const account of accounts) {
    if (!account?.id || seenIds.has(account.id)) {
      continue
    }

    seenIds.add(account.id)
    unique.push(account)
  }

  const withoutLegacyPrimary = unique.filter((account) => !isLegacyPlaceholderAccount(account))
  return withoutLegacyPrimary.length ? withoutLegacyPrimary : unique
}

function cloneSettings(value) {
  return JSON.parse(JSON.stringify(value))
}

function currentDateString() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeDateTimeValue(value) {
  const text = String(value || '').trim()
  if (!text) {
    return ''
  }

  return text.replace(' ', 'T').slice(0, 19)
}

function serializeCrsNotes(visibleNotes = '', metadata = {}) {
  const normalizedVisibleNotes = String(visibleNotes || '').trim()
  const serializedMeta = JSON.stringify(metadata)

  if (!normalizedVisibleNotes) {
    return `${CRS_META_MARKER}${serializedMeta}`
  }

  return `${normalizedVisibleNotes}\n\n${CRS_META_MARKER}${serializedMeta}`
}

function parseCrsNotes(notes = '') {
  const rawNotes = String(notes || '')
  const markerIndex = rawNotes.lastIndexOf(CRS_META_MARKER)

  if (markerIndex === -1) {
    return {
      visibleNotes: rawNotes.trim()
    }
  }

  const visibleNotes = rawNotes.slice(0, markerIndex).trim()
  const serializedMeta = rawNotes.slice(markerIndex + CRS_META_MARKER.length).trim()

  try {
    return {
      ...JSON.parse(serializedMeta),
      visibleNotes
    }
  } catch {
    return {
      visibleNotes: rawNotes.trim()
    }
  }
}

function inferInstrumentType(symbol = '') {
  const value = String(symbol || '').toUpperCase()

  if (!value) {
    return 'forex'
  }

  if (['BTCUSD', 'ETHUSD', 'SOLUSD'].includes(value) || value.endsWith('USDT')) {
    return 'crypto'
  }

  if (/^(NAS|US30|SPX|GER|DAX|UK100|DJI|NQ|ES)/.test(value)) {
    return 'index'
  }

  if (/^[A-Z]{6}$/.test(value) || ['XAUUSD', 'XAGUSD'].includes(value)) {
    return 'forex'
  }

  return 'stock'
}

function deriveExitPrice(trade) {
  const entry = Number(trade.entry || 0)
  const stopLoss = Number(trade.stopLoss || 0)
  const resultR = Number(trade.resultR || 0)

  if (!entry || !stopLoss || !resultR) {
    return entry
  }

  const riskDistance = Math.abs(entry - stopLoss)
  if (!riskDistance) {
    return entry
  }

  const signedMove = riskDistance * resultR
  return trade.direction === 'Short'
    ? Number((entry - signedMove).toFixed(5))
    : Number((entry + signedMove).toFixed(5))
}

function deriveQuantity({ entryPrice, exitPrice, resultAmount, instrumentType }) {
  const priceDelta = Math.abs(Number(exitPrice || 0) - Number(entryPrice || 0))

  if (!priceDelta || !Number.isFinite(priceDelta) || !Number.isFinite(resultAmount)) {
    return instrumentType === 'forex' ? 1 : 1
  }

  const quantity = Math.abs(resultAmount) / priceDelta
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return 1
  }

  return Number(quantity.toFixed(instrumentType === 'forex' ? 2 : 4))
}

function deriveConfidence(checklist = {}) {
  const total = Object.keys(checklist).length || 1
  const checked = Object.values(checklist).filter(Boolean).length
  return Math.max(1, Math.min(10, Math.round((checked / total) * 10)))
}

function slugifyChecklistLabel(label = '') {
  return String(label || '')
    .trim()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (value) => value.toLowerCase())
}

function resolveAccountName(accountId, accounts = []) {
  return accounts.find((account) => account.id === accountId)?.name || ''
}

function resolveAccountSize(accountId, accounts = []) {
  return accounts.find((account) => account.id === accountId)?.size || 0
}

function isLegacyPlaceholderAccount(account) {
  return /^primary account$/i.test(String(account?.name || '').trim())
}

function isPersistedTradeId(id) {
  return /^[0-9a-f-]{36}$/i.test(String(id || ''))
}

const CRS_META_MARKER = '[CRS_META]'
