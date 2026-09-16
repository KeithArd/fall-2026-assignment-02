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

    // Scanning for duplicates:
    // Map to hold transactions
     const duplicatesMap = new Map<string, Transaction[]>();
     for (const tx of transactions){
      //Create key to hold each transaction date, category, description, and amt
      const key = `${tx.date}_${tx.category}_${tx.description}_${tx.amount}`;
      //holds the group
      const group = duplicatesMap.get(key) || [];
      //holds each transaction
      duplicatesMap.set(key, group);
     }
     // finds groups only w/2 or more transactions, i.e., duplicates
     const duplicateSets: Transaction[][] = Array.from(duplicatesMap.values()).filter((group) => group.length > 1);

    // Scans to find transactions with a flagged status
    const statusFlagged: Transaction[] = transactions.filter((tx) => rules.flaggedStatuses.includes(tx.status));

    // 5. Calculate total flagged value and anomaly rates.
    // total amt of transactions
    const totalTransactions = transactions.length;
    //flatten duplicate sets to single array of transactions
    const duplicateTransactions = duplicateSets.flat();
     //combine anomalies, eliminate duplicates using a set
     const allAnomaliesMap = new Map<string | number, Transaction>();
     [...outliers, ...duplicateTransactions, ...statusFlagged].forEach((tx) => {
      allAnomaliesMap.set(tx.id, tx);
     })

     //total amt of anomalies
     const totalAnomaliesCount = allAnomaliesMap.size;
     //calcs percent of anomalies
     const anomalyPercent = totalTransactions > 0 ? ((totalAnomaliesCount / totalTransactions) * 100).toFixed(2) : '0.00';

    // 6. Format and return a text-based audit report of anomalies, duplicate sets, and totals.
    let textReport = `============\n` +
    ` Report of Anomalies and Duplicates\n` +
    `--------------\n` +
    `Outlier Transactions: ${outliers.length}\n`;
     outliers.forEach((tx) => {
      textReport += `ID: ${tx.id}, Amount: ${tx.amount}, Date: ${tx.date}\n`;
     });
     textReport += `--------------\n` +
    `Duplicate Transactions: ${duplicateTransactions.length} from ${duplicateSets.length} sets`;
     duplicateSets.forEach((set, index) => {
      textReport += `Set #${index +1}:\n`;
      set.forEach((tx) => {
        textReport += `   - ID: ${tx.id}, ${tx.date} | ${tx.amount}\n`;
      })
     })
     textReport += `--------------\n` +
    `Flagged Transactions: `;
    statusFlagged.forEach((tx) => {
      textReport += `    - ID: ${tx.id}, Status: ${tx.status}, Amount: ${tx.amount}\n`;
    });
    textReport += `--------------\n` +
    `Total Anomalous Transactions: ${totalAnomaliesCount}\n` + 
    `Percentage of Anomalous Transactions: ${anomalyPercent}%\n`; 

    return textReport;
  }
}
