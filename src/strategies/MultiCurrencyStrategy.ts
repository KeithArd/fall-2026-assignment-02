import { ExchangeRates, Transaction } from '../models.js';
import { ExchangeRateService } from '../services/ExchangeRateService.js';
import { AuditStrategy } from './AuditStrategy.js';

export interface ConvertedTransaction extends Transaction {
  originalAmount: number;
  convertedAmount: number;
  targetCurrency: string;
}

export interface CurrencyTotals {
  usd: { 
    income: number; 
    expenses: number; 
    net: number };
  target: { 
    currency: string; 
    income: number; 
    expenses: number; 
    net: number };
}

export class MultiCurrencyStrategy implements AuditStrategy {
  public readonly name = 'Multi-Currency Auditor';
  public readonly description =
    'Converts and aggregates transactions in a foreign currency';

  public async execute(
    transactions: Transaction[],
    customParam?: string,
  ): Promise<string> {
    console.log("Requesting exchange rates...");
    const rates = await ExchangeRateService.getExchangeRates();
    console.log("Rates received:", rates);

    let chosenRateKey = "EUR"; // Default currency key

    // 2. Identify the target currency from `customParam` (default to 'EUR' if invalid/not provided).
    if (customParam && customParam in rates.rates) {
      chosenRateKey = customParam;
    }
    else if (customParam) {
      console.warn(`Currency '${customParam}' not found in rates. Defaulting to Eur.`);
    }

    // 3. Look up the exchange rate for the target currency (throw an error if not found in rates).
    const exchangeRate = rates.rates[chosenRateKey];
    if (exchangeRate === undefined) {
      throw new Error(`Exchange rate for currency '${chosenRateKey}' could not be resolved.`);
    }
    
    // 4. Convert all transaction amounts to the target currency.
    const convertedTransactions: ConvertedTransaction[] = transactions.map((tx) => ({
    ...tx,
    originalAmount: tx.amount,
    convertedAmount: tx.amount * exchangeRate,
    targetCurrency: chosenRateKey,
    }));

    // 5. Calculate total income, total expenses, and net balance in BOTH USD and target currency.
    const totals = convertedTransactions.reduce<CurrencyTotals>(
     (acc, tx) => {
      if (tx.amount > 0) {
        acc.usd.income += tx.amount;
        acc.target.income += tx.convertedAmount;
      } else {
        acc.usd.expenses += Math.abs(tx.amount);
        acc.target.expenses += Math.abs(tx.convertedAmount);
      }

      acc.usd.net += tx.amount;
      acc.target.net += tx.convertedAmount;

      return acc;
     },
    {
      usd: { income: 0, expenses: 0, net: 0 },
      target: { currency: chosenRateKey, income: 0, expenses: 0, net: 0 },
    }
    );
    
    // Formatters for clean display
    const usdFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    });

    const targetFormatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: chosenRateKey,
    });

      // 6. Format and return a text-based audit report detailing conversion metrics, conversion rate used, and transaction summaries in both currencies.
      // Format Line Items
    const lineItemsText = convertedTransactions
      .map((t) => {
        const formattedUSD = usdFormatter.format(t.originalAmount).padStart(12);
        const formattedTarget = targetFormatter.format(t.convertedAmount).padStart(12);
        return `- [${t.date}] (${t.id}) ${t.description.padEnd(40)} | USD: ${formattedUSD} | ${t.targetCurrency}: ${formattedTarget}`;
      })
      .join('\n  ');

    // Build Text Report Structure
    return `
    ================================================================================
                              FINANCIAL AUDIT REPORT
    ================================================================================
    Target FX   : USD -> ${chosenRateKey} (Rate: ${exchangeRate})
    --------------------------------------------------------------------------------

    TRANSACTION DETAILS:
    ${lineItemsText}

    --------------------------------------------------------------------------------
    SUMMARY TOTALS:
      Total Items Processed : ${convertedTransactions.length}
      
      Total Income (USD)    : ${usdFormatter.format(totals.usd.income)}
      Total Expenses (USD)  : ${usdFormatter.format(totals.usd.expenses)}
      Total Net (USD)       : ${usdFormatter.format(totals.usd.net)}

      Total Income (${chosenRateKey})    : ${targetFormatter.format(totals.target.income)}
      Total Expenses (${chosenRateKey})  : ${targetFormatter.format(totals.target.expenses)}
      Total Net (${chosenRateKey})       : ${targetFormatter.format(totals.target.net)}
    ================================================================================
    `;
    }

  }
