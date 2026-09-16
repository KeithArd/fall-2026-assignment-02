import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaxDeductionStrategy } from '../src/strategies/TaxDeductionStrategy.js';
import { TaxConfigService } from '../src/services/TaxConfigService.js';
import { Transaction } from '../src/models.js';

describe('TaxDeductionStrategy (Feature 4)', () => {
  let strategy: TaxDeductionStrategy;

  beforeEach(() => {
    strategy = new TaxDeductionStrategy();
    vi.restoreAllMocks();
  });

  // Example of how to write and mock in your tests:
  //
  // it('should compute tax savings correctly based on rate and deductible categories', async () => {
  //   const mockConfig = { standardTaxRate: 0.10, deductibleCategories: ['Medical', 'Charity'] };
  //   const spy = vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockConfig);
  //
  //   const testTransactions: Transaction[] = [
  //     { id: '1', date: '2026-05-01', amount: -200.00, category: 'Charity', description: 'Donation', status: 'completed' }, // Deductible
  //     { id: '2', date: '2026-05-02', amount: -100.00, category: 'Food', description: 'Grocery', status: 'completed' }, // Non-deductible
  //   ];
  //
  //   const result = await strategy.execute(testTransactions);
  //
  //   expect(spy).toHaveBeenCalled();
  //   expect(result).toContain('Deductions: $200.00'); // Sum of Charity
  //   expect(result).toContain('Savings: $20.00'); // $200 * 0.10
  // });

  it.todo('should filter only the categories specified as deductible in the config', async () => {
    const mockConfig = { standardTaxRate: 0.10, deductibleCategories: ['Charity'] };
    vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockConfig);

    const testTransactions: Transaction[] = [
      { id: '1', date: '2026-05-01', amount: -100.00, category: 'Charity', description: 'Donation', status: 'completed' },
      { id: '2', date: '2026-05-02', amount: -50.00, category: 'Food', description: 'Grocery', status: 'completed' }
    ];

    const result = await strategy.execute(testTransactions);
    
    expect(result).toContain('Charity | Donation');
    expect(result).not.toContain('Food | Grocery');
  });



  it.todo('should sum total eligible tax deductions correctly', async () => {
    const mockConfig = { standardTaxRate: 0.10, deductibleCategories: ['Medical', 'Charity'] };
    vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockConfig);

    const testTransactions: Transaction[] = [
      { id: '1', date: '2026-05-01', amount: -200.00, category: 'Charity', description: 'Donation', status: 'completed' },
      { id: '2', date: '2026-05-02', amount: -150.00, category: 'Medical', description: 'Doctor', status: 'completed' }
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('- Total Eligible Deductions Sum : $350.00');
  });



  it.todo('should calculate estimated tax savings using standardTaxRate', async () => {
    const mockConfig = { standardTaxRate: 0.15, deductibleCategories: ['Charity'] };
    vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockConfig);

    const testTransactions: Transaction[] = [
      { id: '1', date: '2026-05-01', amount: -200.00, category: 'Charity', description: 'Donation', status: 'completed' }
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('- Estimated Income Tax Savings  : $30.00');
  });



  it.todo('should calculate estimated VAT/sales tax paid on non-deductible expense transactions', async () => {
    const mockConfig = { standardTaxRate: 0.10, deductibleCategories: ['Charity'] };
    vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockConfig);

    const testTransactions: Transaction[] = [
      { id: '1', date: '2026-05-01', amount: -100.00, category: 'Charity', description: 'Donation', status: 'completed' },
      { id: '2', date: '2026-05-02', amount: -300.00, category: 'Entertainment', description: 'Concert', status: 'completed' }
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('- Estimated Sales Tax (VAT) Paid: $30.00');
  });



  it.todo('should structure report to show both aggregates and itemized deductible transactions', async () => {
    const mockConfig = { standardTaxRate: 0.10, deductibleCategories: ['Charity'] };
    vi.spyOn(TaxConfigService, 'getTaxConfig').mockResolvedValue(mockConfig);

    const testTransactions: Transaction[] = [
      { id: '1', date: '2026-05-01', amount: -100.00, category: 'Charity', description: 'Donation', status: 'completed' }
    ];

    const result = await strategy.execute(testTransactions);

    expect(result).toContain('1. ITEMIZED QUALIFYING DEDUCTIONS:');
    expect(result).toContain('2. FINANCIAL SUMMARY & ESTIMATES:');
    expect(result).toContain('- [2026-05-01] Charity | Donation: $100.00');
  });  

});