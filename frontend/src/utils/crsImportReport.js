function toDisplayValue(value) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

export function createImportIssue({ rowNumber, tradeDraft, reason, duplicateTradeId = '', type = 'invalid' }) {
  return {
    type,
    rowNumber,
    pair: toDisplayValue(tradeDraft?.pair),
    direction: toDisplayValue(tradeDraft?.direction),
    openTime: toDisplayValue(tradeDraft?.openTime || tradeDraft?.date),
    entry: toDisplayValue(tradeDraft?.entry),
    closePrice: toDisplayValue(tradeDraft?.closePrice),
    volume: toDisplayValue(tradeDraft?.volume),
    reason: toDisplayValue(reason),
    duplicateTradeId: toDisplayValue(duplicateTradeId || '')
  }
}

export function buildImportIssuesCsv(duplicates = [], invalidRows = [], failedRows = []) {
  const headers = ['type', 'row_number', 'pair', 'direction', 'open_time', 'entry', 'close_price', 'volume', 'reason', 'duplicate_trade_id']
  const rows = [
    ...duplicates.map((issue) => ['duplicate', issue.rowNumber, issue.pair, issue.direction, issue.openTime, issue.entry, issue.closePrice, issue.volume, issue.reason, issue.duplicateTradeId]),
    ...invalidRows.map((issue) => ['invalid', issue.rowNumber, issue.pair, issue.direction, issue.openTime, issue.entry, issue.closePrice, issue.volume, issue.reason, issue.duplicateTradeId]),
    ...failedRows.map((issue) => ['failed', issue.rowNumber, issue.pair, issue.direction, issue.openTime, issue.entry, issue.closePrice, issue.volume, issue.reason, issue.duplicateTradeId])
  ]

  return [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
}
