import { Transaction } from '../models.js';
import { TaxConfigService } from '../services/TaxConfigService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class TaxDeductionStrategy implements AuditStrategy {
  public readonly name = 'Tax & Deductions Auditor';
  public readonly description =
    'Identifies eligible tax-deductible expenses and estimates savings';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // TODO: Feature 4 - Implement this strategy.
    // 1. Call TaxConfigService.getTaxConfig() asynchronously.
    const taxConfig = await TaxConfigService.getTaxConfig();
    const { standardTaxRate, deductibleCategories } = taxConfig;

    if (!transactions || transactions.length === 0) {
      return '=== ${this.name.toUpperCase()} REPORT ===\nTax Audit Cancelled: No transaction history provided.';
    }

    let totalDeductions = 0;
    let totalNonDeductibleExpenses = 0;
    const qualifyingTransactions: Transaction[] = [];

    // 2. Filter expenses (amount < 0) that belong to eligible tax-deductible categories.
    for (const tx of transactions) {
      if (tx.amount < 0) {
        const absoluteAmount = Math.abs(tx.amount);

        if (deductibleCategories.includes(tx.category)) {
              // 3. Sum total deductible expenses.

          totalDeductions += absoluteAmount;
          qualifyingTransactions.push(tx);
        } else {
          totalNonDeductibleExpenses += absoluteAmount;
        }
      }
    }
    // 4. Estimate tax savings based on the standard tax rate: total deductible * taxRate.

    const estimatedTaxSavings = totalDeductions * standardTaxRate;

    // 5. Estimate sales tax/VAT paid on NON-deductible expenses using standard tax rate.

    const estimatedSalesTaxPaid = totalNonDeductibleExpenses * standardTaxRate;
    // 6. Format and return a text-based audit report detailing total deductions, savings, VAT estimates, and eligible transactions.

    let itemizedList = '';
    if (qualifyingTransactions.length === 0) {
      itemizedList = 'No qualifying deductible transactions found.\n';
    } else {
      qualifyingTransactions.forEach(tx => {
        itemizedList += `- [${tx.date}] ${tx.category} | ${tx.description}: $${Math.abs(tx.amount).toFixed(2)}\n`;
      });
    }

    const reportText = 
      '==================================================\n' +
      '        TAX & DEDUCTIONS AUDIT REPORT             \n' +
      '==================================================\n' +
      'Strategy: ' + this.name + '\n' +
      'Description: ' + this.description + '\n' +
      '[Active Tax Configuration Rate: ' + (standardTaxRate * 100).toFixed(1) + '%]\n\n' +
      '1. ITEMIZED QUALIFYING DEDUCTIONS:\n' +
      '--------------------------------------------------\n' +
      itemizedList +
      '2. FINANCIAL SUMMARY & ESTIMATES:\n' +
      '--------------------------------------------------\n' +
      '- Total Eligible Deductions Sum : $' + totalDeductions.toFixed(2) + '\n' +
      '- Estimated Income Tax Savings  : $' + estimatedTaxSavings.toFixed(2) + '\n' +
      '- Estimated Sales Tax (VAT) Paid: $' + estimatedSalesTaxPaid.toFixed(2) + '\n' +
      '==================================================';

      return reportText;
      }

    }
    //throw new Error('Method not implemented.');

