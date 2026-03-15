import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { crsDefaultSettings, crsMockTrades } from '@/data/crsMockData'
import {
  buildAnalyticsSeries,
  buildChecklistSummary,
  buildDashboardMetrics,
  buildFilterOptions,
  calculateRiskAmount,
  calculatePlannedRR,
  sortTradesDesc
} from '@/utils/crsAnalytics'

export const useCrsStore = defineStore('crs', () => {
  const sourceTrades = ref(crsMockTrades)
  const settings = ref(structuredClone(crsDefaultSettings))
  const availableSetupTypes = ref([...new Set([...crsDefaultSettings.customSetupTypes, ...crsMockTrades.map((trade) => trade.setupType)])].sort())
  const availableTags = ref([...new Set([...crsDefaultSettings.customTags, ...crsMockTrades.flatMap((trade) => trade.tags)])].sort())
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
  const analytics = computed(() => buildAnalyticsSeries(trades.value))
  const checklistSummary = computed(() => buildChecklistSummary(trades.value))
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

    availableTags.value = [...new Set([...(settings.value.customTags || []), ...availableTags.value])].sort()
    availableSetupTypes.value = [...new Set([...(settings.value.customSetupTypes || []), ...availableSetupTypes.value])].sort()
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

  function resetPreviewEmptyState() {
    settings.value = {
      ...settings.value,
      previewEmptyState: false
    }
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
    getTradeById,
    filterTrades,
    updateSettings,
    resetPreviewEmptyState,
    addSetupType,
    addTag,
    saveTrade
  }
})

function normalizeTrade(tradeDraft) {
  const resultR = Number(tradeDraft.resultR || 0)
  const resultAmount = Number(tradeDraft.resultAmount || 0)
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
    pair: String(tradeDraft.pair || '').toUpperCase(),
    direction: tradeDraft.direction,
    setupType: normalizedSetupStack[0] || 'Custom',
    setupStack: normalizedSetupStack[0] ? normalizedSetupStack : ['Custom'],
    session: tradeDraft.session,
    accountId: tradeDraft.accountId || null,
    accountName: tradeDraft.accountName || '',
    entry: Number(tradeDraft.entry || 0),
    stopLoss: Number(tradeDraft.stopLoss || 0),
    takeProfit: Number(tradeDraft.takeProfit || 0),
    status: resultR > 0 ? 'Win' : resultR < 0 ? 'Loss' : 'Breakeven',
    resultR,
    resultAmount,
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
    checklist: {
      htfBosConfirmed: Boolean(checklist.htfBosConfirmed),
      pullbackToOb: Boolean(checklist.pullbackToOb),
      m15Confirmation: Boolean(checklist.m15Confirmation),
      tradedWithBias: Boolean(checklist.tradedWithBias),
      validSession: Boolean(checklist.validSession),
      minimumRRMet: Boolean(checklist.minimumRRMet)
    }
  }
}
