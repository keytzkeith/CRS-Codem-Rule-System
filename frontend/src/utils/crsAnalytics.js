import { format, parseISO, startOfWeek } from 'date-fns'

const BREAKEVEN_EPSILON = 0.0005

function round(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function classifyTradeOutcome(trade) {
  const resultAmount = Number(trade?.resultAmount)
  if (Number.isFinite(resultAmount)) {
    if (Math.abs(resultAmount) <= BREAKEVEN_EPSILON) {
      return 'breakeven'
    }

    return resultAmount > 0 ? 'win' : 'loss'
  }

  const resultR = Number(trade?.resultR)
  if (Number.isFinite(resultR) && Math.abs(resultR) <= BREAKEVEN_EPSILON) {
    return 'breakeven'
  }

  if (Number.isFinite(resultR)) {
    return resultR > 0 ? 'win' : 'loss'
  }

  const status = String(trade?.status || '').trim().toLowerCase()
  if (status === 'win' || status === 'loss' || status === 'breakeven') {
    return status
  }

  return 'breakeven'
}

export function calculatePlannedRR(trade) {
  const risk = Math.abs(trade.entry - trade.stopLoss)
  const reward = Math.abs(trade.takeProfit - trade.entry)

  if (!risk) {
    return 0
  }

  return round(reward / risk, 3)
}

export function calculateResultR(trade) {
  const risk = Math.abs(Number(trade.entry || 0) - Number(trade.stopLoss || 0))
  const close = Number(trade.closePrice ?? trade.exitPrice ?? 0)
  const entry = Number(trade.entry || 0)

  if (!risk || !close || !entry) {
    return 0
  }

  const reward = trade.direction === 'Short' ? entry - close : close - entry
  return round(reward / risk, 3)
}

export function calculateNetPnl(trade) {
  const entry = Number(trade.entry || 0)
  const close = Number(trade.closePrice ?? trade.exitPrice ?? 0)
  const volume = Number(trade.volume || trade.quantity || 0)
  const multiplier = Number(trade.contractMultiplier || 1)
  const commission = Number(trade.commission || 0)
  const swap = Number(trade.swap || 0)

  if (!entry || !close || !volume || !multiplier) {
    return 0
  }

  const priceMove = trade.direction === 'Short' ? entry - close : close - entry
  const grossPnl = priceMove * volume * multiplier
  return round(grossPnl - commission - swap, 2)
}

export function calculateActualRiskAmount(trade) {
  const riskDistance = Math.abs(Number(trade.entry || 0) - Number(trade.stopLoss || 0))
  const volume = Number(trade.volume || trade.quantity || 0)
  const multiplier = Number(trade.contractMultiplier || 1)

  if (!riskDistance || !volume || !multiplier) {
    return 0
  }

  return round(riskDistance * volume * multiplier, 2)
}

export function calculateRiskPercentOfAccount(trade, accountSize = 0) {
  const balance = Number(accountSize || 0)
  if (!balance) {
    return 0
  }

  return round((calculateActualRiskAmount(trade) / balance) * 100, 3)
}

export function inferContractMultiplier(symbol = '') {
  const value = String(symbol || '').toUpperCase()

  if (['XAUUSD', 'XAUUSDSHORT', 'XAUUSDLONG'].some((entry) => value.startsWith(entry.replace('SHORT', '').replace('LONG', '')))) {
    return 100
  }

  if (value === 'XAGUSD') {
    return 5000
  }

  if (/^[A-Z]{6}$/.test(value)) {
    return 100000
  }

  if (/^(US30|NAS100|SPX|GER40|UK100|DJI|NQ|ES)/.test(value)) {
    return 1
  }

  return 1
}

export function inferPipSize(symbol = '') {
  const value = String(symbol || '').toUpperCase()

  if (value.includes('JPY')) {
    return 0.01
  }

  if (value.startsWith('XAU') || value.startsWith('XAG') || /^(US30|NAS100|SPX|GER40|UK100|DJI|NQ|ES)/.test(value)) {
    return 0.1
  }

  if (/^[A-Z]{6}$/.test(value)) {
    return 0.0001
  }

  return 0.01
}

export function calculatePipsMoved(trade) {
  const entry = Number(trade.entry || 0)
  const close = Number(trade.closePrice ?? trade.exitPrice ?? 0)
  const pipSize = Number(trade.pipSize || inferPipSize(trade.pair))

  if (!entry || !close || !pipSize) {
    return 0
  }

  const move = trade.direction === 'Short' ? entry - close : close - entry
  return round(move / pipSize, 1)
}

export function sortTradesDesc(trades) {
  return [...trades].sort((a, b) => getTradeTimestamp(b) - getTradeTimestamp(a))
}

export function buildDashboardMetrics(trades) {
  if (!trades.length) {
    return {
      totalTrades: 0,
      winRate: 0,
      netPnl: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      averageRR: 0,
      currentStreak: { type: 'flat', count: 0 },
      bestDay: null,
      worstDay: null,
      ruleFollowedRate: 0,
      outsidePlanRate: 0
    }
  }

  const wins = trades.filter((trade) => classifyTradeOutcome(trade) === 'win')
  const losses = trades.filter((trade) => classifyTradeOutcome(trade) === 'loss')
  const netPnl = trades.reduce((sum, trade) => sum + trade.resultAmount, 0)
  const grossWins = wins.reduce((sum, trade) => sum + trade.resultAmount, 0)
  const grossLosses = Math.abs(losses.reduce((sum, trade) => sum + trade.resultAmount, 0))
  const ruleFollowedCount = trades.filter((trade) => trade.journal.followedPlan).length
  const averageRR = round(
    trades.reduce((sum, trade) => sum + calculatePlannedRR(trade), 0) / trades.length,
    2
  )

  const byDay = trades.reduce((acc, trade) => {
    acc[trade.date] = (acc[trade.date] || 0) + trade.resultAmount
    return acc
  }, {})

  const dayRows = Object.entries(byDay).map(([date, pnl]) => ({ date, pnl }))
  const bestDay = dayRows.reduce((best, day) => (!best || day.pnl > best.pnl ? day : best), null)
  const worstDay = dayRows.reduce((worst, day) => (!worst || day.pnl < worst.pnl ? day : worst), null)

  const streakSource = sortTradesDesc(trades)
  let streakType = 'flat'
  let streakCount = 0

  for (const trade of streakSource) {
    const nextType = classifyTradeOutcome(trade)

    if (streakCount === 0) {
      streakType = nextType
      streakCount = 1
      continue
    }

    if (nextType === streakType) {
      streakCount += 1
      continue
    }

    break
  }

  return {
    totalTrades: trades.length,
    winRate: round((wins.length / (wins.length + losses.length || trades.length)) * 100, 1),
    netPnl: round(netPnl, 2),
    avgWin: wins.length ? round(grossWins / wins.length, 2) : 0,
    avgLoss: losses.length ? round(Math.abs(losses.reduce((sum, trade) => sum + trade.resultAmount, 0)) / losses.length, 2) : 0,
    profitFactor: grossLosses ? round(grossWins / grossLosses, 2) : round(grossWins, 2),
    averageRR,
    currentStreak: { type: streakType, count: streakCount },
    bestDay,
    worstDay,
    ruleFollowedRate: round((ruleFollowedCount / trades.length) * 100, 1),
    outsidePlanRate: round(((trades.length - ruleFollowedCount) / trades.length) * 100, 1)
  }
}

export function buildEquityCurve(trades, settings = {}) {
  let balance = Number(getActiveAccount(settings)?.size || 0)

  return [...trades]
    .sort((a, b) => getTradeTimestamp(a) - getTradeTimestamp(b))
    .map((trade) => {
      balance += trade.resultAmount
      return {
        date: trade.openTime || trade.closeTime || trade.date,
        value: round(balance, 2)
      }
    })
}

export function buildPnlByPeriod(trades) {
  const grouped = trades.reduce((acc, trade) => {
    const date = parseTradeDate(trade)
    const weekKey = format(startOfWeek(date, { weekStartsOn: 1 }), 'MMM d, yyyy')
    const monthKey = format(date, 'MMM yyyy')

    acc.week[weekKey] = (acc.week[weekKey] || 0) + trade.resultAmount
    acc.month[monthKey] = (acc.month[monthKey] || 0) + trade.resultAmount
    return acc
  }, { week: {}, month: {} })

  return {
    week: Object.entries(grouped.week).map(([label, value]) => ({ label, value: round(value, 2) })),
    month: Object.entries(grouped.month).map(([label, value]) => ({ label, value: round(value, 2) }))
  }
}

function tradeSetups(trade) {
  if (Array.isArray(trade.setupStack) && trade.setupStack.length) {
    return [...new Set(trade.setupStack.filter(Boolean))]
  }

  return [trade.setupType].filter(Boolean)
}

function aggregateByField(trades, field) {
  return Object.entries(
    trades.reduce((acc, trade) => {
      const key = trade[field]
      if (!acc[key]) {
        acc[key] = { label: key, trades: 0, wins: 0, pnl: 0 }
      }

      acc[key].trades += 1
      acc[key].pnl += trade.resultAmount
      if (classifyTradeOutcome(trade) === 'win') {
        acc[key].wins += 1
      }
      return acc
    }, {})
  )
    .map(([, item]) => ({
      ...item,
      pnl: round(item.pnl, 2),
      winRate: item.trades ? round((item.wins / item.trades) * 100, 1) : 0
    }))
    .sort((a, b) => b.pnl - a.pnl)
}

function aggregateBySetupStack(trades) {
  return Object.entries(
    trades.reduce((acc, trade) => {
      tradeSetups(trade).forEach((setup) => {
        if (!acc[setup]) {
          acc[setup] = { label: setup, trades: 0, wins: 0, pnl: 0 }
        }

        acc[setup].trades += 1
        acc[setup].pnl += trade.resultAmount

        if (classifyTradeOutcome(trade) === 'win') {
          acc[setup].wins += 1
        }
      })

      return acc
    }, {})
  )
    .map(([, item]) => ({
      ...item,
      pnl: round(item.pnl, 2),
      winRate: item.trades ? round((item.wins / item.trades) * 100, 1) : 0
    }))
    .sort((a, b) => b.pnl - a.pnl)
}

export function buildAnalyticsSeries(trades, settings = {}) {
  const outcomeCounts = {
    win: trades.filter((trade) => classifyTradeOutcome(trade) === 'win').length,
    loss: trades.filter((trade) => classifyTradeOutcome(trade) === 'loss').length,
    breakeven: trades.filter((trade) => classifyTradeOutcome(trade) === 'breakeven').length
  }

  const calendar = trades.map((trade) => ({
    date: trade.date,
    value: trade.resultAmount,
    trades: 1,
    intensity: Math.min(1, Math.abs(trade.resultAmount) / 450)
  }))

  const calendarByDay = Object.values(
    calendar.reduce((acc, cell) => {
      if (!acc[cell.date]) {
        acc[cell.date] = {
          date: cell.date,
          value: 0,
          trades: 0,
          intensity: 0
        }
      }

      acc[cell.date].value += cell.value
      acc[cell.date].trades += 1
      acc[cell.date].intensity = Math.min(1, Math.abs(acc[cell.date].value) / 450)
      return acc
    }, {})
  )

  const mistakeFrequency = Object.entries(
    trades.reduce((acc, trade) => {
      const key = trade.journal.mistakeMade
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
  )
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)

  return {
    equityCurve: buildEquityCurve(trades, settings),
    pnlByPeriod: buildPnlByPeriod(trades),
    performanceByPair: aggregateByField(trades, 'pair'),
    performanceBySession: aggregateByField(trades, 'session'),
    winRateBySetupType: aggregateBySetupStack(trades),
    calendar: calendarByDay,
    mistakeFrequency,
    outcomeCounts
  }
}

export function buildChecklistSummary(trades, checklistItems = []) {
  return checklistItems.map(({ id, label }) => {
    const passed = trades.filter((trade) => trade.checklist?.[id]).length
    return {
      label,
      passed,
      rate: trades.length ? round((passed / trades.length) * 100, 1) : 0
    }
  })
}

export function buildFilterOptions(trades) {
  const unique = (field) => [...new Set(trades.map((trade) => trade[field]))]
  const uniqueSetupTypes = [...new Set(trades.flatMap((trade) => tradeSetups(trade)))].sort()
  const uniqueTags = [...new Set(trades.flatMap((trade) => trade.tags || []))].sort()

  return {
    pairs: unique('pair'),
    sessions: unique('session'),
    setupTypes: uniqueSetupTypes,
    statuses: unique('status'),
    tags: uniqueTags
  }
}

export function getActiveAccount(settings) {
  const accounts = Array.isArray(settings.accounts) ? settings.accounts : []
  const active = accounts.find((account) => account.id === settings.activeAccountId)
  return active || accounts[0] || null
}

export function calculateRiskAmount(settings) {
  const accountSize = Number(getActiveAccount(settings)?.size || 0)
  const riskPerTrade = Number(settings.riskPerTrade || 0)

  if (settings.riskMode === 'percent') {
    return round(accountSize * (riskPerTrade / 100), 2)
  }

  return round(riskPerTrade, 2)
}

function parseTradeDate(trade) {
  const value = trade.openTime || trade.closeTime || trade.date
  if (!value) {
    return new Date()
  }

  const parsed = typeof value === 'string'
    ? parseISO(value.includes('T') ? value : value.replace(' ', 'T'))
    : new Date(value)

  return Number.isNaN(parsed.getTime()) ? new Date() : parsed
}

function getTradeTimestamp(trade) {
  return parseTradeDate(trade).getTime()
}
