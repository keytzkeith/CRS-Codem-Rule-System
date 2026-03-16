#!/usr/bin/env node
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const db = require('../src/config/database');

const CRS_META_MARKER = '[CRS_META]';
const DEFAULT_SESSION_TIMEZONE = 'Africa/Nairobi';
const SESSION_LABELS = new Set(['Asia', 'London', 'New York']);

function round(value, digits = 8) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function inferContractMultiplier(symbol = '') {
  const value = String(symbol || '').toUpperCase();

  if (value.startsWith('XAUUSD')) {
    return 100;
  }

  if (value === 'XAGUSD') {
    return 5000;
  }

  if (/^[A-Z]{6}$/.test(value)) {
    return 100000;
  }

  if (/^(US30|NAS100|SPX|GER40|UK100|DJI|NQ|ES)/.test(value)) {
    return 1;
  }

  return 1;
}

function inferPipSize(symbol = '') {
  const value = String(symbol || '').toUpperCase();

  if (value.includes('JPY')) {
    return 0.01;
  }

  if (value.startsWith('XAU') || value.startsWith('XAG') || /^(US30|NAS100|SPX|GER40|UK100|DJI|NQ|ES)/.test(value)) {
    return 0.1;
  }

  if (/^[A-Z]{6}$/.test(value)) {
    return 0.0001;
  }

  return 0.01;
}

function parseJsonField(value, fallback) {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseCrsNotes(notes = '') {
  const rawNotes = String(notes || '');
  const markerIndex = rawNotes.lastIndexOf(CRS_META_MARKER);

  if (markerIndex === -1) {
    return { visibleNotes: rawNotes.trim() };
  }

  const visibleNotes = rawNotes.slice(0, markerIndex).trim();
  const serializedMeta = rawNotes.slice(markerIndex + CRS_META_MARKER.length).trim();

  try {
    return {
      ...JSON.parse(serializedMeta),
      visibleNotes
    };
  } catch {
    return { visibleNotes: rawNotes.trim() };
  }
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
  if (!hourPart) {
    return null;
  }

  return Number(hourPart.value);
}

function calculateActualRiskAmount(trade) {
  const entry = Number(trade.entry_price || 0);
  const stopLoss = Number(trade.stop_loss || 0);
  const quantity = Number(trade.quantity || 0);
  const multiplier = Number(trade.contract_multiplier || inferContractMultiplier(trade.symbol));
  const riskDistance = Math.abs(entry - stopLoss);

  if (!entry || !stopLoss || !quantity || !multiplier || !riskDistance) {
    return null;
  }

  return round(riskDistance * quantity * multiplier, 2);
}

function calculateRiskPercentOfAccount(actualRiskAmount, initialBalance) {
  const balance = Number(initialBalance || 0);
  const risk = Number(actualRiskAmount || 0);

  if (!balance || !risk) {
    return null;
  }

  return round((risk / balance) * 100, 4);
}

function calculatePips(trade) {
  const entry = Number(trade.entry_price || 0);
  const exit = Number(trade.exit_price || 0);
  const pipSize = Number(trade.pip_size || inferPipSize(trade.symbol));

  if (!entry || !exit || !pipSize) {
    return null;
  }

  const move = trade.side === 'short' ? entry - exit : exit - entry;
  return round(move / pipSize, 1);
}

function buildSetupStack(trade, meta) {
  const raw = parseJsonField(trade.setup_stack, null);

  if (Array.isArray(raw) && raw.length) {
    return raw.filter(Boolean);
  }

  if (Array.isArray(meta.setupStack) && meta.setupStack.length) {
    return meta.setupStack.filter(Boolean);
  }

  const setup = String(trade.setup || '').trim();
  return setup ? [setup] : [];
}

function buildJournalPayload(trade, meta) {
  const raw = parseJsonField(trade.journal_payload, null);
  if (raw && typeof raw === 'object' && Object.keys(raw).length) {
    return raw;
  }

  if (meta.journal && typeof meta.journal === 'object') {
    return meta.journal;
  }

  const visibleNotes = meta.visibleNotes || String(trade.notes || '').trim();
  if (!visibleNotes) {
    return {};
  }

  return { notes: visibleNotes };
}

function buildChecklistPayload(trade, meta) {
  const raw = parseJsonField(trade.checklist_payload, null);
  if (raw && typeof raw === 'object' && Object.keys(raw).length) {
    return raw;
  }

  if (meta.checklist && typeof meta.checklist === 'object') {
    return meta.checklist;
  }

  return {};
}

function changed(currentValue, nextValue) {
  if (currentValue === null || currentValue === undefined) {
    return nextValue !== null && nextValue !== undefined;
  }

  if (typeof currentValue === 'object') {
    return JSON.stringify(currentValue) !== JSON.stringify(nextValue);
  }

  return String(currentValue) !== String(nextValue);
}

async function repairTrades({ dryRun = false, limit = null, timezone = DEFAULT_SESSION_TIMEZONE } = {}) {
  const query = `
    SELECT
      t.id,
      t.user_id,
      t.symbol,
      t.side,
      t.strategy,
      t.entry_time,
      t.exit_time,
      t.account_identifier,
      t.entry_price,
      t.exit_price,
      t.quantity,
      t.stop_loss,
      t.setup,
      t.setup_stack,
      t.journal_payload,
      t.checklist_payload,
      t.contract_multiplier,
      t.pip_size,
      t.swap,
      t.actual_risk_amount,
      t.risk_percent_of_account,
      t.pips,
      t.notes,
      ua.initial_balance
    FROM trades t
    LEFT JOIN user_accounts ua
      ON ua.user_id = t.user_id
     AND ua.account_identifier IS NOT DISTINCT FROM t.account_identifier
    ORDER BY t.created_at ASC
    ${limit ? `LIMIT ${Number(limit)}` : ''}
  `;

  const { rows } = await db.query(query);
  let touched = 0;
  let scanned = 0;

  for (const trade of rows) {
    scanned += 1;
    const meta = parseCrsNotes(trade.notes);
    const nextContractMultiplier = round(trade.contract_multiplier ?? meta.contractMultiplier ?? inferContractMultiplier(trade.symbol), 8);
    const nextPipSize = round(trade.pip_size ?? meta.pipSize ?? inferPipSize(trade.symbol), 8);
    const nextSwap = round(trade.swap ?? meta.swap ?? 0, 8);
    const nextSetupStack = buildSetupStack(trade, meta);
    const nextJournalPayload = buildJournalPayload(trade, meta);
    const nextChecklistPayload = buildChecklistPayload(trade, meta);
    const sessionSeed = trade.entry_time || trade.exit_time || meta.openTime || meta.closeTime || null;
    const currentStrategy = String(trade.strategy || '').trim();
    const nextSession = deriveSessionLabel(sessionSeed, SESSION_LABELS.has(currentStrategy) ? currentStrategy : 'London', timezone);
    const nextActualRiskAmount = calculateActualRiskAmount({
      ...trade,
      contract_multiplier: nextContractMultiplier
    });
    const nextRiskPercent = calculateRiskPercentOfAccount(nextActualRiskAmount, trade.initial_balance);
    const nextPips = calculatePips({
      ...trade,
      pip_size: nextPipSize
    });

    const patch = {};

    if (changed(parseJsonField(trade.setup_stack, null), nextSetupStack)) {
      patch.setup_stack = JSON.stringify(nextSetupStack);
    }

    if (changed(parseJsonField(trade.journal_payload, null), nextJournalPayload)) {
      patch.journal_payload = JSON.stringify(nextJournalPayload);
    }

    if (changed(parseJsonField(trade.checklist_payload, null), nextChecklistPayload)) {
      patch.checklist_payload = JSON.stringify(nextChecklistPayload);
    }

    if (changed(trade.contract_multiplier, nextContractMultiplier)) {
      patch.contract_multiplier = nextContractMultiplier;
    }

    if (changed(trade.pip_size, nextPipSize)) {
      patch.pip_size = nextPipSize;
    }

    if (changed(trade.swap, nextSwap)) {
      patch.swap = nextSwap;
    }

    if ((!currentStrategy || SESSION_LABELS.has(currentStrategy)) && changed(trade.strategy, nextSession)) {
      patch.strategy = nextSession;
    }

    if (nextActualRiskAmount !== null && changed(trade.actual_risk_amount, nextActualRiskAmount)) {
      patch.actual_risk_amount = nextActualRiskAmount;
    }

    if (nextRiskPercent !== null && changed(trade.risk_percent_of_account, nextRiskPercent)) {
      patch.risk_percent_of_account = nextRiskPercent;
    }

    if (nextPips !== null && changed(trade.pips, nextPips)) {
      patch.pips = nextPips;
    }

    const patchEntries = Object.entries(patch);
    if (!patchEntries.length) {
      continue;
    }

    touched += 1;

    if (dryRun) {
      console.log(`[DRY RUN] Trade ${trade.id} ${trade.symbol}:`, patch);
      continue;
    }

    const fields = [];
    const values = [];
    let param = 1;

    for (const [key, value] of patchEntries) {
      fields.push(`${key} = $${param}`);
      values.push(value);
      param += 1;
    }

    values.push(trade.id);
    await db.query(
      `UPDATE trades SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${param}`,
      values
    );
  }

  console.log(`Timezone: ${timezone}`);
  console.log(`Scanned ${scanned} trades.`);
  console.log(`${dryRun ? 'Would update' : 'Updated'} ${touched} trades.`);
}

function parseArgs(argv) {
  return argv.reduce((acc, arg, index, all) => {
    if (arg === '--dry-run') {
      acc.dryRun = true;
    }

    if (arg === '--limit') {
      acc.limit = all[index + 1] || null;
    }

    if (arg === '--timezone') {
      acc.timezone = all[index + 1] || DEFAULT_SESSION_TIMEZONE;
    }

    return acc;
  }, { dryRun: false, limit: null, timezone: DEFAULT_SESSION_TIMEZONE });
}

(async () => {
  const options = parseArgs(process.argv.slice(2));

  try {
    await repairTrades(options);
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Failed to repair CRS trades:', error);
    await db.pool.end();
    process.exit(1);
  }
})();
