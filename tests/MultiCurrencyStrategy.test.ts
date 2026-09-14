import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MultiCurrencyStrategy } from '../src/strategies/MultiCurrencyStrategy.js';
import { ExchangeRateService } from '../src/services/ExchangeRateService.js';
import { Transaction } from '../src/models.js';

describe('MultiCurrencyStrategy (Feature 5)', () => {
  let strategy: MultiCurrencyStrategy;

  const mockRates = {
    base: 'USD',
    rates: {
      EUR: 0.90,
      GBP: 0.80,
      JPY: 150,
      CAD: 1.40,
    },
  };

  const testTransactions: Transaction[] = [
    { id: '1', date: '2026-05-01', amount: 100.00, category: 'Income', description: 'Consulting', status: 'completed' },
    { id: '2', date: '2026-05-02', amount: -40.00, category: 'Expense', description: 'Software', status: 'completed' },
    { id: '3', date: '2026-05-01', amount: 100.00, category: 'Salary', description: 'Gig', status: 'completed' },
    { id: '4', date: '2026-05-02', amount: -50.00, category: 'Food', description: 'Grocery', status: 'completed' },
  ];

  beforeEach(() => {
    strategy = new MultiCurrencyStrategy();
    vi.restoreAllMocks();
  });

  it('should parse exchange rates and use customParam target currency', async () => {
    const spy = vi.spyOn(ExchangeRateService, 'getExchangeRates').mockResolvedValue(mockRates);

    const result = await strategy.execute(testTransactions, 'GBP');

    expect(spy).toHaveBeenCalledOnce();
    expect(result).toContain('USD -> GBP');
    expect(result).toContain('Rate: 0.8');
    expect(result).toContain('Total Income (GBP)    : £160.00'); // Clean assertion check
  });

  it('should default to EUR conversion if currency param is missing or invalid', async () => {
    vi.spyOn(ExchangeRateService, 'getExchangeRates').mockResolvedValue(mockRates);

    // Test missing customParam
    const resultMissing = await strategy.execute(testTransactions);
    expect(resultMissing).toContain('USD -> EUR');
    expect(resultMissing).toContain('Rate: 0.9');

    // Test invalid customParam
    const resultInvalid = await strategy.execute(testTransactions, 'XYZ');
    expect(resultInvalid).toContain('USD -> EUR');
    expect(resultInvalid).toContain('Rate: 0.9');
  });

  it('should throw an error if the target currency does not exist in exchange rates', async () => {
    vi.spyOn(ExchangeRateService, 'getExchangeRates').mockResolvedValue({
      base: 'USD',
      rates: {},
    });

    await expect(strategy.execute(testTransactions, 'EUR')).rejects.toThrow(
      "Exchange rate for currency 'EUR' could not be resolved.",
    );
  });

  it('should accurately convert individual transaction amounts to the target currency', async () => {
    vi.spyOn(ExchangeRateService, 'getExchangeRates').mockResolvedValue(mockRates);

    const result = await strategy.execute(testTransactions, 'EUR');

    // Income line check
    expect(result).toContain('USD:      $100.00');
    expect(result).toContain('EUR:       €90.00');

    // Expense line check
    expect(result).toContain('USD:      -$40.00');
    expect(result).toContain('EUR:      -€36.00');
  });

  it('should calculate and display totals (income, expense, net balance) in both USD and target currency', async () => {
    vi.spyOn(ExchangeRateService, 'getExchangeRates').mockResolvedValue(mockRates);

    const result = await strategy.execute(testTransactions, 'EUR');

    // Matches total of all 4 testTransactions ($200 Income, $90 Expense, $110 Net)
    expect(result).toContain('Total Income (USD)    : $200.00');
    expect(result).toContain('Total Expenses (USD)  : $90.00');
    expect(result).toContain('Total Net (USD)       : $110.00');

    expect(result).toContain('Total Income (EUR)    : €180.00');
    expect(result).toContain('Total Expenses (EUR)  : €81.00');
    expect(result).toContain('Total Net (EUR)       : €99.00');
  });
});