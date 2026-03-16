function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      index += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())
  return values
}

export function parseCsvText(csvText) {
  const rows = String(csvText || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length)

  if (!rows.length) {
    return { headers: [], records: [] }
  }

  const headers = parseCsvLine(rows[0]).map((header) => header.trim())
  const records = rows.slice(1).map((line) => {
    const values = parseCsvLine(line)
    return headers.reduce((acc, header, index) => {
      acc[header] = values[index] ?? ''
      return acc
    }, {})
  })

  return { headers, records }
}

export function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

export const CRS_IMPORT_FIELDS = [
  { key: 'id', label: 'Trade ID' },
  { key: 'symbol', label: 'Symbol / pair' },
  { key: 'direction', label: 'Direction' },
  { key: 'volume', label: 'Volume' },
  { key: 'entry', label: 'Open price / entry' },
  { key: 'closePrice', label: 'Close price' },
  { key: 'openTime', label: 'Open time' },
  { key: 'closeTime', label: 'Close time' },
  { key: 'profit', label: 'Gross profit' },
  { key: 'commission', label: 'Commission' },
  { key: 'swap', label: 'Swap / fees' },
  { key: 'netProfit', label: 'Net profit' },
  { key: 'stopLoss', label: 'Stop loss' },
  { key: 'takeProfit', label: 'Take profit' },
  { key: 'setupType', label: 'Primary setup' },
  { key: 'tags', label: 'Tags' },
  { key: 'notes', label: 'Notes' },
  { key: 'session', label: 'Session' },
  { key: 'accountName', label: 'Account name' }
]

const DEFAULT_IMPORT_ALIASES = {
  id: 'id',
  ticket: 'id',
  symbol: 'symbol',
  pair: 'symbol',
  instrument: 'symbol',
  direction: 'direction',
  side: 'direction',
  type: 'direction',
  volume: 'volume',
  lot: 'volume',
  lots: 'volume',
  quantity: 'volume',
  open_price: 'entry',
  entry: 'entry',
  entry_price: 'entry',
  close_price: 'closePrice',
  exit_price: 'closePrice',
  close: 'closePrice',
  result_amount: 'netProfit',
  open_time: 'openTime',
  entry_time: 'openTime',
  date: 'openTime',
  close_time: 'closeTime',
  exit_time: 'closeTime',
  profit: 'profit',
  pnl: 'profit',
  commission: 'commission',
  fees: 'swap',
  swap: 'swap',
  net_profit: 'netProfit',
  net_pnl: 'netProfit',
  sl: 'stopLoss',
  stop_loss: 'stopLoss',
  tp: 'takeProfit',
  take_profit: 'takeProfit',
  setup: 'setupType',
  setup_type: 'setupType',
  tags: 'tags',
  notes: 'notes',
  comment: 'notes',
  session: 'session',
  account: 'accountName',
  account_name: 'accountName'
}

export function createDefaultFieldMapping(headers) {
  return headers.reduce((acc, header) => {
    acc[header] = DEFAULT_IMPORT_ALIASES[normalizeHeader(header)] || ''
    return acc
  }, {})
}

export function createTradeDraftFromRow(row, fieldMapping, settings) {
  const mapped = Object.entries(fieldMapping).reduce((acc, [header, fieldKey]) => {
    if (fieldKey) {
      acc[fieldKey] = row[header]
    }
    return acc
  }, {})

  const parsedDate = extractDate(mapped.openTime || mapped.closeTime)
  const parsedDirection = normalizeDirection(mapped.direction, mapped.symbol)
  const symbol = normalizeSymbol(mapped.symbol)
  const account = resolveAccount(mapped.accountName, settings)
  const openTime = normalizeDateTime(mapped.openTime)
  const closeTime = normalizeDateTime(mapped.closeTime)

  return {
    id: mapped.id || '',
    date: parsedDate,
    openTime: openTime || `${parsedDate}T00:00:00`,
    closeTime,
    pair: symbol,
    direction: parsedDirection,
    volume: toNumber(mapped.volume, 0),
    entry: toNumber(mapped.entry, 0),
    closePrice: toNumber(mapped.closePrice, 0),
    stopLoss: toNumber(mapped.stopLoss, 0),
    takeProfit: toNumber(mapped.takeProfit, toNumber(mapped.closePrice, 0)),
    commission: Math.abs(toNumber(mapped.commission, 0)),
    swap: Math.abs(toNumber(mapped.swap, 0)),
    resultAmount: mapped.netProfit !== undefined && mapped.netProfit !== ''
      ? toNumber(mapped.netProfit, 0)
      : toNumber(mapped.profit, 0) - Math.abs(toNumber(mapped.commission, 0)) - Math.abs(toNumber(mapped.swap, 0)),
    session: mapped.session || 'London',
    accountId: account.id,
    accountName: account.name,
    setupType: mapped.setupType || 'Imported trade',
    setupStack: [mapped.setupType || 'Imported trade'],
    tags: splitList(mapped.tags),
    screenshot: '',
    journal: {
      whyTaken: '',
      htfBias: '',
      entryModel: '',
      followedPlan: false,
      emotionBefore: '',
      emotionAfter: '',
      mistakeMade: '',
      lessonLearned: '',
      notes: mapped.notes || ''
    },
    checklist: (settings.checklistItems || []).reduce((acc, item) => {
      acc[item.id] = false
      return acc
    }, {})
  }
}

export function exportTradesToCsv(trades) {
  const headers = [
    'id',
    'symbol',
    'direction',
    'volume',
    'open_price',
    'close_price',
    'open_time',
    'close_time',
    'profit',
    'commission',
    'swap',
    'net_profit',
    'sl',
    'tp',
    'session',
    'setup',
    'tags',
    'notes'
  ]

  const rows = trades.map((trade) => [
    trade.id,
    trade.pair,
    trade.direction.toLowerCase(),
    formatNumber(trade.volume, 2),
    formatNumber(trade.entry, 4),
    formatNumber(trade.closePrice, 4),
    formatCsvDateTime(trade.openTime, trade.date),
    formatCsvDateTime(trade.closeTime, trade.date),
    formatNumber((trade.resultAmount || 0) + Math.abs(trade.commission || 0) + Math.abs(trade.swap || 0), 2),
    formatNumber(trade.commission, 2),
    formatNumber(trade.swap, 2),
    formatNumber(trade.resultAmount, 2),
    formatNumber(trade.stopLoss, 4),
    formatNumber(trade.takeProfit, 4),
    trade.session || '',
    trade.setupType || '',
    (trade.tags || []).join(' | '),
    trade.journal?.notes || ''
  ])

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(','))
    .join('\n')
}

function extractDate(value) {
  const text = String(value || '').trim()
  if (!text) {
    return new Date().toISOString().slice(0, 10)
  }

  const directMatch = text.match(/\d{4}-\d{2}-\d{2}/)
  if (directMatch) {
    return directMatch[0]
  }

  const parsed = new Date(text)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10)
  }

  return new Date().toISOString().slice(0, 10)
}

function normalizeDateTime(value) {
  const text = String(value || '').trim()
  if (!text) {
    return ''
  }

  const normalized = text.replace(' ', 'T')
  const parsed = new Date(normalized)
  if (!Number.isNaN(parsed.getTime())) {
    return normalized.length === 19 ? normalized : parsed.toISOString().slice(0, 19)
  }

  return normalized
}

function normalizeDirection(direction, symbol = '') {
  const direct = String(direction || '').trim().toLowerCase()
  if (direct === 'sell' || direct === 'short') {
    return 'Short'
  }
  if (direct === 'buy' || direct === 'long') {
    return 'Long'
  }

  const symbolText = String(symbol || '').trim().toLowerCase()
  if (symbolText.endsWith('short')) {
    return 'Short'
  }
  if (symbolText.endsWith('long')) {
    return 'Long'
  }

  return 'Long'
}

function normalizeSymbol(symbol = '') {
  return String(symbol || '')
    .trim()
    .replace(/(long|short)$/i, '')
    .toUpperCase()
}

function resolveAccount(accountName, settings = {}) {
  const accounts = Array.isArray(settings.accounts) ? settings.accounts : []
  const normalizedName = String(accountName || '').trim()
  if (!normalizedName) {
    const activeAccount = accounts.find((account) => account.id === settings.activeAccountId)
    return activeAccount || accounts[0] || { id: null, name: '' }
  }

  return (
    accounts.find((account) => account.name === normalizedName) ||
    accounts.find((account) => account.id === settings.activeAccountId) ||
    accounts[0] ||
    { id: null, name: normalizedName }
  )
}

function splitList(value) {
  return String(value || '')
    .split(/[|;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function toNumber(value, fallback = 0) {
  const normalized = Number(String(value ?? '').replace(/[^0-9.-]+/g, ''))
  return Number.isFinite(normalized) ? normalized : fallback
}

function formatNumber(value, digits = 2) {
  return Number(value || 0).toFixed(digits)
}

function formatCsvDateTime(value, fallbackDate = '') {
  const normalized = normalizeDateTime(value)
  if (normalized) {
    return normalized.replace('T', ' ')
  }

  if (fallbackDate) {
    return `${fallbackDate} 00:00:00`
  }

  return ''
}

function escapeCsvValue(value) {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}
