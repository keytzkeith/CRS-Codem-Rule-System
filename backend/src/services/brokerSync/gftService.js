const axios = require('axios');
const Trade = require('../../models/Trade');
const BrokerConnection = require('../../models/BrokerConnection');
const AnalyticsCache = require('../analyticsCache');
const cache = require('../../utils/cache');
const db = require('../../config/database');

function invalidateInMemoryCache(userId) {
  const cacheKeys = Object.keys(cache.data || {}).filter((key) =>
    key.startsWith(`analytics:user_${userId}:`)
  );
  cacheKeys.forEach((key) => cache.del(key));
  console.log(`[GFT] Invalidated ${cacheKeys.length} in-memory analytics cache entries for user ${userId}`);
}

class GFTService {
  buildHeaders(token) {
    return {
      Accept: 'application/json, text/plain, */*',
      Authorization: `Token ${token}`,
      Origin: 'https://app.goatfundedtrader.com',
      Referer: 'https://app.goatfundedtrader.com/',
      'User-Agent': 'Mozilla/5.0'
    };
  }

  buildUrl(accountId) {
    return `https://gft.tradetechsolutions.app/trade/closedpositions/my-closedpositions-paginated/${accountId}/`;
  }

  async validateCredentials(accountId, token) {
    try {
      await axios.get(this.buildUrl(accountId), {
        headers: this.buildHeaders(token),
        params: { limit: 1, offset: 0 },
        timeout: 30000
      });

      return { valid: true, message: 'Credentials validated successfully' };
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        return { valid: false, message: 'Invalid Goat Funded Trader token or account ID' };
      }

      return { valid: false, message: error?.response?.data?.detail || error.message || 'Unable to validate GFT connection' };
    }
  }

  async syncTrades(connection, options = {}) {
    const { syncLogId, startDate, endDate } = options;

    if (syncLogId) {
      await BrokerConnection.updateSyncLog(syncLogId, 'fetching');
    }

    const rawTrades = await this.fetchAllTrades(connection.externalAccountId, connection.gftApiToken);

    if (syncLogId) {
      await BrokerConnection.updateSyncLog(syncLogId, 'parsing', {
        tradesFetched: rawTrades.length
      });
    }

    let normalizedTrades = rawTrades
      .map((trade) => this.normalizeTrade(trade, connection))
      .filter(Boolean);

    if (startDate || endDate) {
      normalizedTrades = normalizedTrades.filter((trade) => {
        const tradeDate = new Date(trade.tradeDate);
        if (startDate && tradeDate < new Date(startDate)) {
          return false;
        }
        if (endDate && tradeDate > new Date(endDate)) {
          return false;
        }
        return true;
      });
    }

    if (syncLogId) {
      await BrokerConnection.updateSyncLog(syncLogId, 'importing');
    }

    return this.importTrades(connection.userId, connection.id, normalizedTrades);
  }

  async fetchAllTrades(accountId, token) {
    const allTrades = [];
    const limit = 100;
    let offset = 0;
    let totalCount = null;

    while (true) {
      const response = await axios.get(this.buildUrl(accountId), {
        headers: this.buildHeaders(token),
        params: { limit, offset },
        timeout: 30000
      });

      const results = Array.isArray(response.data?.results) ? response.data.results : [];
      totalCount = Number(response.data?.count || totalCount || 0);

      if (!results.length) {
        break;
      }

      allTrades.push(...results);
      offset += results.length;

      if (totalCount && offset >= totalCount) {
        break;
      }
    }

    return allTrades;
  }

  normalizeTrade(trade, connection) {
    const symbol = this.cleanSymbol(trade?.symbol);
    const side = this.mapDirection(trade?.direction);
    const entryTime = this.normalizeDateTime(trade?.open_time);
    const exitTime = this.normalizeDateTime(trade?.close_time);
    const entryPrice = this.toNumber(trade?.open_price);
    const exitPrice = this.toNumber(trade?.close_price);
    const quantity = this.toNumber(trade?.volume);

    if (!symbol || !side || !entryTime || !exitTime || !entryPrice || !exitPrice || !quantity) {
      return null;
    }

    const profit = this.toNumber(trade?.profit);
    const commission = this.toNumber(trade?.commission);
    const swap = this.toNumber(trade?.swap);
    const pnl = Number((profit + swap - commission).toFixed(2));

    return {
      externalTradeId: String(trade?.id || '').trim(),
      symbol,
      side,
      quantity,
      entryTime,
      exitTime,
      entryPrice,
      exitPrice,
      tradeDate: (exitTime || entryTime).slice(0, 10),
      pnl,
      commission,
      swap,
      fees: 0,
      broker: 'gft',
      instrumentType: this.inferInstrumentType(symbol),
      stopLoss: this.nullableNumber(trade?.sl),
      takeProfit: this.nullableNumber(trade?.tp),
      brokerConnectionId: connection.id,
      accountIdentifier: connection.externalAccountId,
      contractMultiplier: this.inferContractMultiplier(symbol),
      executionData: [
        {
          action: side === 'long' ? 'buy' : 'sell',
          quantity,
          price: entryPrice,
          datetime: entryTime
        },
        {
          action: side === 'long' ? 'sell' : 'buy',
          quantity,
          price: exitPrice,
          datetime: exitTime
        }
      ]
    };
  }

  async importTrades(userId, connectionId, trades) {
    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let duplicates = 0;

    for (const tradeData of trades) {
      try {
        const existingTrade = await this.findExistingTrade(userId, connectionId, tradeData.externalTradeId);

        if (existingTrade) {
          if (this.hasTradeChanged(existingTrade, tradeData)) {
            await this.updateExistingTrade(existingTrade.id, userId, tradeData);
            updated++;
          } else {
            skipped++;
          }
          continue;
        }

        const createdTrade = await Trade.create(userId, {
          ...tradeData,
          exitPrice: tradeData.exitPrice,
          entryPrice: tradeData.entryPrice,
          executions: tradeData.executionData
        }, {
          skipAchievements: true,
          skipApiCalls: true
        });

        await db.query(
          'UPDATE trades SET external_trade_id = $2 WHERE id = $1',
          [createdTrade.id, tradeData.externalTradeId]
        );

        imported++;
      } catch (error) {
        if (error?.code === 'DUPLICATE_TRADE' || error?.status === 409) {
          duplicates++;
          continue;
        }

        console.error('[GFT] Failed to import trade:', error.message);
        failed++;
      }
    }

    if (imported > 0 || updated > 0) {
      await AnalyticsCache.invalidateUserCache(userId);
      invalidateInMemoryCache(userId);
    }

    return { imported, updated, skipped, failed, duplicates };
  }

  async findExistingTrade(userId, connectionId, externalTradeId) {
    if (!externalTradeId) {
      return null;
    }

    const result = await db.query(
      `SELECT id, symbol, side, quantity, entry_time, exit_time, entry_price, exit_price,
              pnl, commission, swap, stop_loss, take_profit, account_identifier
       FROM trades
       WHERE user_id = $1
         AND broker_connection_id = $2
         AND external_trade_id = $3
       LIMIT 1`,
      [userId, connectionId, externalTradeId]
    );

    return result.rows[0] || null;
  }

  hasTradeChanged(existingTrade, incomingTrade) {
    return (
      String(existingTrade.symbol || '').toUpperCase() !== String(incomingTrade.symbol || '').toUpperCase() ||
      String(existingTrade.side || '') !== String(incomingTrade.side || '') ||
      Number(existingTrade.quantity || 0) !== Number(incomingTrade.quantity || 0) ||
      String(existingTrade.entry_time || '') !== String(incomingTrade.entryTime || '') ||
      String(existingTrade.exit_time || '') !== String(incomingTrade.exitTime || '') ||
      Number(existingTrade.entry_price || 0) !== Number(incomingTrade.entryPrice || 0) ||
      Number(existingTrade.exit_price || 0) !== Number(incomingTrade.exitPrice || 0) ||
      Number(existingTrade.pnl || 0) !== Number(incomingTrade.pnl || 0) ||
      Number(existingTrade.commission || 0) !== Number(incomingTrade.commission || 0) ||
      Number(existingTrade.swap || 0) !== Number(incomingTrade.swap || 0) ||
      Number(existingTrade.stop_loss || 0) !== Number(incomingTrade.stopLoss || 0) ||
      Number(existingTrade.take_profit || 0) !== Number(incomingTrade.takeProfit || 0) ||
      String(existingTrade.account_identifier || '') !== String(incomingTrade.accountIdentifier || '')
    );
  }

  async updateExistingTrade(tradeId, userId, tradeData) {
    await db.query(
      `UPDATE trades
       SET symbol = $3,
           side = $4,
           quantity = $5,
           entry_time = $6,
           exit_time = $7,
           entry_price = $8,
           exit_price = $9,
           trade_date = $10,
           pnl = $11,
           commission = $12,
           swap = $13,
           fees = $14,
           broker = $15,
           instrument_type = $16,
           stop_loss = $17,
           take_profit = $18,
           executions = $19::jsonb,
           account_identifier = $20,
           contract_multiplier = $21,
           external_trade_id = $22,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2`,
      [
        tradeId,
        userId,
        String(tradeData.symbol || '').toUpperCase(),
        tradeData.side,
        tradeData.quantity,
        tradeData.entryTime,
        tradeData.exitTime,
        tradeData.entryPrice,
        tradeData.exitPrice,
        tradeData.tradeDate,
        tradeData.pnl,
        tradeData.commission,
        tradeData.swap,
        tradeData.fees || 0,
        'gft',
        tradeData.instrumentType,
        tradeData.stopLoss,
        tradeData.takeProfit,
        JSON.stringify(tradeData.executionData || []),
        tradeData.accountIdentifier,
        tradeData.contractMultiplier,
        tradeData.externalTradeId
      ]
    );
  }

  mapDirection(value) {
    if (Number(value) === 1) return 'long';
    if (Number(value) === 2) return 'short';
    return '';
  }

  cleanSymbol(symbol) {
    const value = String(symbol || '').trim().toUpperCase();
    if (value.endsWith('.X')) {
      return value.slice(0, -2);
    }
    return value;
  }

  normalizeDateTime(value) {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString();
  }

  inferInstrumentType(symbol) {
    if (!symbol) return 'stock';
    if (/^(XAU|XAG|[A-Z]{6})$/.test(symbol)) return 'forex';
    if (/^(US30|NAS100|SPX|GER40|UK100|DJI|NQ|ES)/.test(symbol)) return 'index';
    return 'stock';
  }

  inferContractMultiplier(symbol) {
    if (!symbol) return 1;
    if (symbol.startsWith('XAU')) return 100;
    if (symbol === 'XAGUSD') return 5000;
    if (/^[A-Z]{6}$/.test(symbol)) return 100000;
    if (/^(US30|NAS100|SPX|GER40|UK100|DJI|NQ|ES)/.test(symbol)) return 1;
    return 1;
  }

  toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  nullableNumber(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}

module.exports = new GFTService();
