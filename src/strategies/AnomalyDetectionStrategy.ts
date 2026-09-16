import { AnomalyRules, Transaction } from '../models.js';
import { AnomalyRulesService } from '../services/AnomalyRulesService.js';
import { AuditStrategy } from './AuditStrategy.js';

export class AnomalyDetectionStrategy implements AuditStrategy {
  public readonly name = 'Anomaly & Duplicate Auditor';
  public readonly description =
    'Detects transactions exceeding thresholds and duplicate records';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    
    // Calls AnomalyRulesService.getRules() to get the rules
    const rules = await AnomalyRulesService.getRules();
      
    // Scans to find outliers (transactions greater than the max transaction amount)
    const outliers: Transaction[] = transactions.filter((tx) => tx.amount > rules.maxTransactionAmount);

    // 3. Scan to identify duplicates (transactions sharing the exact same date, category, description, and amount).
     

    // Scans to find transactions with a flagged status
    const statusFlagged: Transaction[] = transactions.filter((tx) => rules.flaggedStatuses.includes(tx.status));

    // 5. Calculate total flagged value and anomaly rates.
    
    // 6. Format and return a text-based audit report of anomalies, duplicate sets, and totals.
    const textReport = '============\n' +
    ' Report of Anomalies and Duplicates\n' +
    '--------------\n' +
    'Outlier Transactions: ' + //add amt outliers
    '--------------\n' +
    'Dplicate Transactions: ' + //add dupes
    '--------------\n' +
    'Flagged Transactions: ' + //add flagged
    '--------------\n' +
    'Total Anomalous Transactions: ' + //add total amt
    'Percentage of Anomalous Transactions: '; //add percents

    return textReport;
    throw new Error('Method not implemented.');
  }
}
