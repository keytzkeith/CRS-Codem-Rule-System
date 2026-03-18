const DEFAULT_SESSION_TIMEZONE = 'Africa/Nairobi';

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
};

const REQUIRED_FIELDS = ['symbol', 'direction', 'entry', 'closePrice', 'openTime'];

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function parseCsvText(csvText) {
  const rows = String(csvText || '')
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.trim().length);

  if (!rows.length) {
    return { headers: [], records: [] };
  }

  const headers = parseCsvLine(rows[0]).map((header) => header.trim());
  const records = rows.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const record = headers.reduce((acc, header, headerIndex) => {
      acc[header] = values[headerIndex] ?? '';
      return acc;
    }, {});
    record.__rowNumber = index + 2;
    return record;
  });

  return { headers, records };
}

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function createDefaultFieldMapping(headers) {
  return headers.reduce((acc, header) => {
    acc[header] = DEFAULT_IMPORT_ALIASES[normalizeHeader(header)] || '';
    return acc;
  }, {});
}

function detectCrsFormat(headers) {
  const mapping = createDefaultFieldMapping(headers || []);
  const mappedFields = new Set(Object.values(mapping).filter(Boolean));
  const hasRequired = REQUIRED_FIELDS.every((field) => mappedFields.has(field));

  if (!hasRequired) {
    return null;
  }

  const normalizedHeaders = new Set((headers || []).map(normalizeHeader));
  const brokerStyle = normalizedHeaders.has('open_price') || normalizedHeaders.has('net_profit') || normalizedHeaders.has('sl');
  return brokerStyle ? 'crs-broker' : 'crs-native';
}

function extractDate(value) {
  const text = String(value || '').trim();
  if (!text) {
    return new Date().toISOString().slice(0, 10);
  }

  const directMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (directMatch) {
    return directMatch[0];
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return new Date().toISOString().slice(0, 10);
}

function normalizeDateTime(value) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }

  const normalized = text.replace('T', ' ');
  const localMatch = normalized.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})(?::(\d{2}))?$/);

  if (localMatch) {
    const seconds = localMatch[3] || '00';
    return `${localMatch[1]}T${localMatch[2]}:${seconds}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 19);
  }

  return '';
}

function toNumber(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  const normalized = String(value).replace(/[$,\s]/g, '');
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeSymbol(value) {
  return String(value || '').replace(/[^A-Za-z0-9.]/g, '').toUpperCase();
}

function normalizeDirection(value, symbol) {
  const text = String(value || '').trim().toLowerCase();
  const symbolText = String(symbol || '').trim().toLowerCase();

  if (text.includes('sell') || text.includes('short') || text === 's' || symbolText.endsWith('short')) {
    return 'short';
  }

  return 'long';
}

function splitList(value) {
  return String(value || '')
    .split(/[|,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractSessionHour(value, timezone) {
  const text = String(value || '').trim();
  if (!text) {
    return null;
  }

  const normalized = text.replace(' ', 'T');
  const localMatch = normalized.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);

  if (localMatch) {
    return Number(localMatch[2]);
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone || DEFAULT_SESSION_TIMEZONE,
    hour: '2-digit',
    hourCycle: 'h23'
  });

  const hourPart = formatter.formatToParts(parsed).find((part) => part.type === 'hour');
  return hourPart ? Number(hourPart.value) : null;
}

function deriveSessionLabel(value, fallback = 'London', timezone = DEFAULT_SESSION_TIMEZONE) {
  const hour = extractSessionHour(value, timezone);

  if (hour === null) {
    return fallback;
  }

  if (hour < 10) {
    return 'Asia';
  }

  if (hour < 16) {
    return 'London';
  }

  return 'New York';
}

function inferContractMultiplier(symbol = '') {
  const value = String(symbol || '').toUpperCase();

  if (value.startsWith('XAUUSD')) return 100;
  if (value === 'XAGUSD') return 5000;
  if (/^[A-Z]{6}$/.test(value)) return 100000;
  if (/^(US30|NAS100|SPX|GER40|UK100|DJI|NQ|ES)/.test(value)) return 1;
  return 1;
}

function inferPipSize(symbol = '') {
  const value = String(symbol || '').toUpperCase();

  if (value.includes('JPY')) return 0.01;
  if (value.startsWith('XAU') || value.startsWith('XAG') || /^(US30|NAS100|SPX|GER40|UK100|DJI|NQ|ES)/.test(value)) return 0.1;
  if (/^[A-Z]{6}$/.test(value)) return 0.0001;
  return 0.01;
}

function resolveAccount(accountName, accountsByKey, defaultAccount) {
  const raw = String(accountName || '').trim().toLowerCase();

  if (raw && accountsByKey.has(raw)) {
    return accountsByKey.get(raw);
  }

  return defaultAccount || null;
}

function buildAccountsLookup(accounts = []) {
  const accountsByKey = new Map();

  accounts.forEach((account) => {
    const keys = [
      account.id,
      account.account_name,
      account.account_identifier,
      account.name,
      account.identifier
    ].filter(Boolean);

    keys.forEach((key) => {
      accountsByKey.set(String(key).trim().toLowerCase(), account);
    });
  });

  return accountsByKey;
}

function createTradeDraftFromRow(row, fieldMapping, options = {}) {
  const mapped = Object.entries(fieldMapping).reduce((acc, [header, fieldKey]) => {
    if (fieldKey) {
      acc[fieldKey] = row[header];
    }
    return acc;
  }, {});

  const parsedDate = extractDate(mapped.openTime || mapped.closeTime);
  const openTime = normalizeDateTime(mapped.openTime) || `${parsedDate}T00:00:00`;
  const closeTime = normalizeDateTime(mapped.closeTime);
  const symbol = normalizeSymbol(mapped.symbol);
  const direction = normalizeDirection(mapped.direction, mapped.symbol);
  const account = resolveAccount(mapped.accountName, options.accountsByKey || new Map(), options.defaultAccount);
  const entry = toNumber(mapped.entry, 0);
  const closePrice = toNumber(mapped.closePrice, 0);
  const volume = toNumber(mapped.volume, 0);
  const commission = Math.abs(toNumber(mapped.commission, 0));
  const swap = Math.abs(toNumber(mapped.swap, 0));
  const netProfit = mapped.netProfit !== undefined && mapped.netProfit !== ''
    ? toNumber(mapped.netProfit, 0)
    : toNumber(mapped.profit, 0) - commission - swap;
  const stopLoss = toNumber(mapped.stopLoss, 0);
  const takeProfit = toNumber(mapped.takeProfit, closePrice);
  const pipSize = inferPipSize(symbol);
  const contractMultiplier = inferContractMultiplier(symbol);
  const actualRiskAmount = entry && stopLoss && volume
    ? Math.round(Math.abs(entry - stopLoss) * volume * contractMultiplier * 100) / 100
    : null;
  const riskPercentOfAccount = actualRiskAmount && options.defaultAccount && Number(options.defaultAccount.initial_balance || 0)
    ? Math.round((actualRiskAmount / Number(options.defaultAccount.initial_balance)) * 1000000) / 10000
    : null;
  const move = entry && closePrice
    ? (direction === 'short' ? entry - closePrice : closePrice - entry)
    : null;
  const pips = move != null ? Math.round((move / pipSize) * 10) / 10 : null;
  const resultR = actualRiskAmount && netProfit != null
    ? Math.round((netProfit / actualRiskAmount) * 1000) / 1000
    : null;
  const session = deriveSessionLabel(openTime || closeTime || parsedDate, mapped.session || 'London', options.timezone || DEFAULT_SESSION_TIMEZONE);
  const setup = mapped.setupType || 'Imported trade';
  const tags = splitList(mapped.tags);
  const notes = String(mapped.notes || '').trim();

  return {
    importRowNumber: row.__rowNumber || null,
    importRowId: mapped.id || '',
    symbol,
    tradeDate: parsedDate,
    entryTime: openTime,
    exitTime: closeTime || null,
    entryPrice: entry,
    exitPrice: closePrice,
    quantity: volume,
    side: direction,
    commission,
    fees: 0,
    swap,
    pnl: netProfit,
    stopLoss,
    takeProfit,
    broker: 'crs',
    accountIdentifier: account?.id || account?.account_identifier || account?.identifier || null,
    strategy: session,
    setup,
    setupStack: [setup],
    tags,
    notes,
    journalPayload: notes ? { notes, session } : { session },
    checklistPayload: {},
    contractMultiplier,
    pipSize,
    actualRiskAmount,
    riskPercentOfAccount,
    pips,
    rValue: resultR
  };
}

function validateTradeDraft(tradeDraft) {
  if (!tradeDraft.symbol || !tradeDraft.entryPrice || !tradeDraft.exitPrice || !tradeDraft.entryTime) {
    return 'Missing one of the required fields: symbol, entry, close price, or open time.';
  }

  if (!tradeDraft.quantity) {
    return 'Missing required volume/quantity.';
  }

  return null;
}

function parseCrsCsv(fileBuffer, options = {}) {
  const csvText = Buffer.isBuffer(fileBuffer) ? fileBuffer.toString('utf-8') : String(fileBuffer || '');
  const { headers, records } = parseCsvText(csvText);
  const detectedFormat = detectCrsFormat(headers);

  if (!detectedFormat) {
    return {
      detectedFormat: null,
      trades: [],
      invalidRows: [],
      headers
    };
  }

  const fieldMapping = options.fieldMapping && typeof options.fieldMapping === 'object'
    ? options.fieldMapping
    : createDefaultFieldMapping(headers);
  const accountsByKey = options.accountsByKey || buildAccountsLookup(options.accounts || []);
  const trades = [];
  const invalidRows = [];

  records.forEach((row) => {
    const tradeDraft = createTradeDraftFromRow(row, fieldMapping, {
      ...options,
      accountsByKey
    });
    const issue = validateTradeDraft(tradeDraft);

    if (issue) {
      invalidRows.push({
        rowNumber: row.__rowNumber,
        reason: issue,
        trade: tradeDraft
      });
      return;
    }

    trades.push(tradeDraft);
  });

  return {
    detectedFormat,
    trades,
    invalidRows,
    headers
  };
}

module.exports = {
  DEFAULT_SESSION_TIMEZONE,
  detectCrsFormat,
  parseCrsCsv
};
