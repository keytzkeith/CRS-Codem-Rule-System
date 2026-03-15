import { parseISO, format, startOfWeek } from 'date-fns'

function round(value, digits = 2) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

export function calculatePlannedRR(trade) {
  const risk = Math.abs(trade.entry - trade.stopLoss)
  const reward = Math.abs(trade.takeProfit - trade.entry)

  if (!risk) {
    return 0
  }

  return round(reward / risk, 2)
}

export function sortTradesDesc(trades) {
  return [...trades].sort((a, b) => new Date(b.date) - new Date(a.date))
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

  const wins = trades.filter((trade) => trade.resultAmount > 0)
  const losses = trades.filter((trade) => trade.resultAmount < 0)
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
    const nextType = trade.resultAmount > 0 ? 'win' : trade.resultAmount < 0 ? 'loss' : 'breakeven'

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
    winRate: round((wins.length / trades.length) * 100, 1),
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

export function buildEquityCurve(trades) {
  let balance = 0

  return [...trades]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((trade) => {
      balance += trade.resultAmount
      return {
        date: trade.date,
        value: round(balance, 2)
      }
    })
}

export function buildPnlByPeriod(trades) {
  const grouped = trades.reduce((acc, trade) => {
    const date = parseISO(trade.date)
    const weekKey = format(startOfWeek(date, { weekStartsOn: 1 }), 'MMM d')
    const monthKey = format(date, 'MMM')

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
      if (trade.resultAmount > 0) {
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

        if (trade.resultAmount > 0) {
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

export function buildAnalyticsSeries(trades) {
  const outcomeCounts = {
    win: trades.filter((trade) => trade.resultAmount > 0).length,
    loss: trades.filter((trade) => trade.resultAmount < 0).length,
    breakeven: trades.filter((trade) => trade.resultAmount === 0).length
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
    equityCurve: buildEquityCurve(trades),
    pnlByPeriod: buildPnlByPeriod(trades),
    performanceByPair: aggregateByField(trades, 'pair'),
    performanceBySession: aggregateByField(trades, 'session'),
    winRateBySetupType: aggregateBySetupStack(trades),
    calendar: calendarByDay,
    mistakeFrequency,
    outcomeCounts
  }
}

export function buildChecklistSummary(trades) {
  const labels = [
    ['htfBosConfirmed', 'HTF BOS'],
    ['pullbackToOb', 'Pullback to OB'],
    ['m15Confirmation', 'M15 confirmation'],
    ['tradedWithBias', 'With bias'],
    ['validSession', 'Valid session'],
    ['minimumRRMet', 'RR >= 1:2']
  ]

  return labels.map(([key, label]) => {
    const passed = trades.filter((trade) => trade.checklist[key]).length
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
  return active || accounts[0] || { id: 'default', name: 'Primary account', size: 0 }
}

export function calculateRiskAmount(settings) {
  const accountSize = Number(getActiveAccount(settings).size || 0)
  const riskPerTrade = Number(settings.riskPerTrade || 0)

  if (settings.riskMode === 'percent') {
    return round(accountSize * (riskPerTrade / 100), 2)
  }

  return round(riskPerTrade, 2)
}
