import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BudgetLimitStrategy } from '../src/strategies/BudgetLimitStrategy.js';
import { BudgetService } from '../src/services/BudgetService.js';
import { Transaction } from '../src/models.js';

describe('BudgetLimitStrategy (Feature 1)', () => {
  let strategy: BudgetLimitStrategy;

  beforeEach(() => {
    strategy = new BudgetLimitStrategy();
    vi.restoreAllMocks();
  });


  it('should group expenses correctly by category and sum them', async () => {
    const mockBudgets = {Food: 200};
    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const testTransactions: Transaction[] = [
      { id: '1', date: '2026-05-01', amount: -100.00, category: 'Food', description: 'Groceries', status: 'completed' },
      { id: '2', date: '2026-05-02', amount: -150.00, category: 'Food', description: 'Restaurant', status: 'completed' },
      { id: '3', date: '2026-05-03', amount: 50.00, category: 'Food', description: 'Refund', status: 'completed' }, 
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('Category: Food');
    expect(result).toContain('$250.00');
  });

  it('should calculate absolute overage amounts and percentage exceeded', async () => {
    const mockBudgets = {Entertainment: 100};
    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const testTransactions: Transaction[] = [
      { id: '1', date: '2026-05-01', amount: -150.00, category: 'Entertainment', description: 'Concert', status: 'completed'},
    ];
    const result = await strategy.execute(testTransactions);

    expect(result).toContain('Budget Limit:     $100.00');
    expect(result).toContain('Actual Spending:  $150.00');
    expect(result).toContain('Overage Amount:   $50.00 (+50.0%)');
  });

  it('should list the specific transactions contributing to categories that are over budget', async () => {
    const mockBudgets = { Tech: 50 };
    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const testTransactions: Transaction[] = [
      { id: 't1', date: '2026-05-01', amount: -60.00, category: 'Tech', description: 'Software License', status: 'completed' },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('Transactions (1):');
    expect(result).toContain('- [2026-05-01] ID:t1 | Software License:$60.00');
  });

  it('should handle scenarios where no categories are over budget', async () => {
    const mockBudgets = { Travel: 500 };
    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue(mockBudgets);

    const testTransactions: Transaction[] = [
      { id: '1', date: '2026-05-01', amount: -200.00, category: 'Travel', description: 'Flight Deposit', status: 'completed' },
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toBe('=== BUDGET AUDIT REPORT ===\nStatus: PASSED\nNo budget overages detected.');
  });

  it('should handle empty transaction list gracefully', async () => {
    vi.spyOn(BudgetService, 'getCategoryBudgets').mockResolvedValue({ Utilities: 100 });

    const result = await strategy.execute([]);

    expect(result).toContain('Status: PASSED');
    expect(result).toContain('No budget overages detected.');
  });
});
