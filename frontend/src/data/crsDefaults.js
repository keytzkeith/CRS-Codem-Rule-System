export const crsDefaultSettings = {
  currency: 'USD',
  timezone: 'Africa/Nairobi',
  riskMode: 'amount',
  riskPerTrade: 125,
  preferredPeriod: 'monthly',
  reviewCadence: 'weekend',
  activeAccountId: null,
  accounts: [],
  customSetupTypes: [
    'OB retest',
    'Continuation',
    'Liquidity sweep',
    'BOS entry',
    'Reversal'
  ],
  checklistItems: [
    { id: 'htfBosConfirmed', label: 'HTF BOS confirmed' },
    { id: 'pullbackToOb', label: 'Pullback to OB' },
    { id: 'm15Confirmation', label: 'M15 confirmation' },
    { id: 'tradedWithBias', label: 'Traded with bias' },
    { id: 'validSession', label: 'Valid session' },
    { id: 'minimumRRMet', label: 'Minimum RR met' }
  ],
  customTags: [
    'continuation',
    'reversal',
    'liquidity sweep',
    'BOS entry',
    'OB retest',
    'London',
    'New York',
    'A+ setup',
    'FOMO',
    'counter-trend'
  ]
}
