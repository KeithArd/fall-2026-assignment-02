import { Transaction } from '../models.js';
import { HistoricalDataService } from '../services/HistoricalDataService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class TrendAnalysisStrategy implements AuditStrategy {
  public readonly name = 'Historical Trend Auditor';
  public readonly description =
    'Compares current monthly category spending against historical averages';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    // get historical averages from HistoricalDataService
    const historicalAverages =
      await HistoricalDataService.getHistoricalAverages();

    // group current expenses (amount < 0) by category and compute category totals.

    // object to hold current expense totals per category
    const currentExpenses: Record<string, number> = {};

    // loop through transactions and add them to currentExpenses by category
    for (const transaction of transactions) {
      // check if transaction amount is an expense (less than zero)
      if (transaction.amount < 0) {
        const category = transaction.category;
        const amount = transaction.amount * -1; // flip sign to get absolute value

        // add transaction amount to category total
        currentExpenses[category] = (currentExpenses[category] || 0) + amount;
      }
    }

    // type to hold comparisons for string building
    type Comparison = {
      category: string;
      current: number;
      historical: number | undefined;
      variance: number | undefined;
    };

    // for each category, compare current total spending against the historical average.
    // calculate the rate of change / variance percentage: ((current - historical) / historical) * 100.

    // array to hold comparisons
    const comparisons: Comparison[] = [];

    // loop through categories in currentExpense
    // and compute each categories variance against historical average
    for (const category in currentExpenses) {
      const current = currentExpenses[category]; // get current expense of this category
      const historical = historicalAverages[category]; // get historic expense of this category (might be undefined)

      // compute the rate of change / variance percentage (undefined if historical data is missing)
      const variance: number | undefined =
        historical !== undefined
          ? ((current - historical) / historical) * 100
          : undefined;

      // push comparison to comparisons array
      comparisons.push({
        category: category,
        current: current,
        historical: historical,
        variance: variance,
      });
    }

    // highlight any category with a variance exceeding +/- 20%.

    // arrays to hold highlight Comparisons (categories of significant growth or significant savings)
    const growthHighlights: Comparison[] = [];
    const savingsHighlights: Comparison[] = [];

    // find highlights and push them to respective highlight array
    for (const comparison of comparisons) {
      if (comparison.variance === undefined) continue; // continue if historical data is not available

      if (comparison.variance > 20) {
        growthHighlights.push(comparison);
      } else if (comparison.variance < -20) {
        savingsHighlights.push(comparison);
      }
    }

    // format and return a text-based audit report detailing comparison metrics.

    // headers
    const highlightsHeader: string = '\n\n                  === Highlights ===';
    const growthHeader: string =
      '\nGrowth:' +
      '\ncategory                                      variance' +
      '\n------------------------------------------------------\n';
    const savingsHeader: string =
      '\n\nSavings:' +
      '\ncategory                                      variance' +
      '\n------------------------------------------------------\n';

    const trendReportHeader: string =
      '\n           === Historical Trend Report ===' +
      '\ncategory            current     historical    variance' +
      '\n------------------------------------------------------\n';

    // build trend report
    const trendReport: string[] = [];
    for (const comparison of comparisons) {
      const category = comparison.category,
        current = comparison.current.toFixed(1),
        historical =
          comparison.historical !== undefined
            ? comparison.historical.toFixed(1)
            : 'no data',
        variance =
          comparison.variance !== undefined
            ? comparison.variance.toFixed(1)
            : 'no data';
      trendReport.push(
        [
          category.padEnd(14),
          ('$' + current).padStart(8),
          ('$' + historical).padStart(8),
          (variance + '%').padStart(8),
        ].join('  |  '),
      );
    }

    const trendReportTable = trendReport.join('\n');

    // build highlight strings
    const growthHighlightsStringArray: string[] = [];
    const savingsHighlightsStringArray: string[] = [];

    for (const highlight of growthHighlights) {
      const category = highlight.category;
      const variance =
        highlight.variance !== undefined
          ? highlight.variance.toFixed(1)
          : 'no data';
      growthHighlightsStringArray.push(
        [category.padEnd(24), (variance + '%').padStart(24)].join('  |  '),
      );
    }

    const growthHighlightsTable: string =
      growthHighlightsStringArray.join('\n');

    for (const highlight of savingsHighlights) {
      const category = highlight.category;
      const variance =
        highlight.variance !== undefined
          ? highlight.variance.toFixed(1)
          : 'no data';

      savingsHighlightsStringArray.push(
        [category.padEnd(24), (variance + '%').padStart(24)].join('  |  '),
      );
    }
    const savingsHighlightsTable: string =
      savingsHighlightsStringArray.join('\n');

    const output =
      trendReportHeader +
      trendReportTable +
      highlightsHeader +
      growthHeader +
      growthHighlightsTable +
      savingsHeader +
      savingsHighlightsTable;

    return output;
  }
}
