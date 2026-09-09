import { aC } from 'vitest/dist/reporters-w_64AS5f.js';
import { Transaction } from '../models.js';
import { BudgetService } from '../services/BudgetService.js';
import { AuditStrategy } from './AuditStrategy.js';

interface CategorySummary {
  totalSpent: number,
  transactions: Transaction[]
}

export class BudgetLimitStrategy implements AuditStrategy {
  public readonly name = 'Budget Limit Auditor';
  public readonly description =
    'Checks category spending against monthly budget limits';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // TODO: Feature 1 - Implement this strategy.
    // 1. Call BudgetService.getCategoryBudgets() asynchronously.
    // 2. Group expenses (amounts < 0) by category and compute total spending for each category.
    // 3. Compare spending against the fetched limits.
    // 4. Identify overages (categories where spending exceeds the budget).
    // 5. Format and return a text-based audit report outlining limits, actuals, overage amounts, percentages, and lists of transactions causing the overage.

     const budget = await BudgetService.getCategoryBudgets()
     const spendingByCategory = transactions
      .filter(transaction => transaction.amount < 0)
      .reduce<Record<string, CategorySummary>>((accumulator, transaction) => {
        const {category, amount}= transaction;
        const expense = Math.abs(amount);

        if (!accumulator[category]) {
          accumulator[category] = {totalSpent: 0, transactions: []}
        }
        accumulator[category].totalSpent += expense
        accumulator[category].transactions.push(transaction)

        return accumulator
      }, {})
    const overages = Object.entries(spendingByCategory)
      .map(([category, summary]) => {
        const limit = budget[category] ?? 0;

        const overageAmount = summary.totalSpent - limit;
        const overagePercentage = limit > 0 ? (overageAmount / limit) * 100 : 100;

        return {
          category,
          limit, 
          actualSpending: summary.totalSpent,
          overageAmount,
          overagePercentage,
          transactions: summary.transactions,
          isOverage: summary.totalSpent > limit,
        };
      })
      .filter((report) => report.isOverage);
    if (overages.length === 0) {
  return "=== BUDGET AUDIT REPORT ===\nStatus: PASSED\nNo budget overages detected.";
}

// Build text blocks for each category causing an overage
const categoryReports = overages.map((item) => {
  // Format individual transactions causing the overage
  const transactionList = item.transactions
    .map(
      (t) =>
        `   - [${t.date}] ID:${t.id} | ${t.description}:$${Math.abs(t.amount).toFixed(2)}`
    )
    .join('\n');

  return `
Category: ${item.category}
----------------------------------------
Budget Limit:     $${item.limit.toFixed(2)} Actual Spending:  $${item.actualSpending.toFixed(2)} Overage Amount:   $${item.overageAmount.toFixed(2)} (+${item.overagePercentage.toFixed(1)}%)

Transactions (${item.transactions.length}):${transactionList}
`;
});

// Combine header and category reports into a single string
return `=== BUDGET AUDIT REPORT ===\nStatus: OVERAGES DETECTED (${overages.length} Categories)\n${categoryReports.join('\n')}`;
  }
}
