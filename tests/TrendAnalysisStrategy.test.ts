import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TrendAnalysisStrategy } from '../src/strategies/TrendAnalysisStrategy.js';
import { HistoricalDataService } from '../src/services/HistoricalDataService.js';
import { Transaction } from '../src/models.js';

describe('TrendAnalysisStrategy (Feature 3)', () => {
  let strategy: TrendAnalysisStrategy;

  beforeEach(() => {
    strategy = new TrendAnalysisStrategy();
    vi.restoreAllMocks();
  });

  it('should handle an empty transaction list without crashing', async () => {
    // mock historical data service data for test
    const spy = vi
      .spyOn(HistoricalDataService, 'getHistoricalAverages')
      .mockResolvedValue({
        Food: 200,
        Rent: 1000,
      });

    // call strategy with an empty transaction list
    const result = await strategy.execute([]);

    // strategy should not return undefined
    expect(result).toBeDefined();

    expect(spy).toHaveBeenCalled();
    // should return some type of string object (headers exist but entries are empty)
    expect(typeof result).toBe('string');
  });

  it('should group current expenses by category and compute accurate totals', async () => {
    // mock historical data service data for test
    const spy = vi
      .spyOn(HistoricalDataService, 'getHistoricalAverages')
      .mockResolvedValue({
        Food: 250,
      });

    // mock transaction data (total should be 70 + 10 + 20 = 100)
    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2023-6-04',
        amount: -70,
        category: 'Food',
        description: 'sushi',
        status: 'completed',
      },
      {
        id: '2',
        date: '2024-3-20',
        amount: -10,
        category: 'Food',
        description: 'yogurt',
        status: 'completed',
      },
      {
        id: '3',
        date: '2025-7-01',
        amount: -20,
        category: 'Food',
        description: 'milk',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('Food');
    expect(result).toContain('$100.0');
  });

  it('should calculate variance percentage from historical averages correctly', async () => {
    // mock historical data
    const spy = vi
      .spyOn(HistoricalDataService, 'getHistoricalAverages')
      .mockResolvedValue({
        Shopping: 600,
        Gaming: 200,
      });

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2020-01-10',
        amount: -50,
        category: 'Gaming',
        description: 'used game',
        status: 'completed',
      },
      {
        id: '2',
        date: '2021-03-04',
        amount: -60,
        category: 'Gaming',
        description: 'game cube game',
        status: 'completed',
      },
      {
        id: '3',
        date: '2010-07-23',
        amount: -80,
        category: 'Shopping',
        description: 'Target',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('-45.0%');
    expect(result).toContain('-86.7%');
  });

  it('should highlight categories exceeding positive/negative 20% variance threshold', async () => {
    // mock historical data
    const spy = vi
      .spyOn(HistoricalDataService, 'getHistoricalAverages')
      .mockResolvedValue({
        GrowthMock: 100,
        SavingsMock: 100,
        NonHighlight: 100,
      });

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '1995-08-10',
        amount: -200,
        category: 'GrowthMock',
        description: 'test',
        status: 'completed',
      },
      {
        id: '2',
        date: '2013-02-09',
        amount: -20,
        category: 'SavingsMock',
        description: 'test',
        status: 'completed',
      },
      {
        id: '3',
        date: '2013-02-10',
        amount: -95,
        category: 'NonHighlight',
        description: 'test',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    // get highlights section
    const highlightsSection = result.split('Highlights')[1];
    // get distinct sections
    const sections = highlightsSection.split('Savings:');
    const growthSection = sections[0];
    const savingsSection = sections[1];

    expect(spy).toHaveBeenCalled();

    // check growth section
    expect(growthSection).toContain('GrowthMock');
    expect(growthSection).not.toContain('SavingsMock');
    expect(growthSection).not.toContain('NonHighlight');

    // check savings section
    expect(savingsSection).toContain('SavingsMock');
    expect(savingsSection).not.toContain('GrowthMock');
    expect(savingsSection).not.toContain('NonHighlight');
  });

  it('should handle categories present in current data but missing in historical benchmarks', async () => {
    // mock historical data, only has Rent and Electricity. (missing Gas)
    const spy = vi
      .spyOn(HistoricalDataService, 'getHistoricalAverages')
      .mockResolvedValue({
        Rent: 2400,
        Electricity: 400,
      });

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '1995-08-10',
        amount: -145,
        category: 'Electricity',
        description: 'Power',
        status: 'completed',
      },
      {
        id: '2',
        date: '2013-02-09',
        amount: -80,
        category: 'Gas',
        description: 'Circle K',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('Electricity');
    expect(result).toContain('Gas');
    expect(result).toContain('no data');
    expect(result).not.toContain('NaN');
  });

  it('should format historical vs current comparisons in a readable report', async () => {
    // mock historical data
    const spy = vi
      .spyOn(HistoricalDataService, 'getHistoricalAverages')
      .mockResolvedValue({
        Shopping: 600,
        Gaming: 200,
      });

    const testTransactions: Transaction[] = [
      {
        id: '1',
        date: '2020-01-10',
        amount: -50,
        category: 'Gaming',
        description: 'used game',
        status: 'completed',
      },
      {
        id: '2',
        date: '2021-03-04',
        amount: -60,
        category: 'Gaming',
        description: 'game cube game',
        status: 'completed',
      },
      {
        id: '3',
        date: '2010-07-23',
        amount: -80,
        category: 'Shopping',
        description: 'Target',
        status: 'completed',
      },
    ];

    const result = await strategy.execute(testTransactions);

    expect(spy).toHaveBeenCalled();
    expect(result).toContain('Historical Trend Report');
    expect(result).toContain('category');
    expect(result).toContain('current');
    expect(result).toContain('historical');
    expect(result).toContain('variance');
    expect(result).toContain('Highlights');
    expect(result).toContain('Growth:');
    expect(result).toContain('Savings:');
  });
});
