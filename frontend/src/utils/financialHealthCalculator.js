/**
 * Calculates financial health metrics and overall score.
 * 
 * @param {number} monthlyIncome - Total income for the current month
 * @param {number} monthlyExpenses - Total expenses for the current month (absolute value)
 * @param {number} creditUsedTotal - Total credit card balance currently used
 * @param {number} creditLimitTotal - Total credit card limit across all accounts
 * 
 * @returns {object} - Financial health object with:
 *  - overallScore: 0-100 (rounded integer)
 *  - spending: { score: 0-100, status: 'Good'|'Watch'|'Danger', ratio: number }
 *  - debt: { score: 0-100, status: 'Low'|'Medium'|'High', ratio: number }
 *  - savings: { score: 0-100, status: 'Good'|'Fair'|'Poor', ratio: number }
 *  - color: '#22c55e'|'#f59e0b'|'#ef4444' (green, amber, red)
 */
export function calculateFinancialHealth(monthlyIncome = 0, monthlyExpenses = 0, creditUsedTotal = 0, creditLimitTotal = 0) {
  const income = Math.max(0, monthlyIncome)
  const expenses = Math.max(0, monthlyExpenses)

  // === SPENDING METRIC ===
  // Ratio = Expenses / Income
  // Status: < 0.6 is "Good", < 0.85 is "Watch", else "Danger"
  // Score: 100 for < 0.6, scaling down to 0 for > 1.0
  let spendingRatio = income > 0 ? expenses / income : 1
  let spendingStatus = 'Danger'
  let spendingScore = 0

  if (spendingRatio < 0.6) {
    spendingStatus = 'Good'
    spendingScore = 100
  } else if (spendingRatio < 0.85) {
    spendingStatus = 'Watch'
    // Linear interpolation from 100 (at 0.6) to 0 (at 0.85)
    spendingScore = Math.max(0, 100 - ((spendingRatio - 0.6) / (0.85 - 0.6)) * 100)
  } else {
    spendingStatus = 'Danger'
    // Linear interpolation from some score (at 0.85) down to 0 (at 1.0)
    spendingScore = Math.max(0, 100 - ((spendingRatio - 0.85) / (1.0 - 0.85)) * 100)
  }

  // === DEBT METRIC ===
  // Ratio = Used Balance / Total Limit
  // Status: < 0.3 is "Low", < 0.6 is "Medium", else "High"
  // Score: 100 for < 0.3, scaling down to 0 for > 0.8
  let debtRatio = creditLimitTotal > 0 ? creditUsedTotal / creditLimitTotal : 0
  let debtStatus = 'High'
  let debtScore = 0

  if (debtRatio < 0.3) {
    debtStatus = 'Low'
    debtScore = 100
  } else if (debtRatio < 0.6) {
    debtStatus = 'Medium'
    // Linear interpolation from 100 (at 0.3) to some score (at 0.6)
    debtScore = Math.max(0, 100 - ((debtRatio - 0.3) / (0.6 - 0.3)) * 100)
  } else {
    debtStatus = 'High'
    // Linear interpolation from some score (at 0.6) down to 0 (at 0.8)
    debtScore = Math.max(0, 100 - ((debtRatio - 0.6) / (0.8 - 0.6)) * 100)
  }

  // === SAVINGS METRIC ===
  // Surplus Ratio = (Income - Expenses) / Income
  // Status: > 0.2 is "Good", > 0.0 is "Fair", else "Poor"
  // Score: 100 for > 0.2, scaling down to 0 for < 0
  let savingsRatio = income > 0 ? (income - expenses) / income : 0
  let savingsStatus = 'Poor'
  let savingsScore = 0

  if (savingsRatio > 0.2) {
    savingsStatus = 'Good'
    savingsScore = 100
  } else if (savingsRatio > 0.0) {
    savingsStatus = 'Fair'
    // Linear interpolation from 100 (at 0.2) to 0 (at 0.0)
    savingsScore = Math.max(0, (savingsRatio / 0.2) * 100)
  } else {
    savingsStatus = 'Poor'
    savingsScore = 0
  }

  // === OVERALL SCORE ===
  // Average of the 3 score contributions (rounded to nearest integer)
  const overallScore = Math.round((spendingScore + debtScore + savingsScore) / 3)

  // === COLOR MAPPING ===
  // >= 80 (Green), 50-79 (Yellow/Orange), < 50 (Red)
  let color = '#ef4444' // red
  if (overallScore >= 80) {
    color = '#22c55e' // green
  } else if (overallScore >= 50) {
    color = '#f59e0b' // amber
  }

  return {
    overallScore,
    spending: {
      score: Math.round(spendingScore),
      status: spendingStatus,
      ratio: spendingRatio,
    },
    debt: {
      score: Math.round(debtScore),
      status: debtStatus,
      ratio: debtRatio,
    },
    savings: {
      score: Math.round(savingsScore),
      status: savingsStatus,
      ratio: savingsRatio,
    },
    color,
  }
}
