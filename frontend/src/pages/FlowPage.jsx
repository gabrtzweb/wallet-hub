import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, BadgeDollarSign, ChartNoAxesCombined, ChevronDown, ChevronLeft, ChevronRight, Clock3, HeartPulse, Search, Sparkles } from 'lucide-react'
import { getFriendlyAccountLabel } from '../config/dashboardConfig'
import { getBankLogoFallbackUrl, getBankLogoUrl } from '../utils/logoResolver'
import { calculateFinancialHealth } from '../utils/financialHealthCalculator'

function FlowPage({
  glassCardClass,
  cardSubtleDividerClass,
  isLightMode,
  language,
  primaryTextClass,
  secondaryTextClass,
  flowMonthLabel,
  monthlyIncome,
  monthlyExpenses,
  canGoToPreviousFlowMonth,
  canGoToNextFlowMonth,
  goToPreviousFlowMonth,
  goToNextFlowMonth,
  formatMoney,
  text,
  flowGroupedTransactions,
  getNormalizedAmount,
  accountMetadataById,
  bankBalanceTotal,
  categoryChartColors,
  creditUsedTotal,
  creditLimitTotal,
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  const [selectedAccountId, setSelectedAccountId] = useState('all')
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)

  const accountFilterOptions = useMemo(() => {
    const accountIdsInFlow = new Set(
      flowGroupedTransactions
        .flatMap((group) => group.entries)
        .map((transaction) => String(transaction?.accountId || transaction?.account?.id || ''))
        .filter(Boolean),
    )

    return Array.from(accountMetadataById.entries())
      .filter(([accountId]) => accountIdsInFlow.has(String(accountId)))
      .map(([accountId, account]) => ({
        id: String(accountId),
        label: getFriendlyAccountLabel(account, language, text.accountUnit),
      }))
      .sort((first, second) => first.label.localeCompare(second.label))
  }, [accountMetadataById, flowGroupedTransactions, language, text.accountUnit])

  const effectiveSelectedAccountId = useMemo(() => {
    if (selectedAccountId === 'all') return 'all'
    return accountFilterOptions.some((option) => option.id === selectedAccountId) ? selectedAccountId : 'all'
  }, [accountFilterOptions, selectedAccountId])

  const selectedAccountLabel = useMemo(() => {
    if (effectiveSelectedAccountId === 'all') return text.allAccounts
    const selected = accountFilterOptions.find((option) => option.id === effectiveSelectedAccountId)
    return selected?.label || text.allAccounts
  }, [accountFilterOptions, effectiveSelectedAccountId, text.allAccounts])

  const filteredGroupedTransactions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return flowGroupedTransactions
      .map((group) => {
        const filteredEntries = group.entries.filter((transaction) => {
          const normalizedAmount = getNormalizedAmount(transaction)
          const isIncome = normalizedAmount > 0
          const accountId = String(transaction?.accountId || transaction?.account?.id || '')

          if (effectiveSelectedAccountId !== 'all' && accountId !== effectiveSelectedAccountId) return false

          if (activeFilter === 'income' && !isIncome) return false
          if (activeFilter === 'expense' && isIncome) return false

          if (!normalizedQuery) return true

          const accountMeta = accountMetadataById.get(transaction?.accountId || transaction?.account?.id || null)
          const accountName = getFriendlyAccountLabel(accountMeta || transaction?.account, language, text.accountUnit)
          const description = transaction?.description || text.uncategorized
          const categoryName = transaction?.category || text.uncategorized

          const searchableText = `${description} ${accountName} ${categoryName}`.toLowerCase()
          return searchableText.includes(normalizedQuery)
        })

        return {
          ...group,
          entries: filteredEntries,
        }
      })
      .filter((group) => group.entries.length > 0)
  }, [activeFilter, accountMetadataById, effectiveSelectedAccountId, flowGroupedTransactions, getNormalizedAmount, language, searchQuery, text.accountUnit, text.uncategorized])

  const filterButtonClass = (filterType) => {
    const isActive = activeFilter === filterType
    if (isActive) {
      return 'rounded px-3 py-1.5 text-[12px] font-medium bg-[rgba(31,103,255,0.75)] text-white'
    }

    return `rounded px-3 py-1.5 text-[12px] font-medium ${secondaryTextClass}`
  }

  const totalTransactionCount = useMemo(() => {
    return filteredGroupedTransactions.reduce((sum, group) => sum + group.entries.length, 0)
  }, [filteredGroupedTransactions])

  const filteredTransactionNet = useMemo(() => {
    return filteredGroupedTransactions.reduce((sum, group) => {
      return sum + group.entries.reduce((groupSum, transaction) => {
        const normalizedAmount = getNormalizedAmount(transaction)
        return groupSum + normalizedAmount
      }, 0)
    }, 0)
  }, [filteredGroupedTransactions, getNormalizedAmount])

  const monthBankTransactionNet = useMemo(() => {
    return flowGroupedTransactions.reduce((sum, group) => {
      return sum + group.entries.reduce((groupSum, transaction) => {
        const accountId = transaction?.accountId || transaction?.account?.id || null
        const accountMeta = accountMetadataById.get(accountId)
        const accountType = accountMeta?.type || transaction?.account?.type || 'BANK'

        if (accountType !== 'BANK') return groupSum

        return groupSum + getNormalizedAmount(transaction)
      }, 0)
    }, 0)
  }, [accountMetadataById, flowGroupedTransactions, getNormalizedAmount])

  const openingBalance = useMemo(() => {
    const computedOpeningBalance = (Number(bankBalanceTotal) || 0) - monthBankTransactionNet
    return Number(computedOpeningBalance.toFixed(2))
  }, [bankBalanceTotal, monthBankTransactionNet])

  const filteredBalanceLabel = useMemo(() => {
    if (activeFilter === 'income') return text.balanceIncomeLabel || text.balanceLabel
    if (activeFilter === 'expense') return text.balanceExpenseLabel || text.balanceLabel
    return text.balanceDifferenceLabel || text.balanceLabel
  }, [activeFilter, text.balanceDifferenceLabel, text.balanceExpenseLabel, text.balanceIncomeLabel, text.balanceLabel])

  const allMonthEntries = useMemo(
    () => flowGroupedTransactions.flatMap((group) => group.entries),
    [flowGroupedTransactions],
  )

  const expensesByCategory = useMemo(() => {
    const totals = new Map()

    allMonthEntries.forEach((transaction) => {
      const normalizedAmount = getNormalizedAmount(transaction)
      if (normalizedAmount >= 0) return

      const category = String(transaction?.category || text.uncategorized)
      totals.set(category, (totals.get(category) || 0) + Math.abs(normalizedAmount))
    })

    return Array.from(totals.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [allMonthEntries, getNormalizedAmount, text.uncategorized])

  const incomeByCategory = useMemo(() => {
    const totals = new Map()

    allMonthEntries.forEach((transaction) => {
      const normalizedAmount = getNormalizedAmount(transaction)
      if (normalizedAmount <= 0) return

      const category = String(transaction?.category || text.uncategorized)
      totals.set(category, (totals.get(category) || 0) + normalizedAmount)
    })

    return Array.from(totals.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [allMonthEntries, getNormalizedAmount, text.uncategorized])

  const pendingExpensesByCategory = useMemo(() => {
    const totals = new Map()

    allMonthEntries.forEach((transaction) => {
      const normalizedAmount = getNormalizedAmount(transaction)
      if (normalizedAmount >= 0) return

      const accountId = transaction?.accountId || transaction?.account?.id || null
      const accountMeta = accountMetadataById.get(accountId)
      const accountType = accountMeta?.type || transaction?.account?.type || 'BANK'
      if (accountType !== 'CREDIT') return

      const category = String(transaction?.category || text.uncategorized)
      totals.set(category, (totals.get(category) || 0) + Math.abs(normalizedAmount))
    })

    return Array.from(totals.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [accountMetadataById, allMonthEntries, getNormalizedAmount, text.uncategorized])

  const totalMonthExpenses = useMemo(
    () => expensesByCategory.reduce((sum, item) => sum + item.amount, 0),
    [expensesByCategory],
  )

  const totalMonthIncome = useMemo(
    () => incomeByCategory.reduce((sum, item) => sum + item.amount, 0),
    [incomeByCategory],
  )

  const totalPendingExpenses = useMemo(
    () => pendingExpensesByCategory.reduce((sum, item) => sum + item.amount, 0),
    [pendingExpensesByCategory],
  )

  const topExpenseCategories = useMemo(
    () => expensesByCategory.slice(0, 6),
    [expensesByCategory],
  )

  const topIncomeCategories = useMemo(
    () => incomeByCategory.slice(0, 6),
    [incomeByCategory],
  )

  const topPendingCategories = useMemo(
    () => pendingExpensesByCategory.slice(0, 6),
    [pendingExpensesByCategory],
  )

  const maxExpenseCategoryValue = topExpenseCategories[0]?.amount || 1
  const maxIncomeCategoryValue = topIncomeCategories[0]?.amount || 1
  const maxPendingCategoryValue = topPendingCategories[0]?.amount || 1

  const financialHealth = useMemo(
    () => calculateFinancialHealth(monthlyIncome, monthlyExpenses, creditUsedTotal || 0, creditLimitTotal || 0),
    [monthlyIncome, monthlyExpenses, creditUsedTotal, creditLimitTotal],
  )

  const projectedBankTotal = useMemo(
    () => Number(bankBalanceTotal) || 0,
    [bankBalanceTotal],
  )

  const projectedCreditTotal = useMemo(
    () => Number(creditUsedTotal) || 0,
    [creditUsedTotal],
  )

  const projectedBalance = useMemo(
    () => projectedBankTotal - projectedCreditTotal,
    [projectedBankTotal, projectedCreditTotal],
  )

  const isPastFlowMonth = canGoToNextFlowMonth

  const nextFlowMonthName = useMemo(() => {
    const now = new Date()
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const formattedMonth = new Intl.DateTimeFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
      month: 'long',
    }).format(nextMonth)

    return formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1)
  }, [language])

  const projectedNextMonthLabel = useMemo(() => {
    const template = text.flowProjectedBalanceNextMonthLabel || 'For next month ({month})'
    return template.replace('{month}', nextFlowMonthName)
  }, [nextFlowMonthName, text.flowProjectedBalanceNextMonthLabel])

  const getMetricColor = (status) => {
    switch (status) {
      case 'Good':
      case 'Low':
        return '#22c55e'
      case 'Fair':
      case 'Watch':
      case 'Medium':
        return '#f59e0b'
      case 'Poor':
      case 'Danger':
      case 'High':
        return 'rgb(248 113 113 / var(--tw-text-opacity, 1))'
      default:
        return '#999'
    }
  }

  // Map status to localized label
  const getMetricLabel = (status) => {
    switch (status) {
      case 'Good': return text.fhStatusGood
      case 'Fair': return text.fhStatusFair
      case 'Poor': return text.fhStatusPoor
      case 'Low': return text.fhStatusLow
      case 'Medium': return text.fhStatusMedium
      case 'High': return text.fhStatusHigh
      case 'Watch': return text.fhStatusWatch
      case 'Danger': return text.fhStatusDanger
      default: return status
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className={`${glassCardClass} p-4`}>
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="h-[18px] w-[18px] text-[#1f67ff]" />
            <p className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.flowIncomeTitle}</p>
          </div>
          <p className={`mt-2 text-[24px] font-bold text-[#22c55e]`}>{formatMoney(totalMonthIncome)}</p>
          <p className={`mt-1 text-[12px] ${secondaryTextClass}`}>{text.flowIncomeSubtitle}</p>
          <div className="mt-4 space-y-2">
            {topIncomeCategories.length === 0 ? (
              <p className={`text-sm ${secondaryTextClass}`}>{text.flowNoIncome}</p>
            ) : (
              topIncomeCategories.map((item, index) => (
                <div key={item.category}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className={`truncate text-[12px] ${primaryTextClass}`}>{item.category}</p>
                    <p className={`shrink-0 text-[12px] font-semibold ${primaryTextClass}`}>{formatMoney(item.amount)}</p>
                  </div>
                  <div className={`h-1.5 rounded-full ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.max((item.amount / maxIncomeCategoryValue) * 100, 8)}%`,
                        backgroundColor: categoryChartColors && categoryChartColors.length > 0 ? categoryChartColors[index % categoryChartColors.length] : '#f43f5e',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className={`${glassCardClass} p-4`}>
          <div className="flex items-center gap-2">
            <BadgeDollarSign className="h-[18px] w-[18px] text-[#1f67ff]" />
            <p className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.flowExpensesTitle}</p>
          </div>
          <p className="mt-2 text-[24px] font-bold text-red-400">{formatMoney(totalMonthExpenses)}</p>
          <p className={`mt-1 text-[12px] ${secondaryTextClass}`}>{text.flowExpensesSubtitle}</p>
          <div className="mt-4 space-y-2">
            {topExpenseCategories.length === 0 ? (
              <p className={`text-sm ${secondaryTextClass}`}>{text.flowNoExpenses}</p>
            ) : (
              topExpenseCategories.map((item, index) => (
                <div key={item.category}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className={`truncate text-[12px] ${primaryTextClass}`}>{item.category}</p>
                    <p className={`shrink-0 text-[12px] font-semibold ${primaryTextClass}`}>{formatMoney(item.amount)}</p>
                  </div>
                  <div className={`h-1.5 rounded-full ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.max((item.amount / maxExpenseCategoryValue) * 100, 8)}%`,
                        backgroundColor: categoryChartColors && categoryChartColors.length > 0 ? categoryChartColors[index % categoryChartColors.length] : '#e9d5ff',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className={`${glassCardClass} p-4`}>
          <div className="flex items-center gap-2">
            <Clock3 className="h-[18px] w-[18px] text-[#1f67ff]" />
            <p className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.flowPendingTitle}</p>
          </div>
          <p className={`mt-2 text-[24px] font-bold text-[#fde047]`}>{formatMoney(totalPendingExpenses)}</p>
          <p className={`mt-1 text-[12px] ${secondaryTextClass}`}>{text.flowPendingSubtitle}</p>
          <div className="mt-4 space-y-2">
            {topPendingCategories.length === 0 ? (
              <p className={`text-sm ${secondaryTextClass}`}>{text.flowNoPending}</p>
            ) : (
              topPendingCategories.map((item, index) => (
                <div key={item.category}>
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className={`truncate text-[12px] ${primaryTextClass}`}>{item.category}</p>
                    <p className={`shrink-0 text-[12px] font-semibold ${primaryTextClass}`}>{formatMoney(item.amount)}</p>
                  </div>
                  <div className={`h-1.5 rounded-full ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
                    <div
                      className="h-1.5 rounded-full"
                      style={{
                        width: `${Math.max((item.amount / maxPendingCategoryValue) * 100, 8)}%`,
                        backgroundColor: categoryChartColors && categoryChartColors.length > 0 ? categoryChartColors[index % categoryChartColors.length] : '#e9d5ff',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className={`${glassCardClass} p-4`}>
          <div className="flex items-center gap-2">
            <ChartNoAxesCombined className="h-[18px] w-[18px] text-[#1f67ff]" />
            <p className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.flowProjectedBalanceTitle}</p>
          </div>
          <div className="mt-2 flex items-start justify-between gap-4">
            <div className="min-w-0">
              {isPastFlowMonth ? (
                <>
                  <p className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold ${isLightMode ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-800 text-zinc-300'}`}>
                    {text.flowProjectedBalancePastMonthBadge || 'Month closed'}
                  </p>
                  <p className={`mt-2 text-[12px] ${secondaryTextClass}`}>
                    {text.flowProjectedBalancePastMonthSubtitle || 'This month has already passed. Projected value hidden.'}
                  </p>
                </>
              ) : (
                <>
                  <p className={`text-[24px] font-bold ${projectedBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {projectedBalance < 0 ? '-' : ''}{formatMoney(Math.abs(projectedBalance))}
                  </p>
                  <p className={`mt-1 text-[12px] ${secondaryTextClass}`}>{text.flowProjectedBalanceSubtitle}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#1f67ff]">{projectedNextMonthLabel}</p>
                </>
              )}
            </div>

            {isPastFlowMonth ? (
              <div className={`w-full max-w-[210px] rounded-lg border px-3 py-2 ${isLightMode ? 'border-zinc-300 bg-white/50' : 'border-zinc-700 bg-zinc-900/40'}`}>
                <p className={`text-center text-[12px] ${secondaryTextClass}`}>
                  {text.flowProjectedBalancePastMonthNotice || 'Select the current month to see projected values.'}
                </p>
              </div>
            ) : (
              <div className={`w-full max-w-[210px] rounded-lg border px-3 py-2 ${isLightMode ? 'border-zinc-300 bg-white/50' : 'border-zinc-700 bg-zinc-900/40'}`}>
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-[12px] ${secondaryTextClass}`}>{text.flowProjectedBalanceInBankLabel}</p>
                  <p className="text-[12px] font-semibold text-emerald-400">{formatMoney(projectedBankTotal)}</p>
                </div>
                <div className={`my-2 border-t ${isLightMode ? 'border-zinc-300' : 'border-zinc-700'}`} />
                <div className="flex items-center justify-between gap-3">
                  <p className={`text-[12px] ${secondaryTextClass}`}>{text.flowProjectedBalanceBillsLabel}</p>
                  <p className="text-[12px] font-semibold text-red-400">{formatMoney(projectedCreditTotal)}</p>
                </div>
              </div>
            )}
          </div>
        </article>

        <article className={`${glassCardClass} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <HeartPulse className="h-[18px] w-[18px] text-[#1f67ff]" />
                <p className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.flowFinancialHealthTitle}</p>
              </div>
              <p className={`mt-2 text-sm ${secondaryTextClass}`}>{text.flowFinancialHealthSubtitle}</p>
            </div>
            <div className={`relative h-16 w-16 rounded-full ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(${financialHealth.color} 0deg ${(financialHealth.overallScore / 100) * 360}deg, ${isLightMode ? '#f0f0f0' : '#2a2a2a'} ${(financialHealth.overallScore / 100) * 360}deg 360deg)`,
                }}
              />
              <div className={`absolute inset-[8px] rounded-full ${isLightMode ? 'bg-[#e9f0ff]' : 'bg-[#080A0F]'}`} />
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold" style={{ color: financialHealth.color }}>{financialHealth.overallScore}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className={`rounded-lg px-2 py-2 ${isLightMode ? 'bg-zinc-100' : 'bg-zinc-900/50'}`}>
              <p className={`text-[11px] ${secondaryTextClass}`}>{text.flowFinancialHealthSavings}</p>
              <p className="text-sm font-semibold" style={{ color: getMetricColor(financialHealth.savings.status) }}>{getMetricLabel(financialHealth.savings.status)}</p>
            </div>
            <div className={`rounded-lg px-2 py-2 ${isLightMode ? 'bg-zinc-100' : 'bg-zinc-900/50'}`}>
              <p className={`text-[11px] ${secondaryTextClass}`}>{text.flowFinancialHealthDebt}</p>
              <p className="text-sm font-semibold" style={{ color: getMetricColor(financialHealth.debt.status) }}>{getMetricLabel(financialHealth.debt.status)}</p>
            </div>
            <div className={`rounded-lg px-2 py-2 ${isLightMode ? 'bg-zinc-100' : 'bg-zinc-900/50'}`}>
              <p className={`text-[11px] ${secondaryTextClass}`}>{text.flowFinancialHealthSpending}</p>
              <p className="text-sm font-semibold" style={{ color: getMetricColor(financialHealth.spending.status) }}>{getMetricLabel(financialHealth.spending.status)}</p>
            </div>
          </div>
        </article>
      </div>

      <section className={`${glassCardClass} overflow-hidden`}>
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-5 ${cardSubtleDividerClass}`}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goToPreviousFlowMonth}
            disabled={!canGoToPreviousFlowMonth}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${isLightMode ? 'bg-white text-zinc-600' : 'bg-zinc-900/70 text-zinc-400'} ${!canGoToPreviousFlowMonth ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className={`text-base font-semibold ${primaryTextClass}`}>{flowMonthLabel}</p>
          <button
            type="button"
            onClick={goToNextFlowMonth}
            disabled={!canGoToNextFlowMonth}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${isLightMode ? 'bg-white text-zinc-600' : 'bg-zinc-900/70 text-zinc-400'} ${!canGoToNextFlowMonth ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold tabular-nums">
          <span className="text-[#22c55e]">↘ {formatMoney(monthlyIncome)}</span>
          <span className="text-[#f87171]">↗ {formatMoney(monthlyExpenses)}</span>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-2 border-b p-3 md:grid-cols-[1fr_330px_auto] md:px-5 ${cardSubtleDividerClass}`}>
        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-[12px] ${isLightMode ? 'border-zinc-300 bg-white text-zinc-600' : 'border-zinc-700 bg-zinc-900/40 text-zinc-500'}`}>
          <Search className="h-4 w-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={text.searchTransactionPlaceholder}
            className={`w-full bg-transparent text-[12px] outline-none ${isLightMode ? 'text-zinc-700 placeholder:text-zinc-500' : 'text-zinc-200 placeholder:text-zinc-500'}`}
          />
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAccountMenuOpen((current) => !current)}
            className={`inline-flex w-full items-center justify-between rounded-md border px-3 py-2 text-[12px] ${isLightMode ? 'border-zinc-300 bg-white text-zinc-700' : 'border-zinc-700 bg-zinc-900/40 text-zinc-200'}`}
          >
            <span className="truncate pr-3">{selectedAccountLabel}</span>
            <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isAccountMenuOpen && (
            <div className={`absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border py-1 shadow-lg ${isLightMode ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-zinc-900'}`}>
              <button
                type="button"
                onClick={() => {
                  setSelectedAccountId('all')
                  setIsAccountMenuOpen(false)
                }}
                className={`block w-full px-3 py-2 text-left text-[12px] ${effectiveSelectedAccountId === 'all'
                  ? (isLightMode ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-700 text-zinc-100')
                  : (isLightMode ? 'text-zinc-700 hover:bg-zinc-100' : 'text-zinc-200 hover:bg-zinc-800')}`}
              >
                {text.allAccounts}
              </button>

              {accountFilterOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedAccountId(option.id)
                    setIsAccountMenuOpen(false)
                  }}
                  className={`block w-full px-3 py-2 text-left text-[12px] ${effectiveSelectedAccountId === option.id
                    ? (isLightMode ? 'bg-zinc-200 text-zinc-900' : 'bg-zinc-700 text-zinc-100')
                    : (isLightMode ? 'text-zinc-700 hover:bg-zinc-100' : 'text-zinc-200 hover:bg-zinc-800')}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`inline-flex items-center rounded-md border p-0.5 ${isLightMode ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-zinc-900/40'}`}>
          <button className={filterButtonClass('all')} onClick={() => setActiveFilter('all')}>{text.allFilter}</button>
          <button className={filterButtonClass('income')} onClick={() => setActiveFilter('income')}>{text.incomesFilter}</button>
          <button className={filterButtonClass('expense')} onClick={() => setActiveFilter('expense')}>{text.expensesFilter}</button>
        </div>
      </div>

      <div>
        {filteredGroupedTransactions.length === 0 ? (
          <p className={`p-5 text-sm ${secondaryTextClass}`}>{text.noTransactions}</p>
        ) : (
          filteredGroupedTransactions.map((group) => (
            <div key={group.day}>
              <div
                className={`flex items-center gap-3 border-b px-4 py-2 md:px-5 ${cardSubtleDividerClass} ${
                  isLightMode ? 'bg-zinc-100/70' : 'bg-black/25'
                }`}
              >
                <span className={`text-2xl font-semibold leading-none ${primaryTextClass}`}>{group.day}</span>
                <span className={`text-sm capitalize ${secondaryTextClass}`}>{group.weekday}</span>
              </div>

              {group.entries.map((transaction) => {
                const normalizedAmount = getNormalizedAmount(transaction)
                const isIncome = normalizedAmount > 0
                const accountMeta = accountMetadataById.get(transaction?.accountId || transaction?.account?.id || null)
                const accountName = getFriendlyAccountLabel(accountMeta || transaction?.account, language, text.accountUnit)
                const categoryName = transaction?.category || text.uncategorized
                const searchableInvestmentText = `${String(categoryName)} ${String(transaction?.description || '')}`.toLowerCase()
                const isInvestmentTransaction = /(invest|investment|investimento|aplica|aplicacao|aplicação|rdb|cdb|buy|sell)/i.test(searchableInvestmentText)

                const badgeClass = isInvestmentTransaction
                  ? (isLightMode ? 'bg-sky-100/80 text-[#60a5fa]' : 'bg-sky-500/10 text-[#60a5fa]')
                  : (isLightMode
                      ? isIncome ? 'bg-emerald-100/80 text-[#22c55e]' : 'bg-rose-100/80 text-[#f87171]'
                      : isIncome ? 'bg-emerald-500/10 text-[#22c55e]' : 'bg-rose-500/10 text-[#f87171]')

                const valueClass = isInvestmentTransaction
                  ? 'text-[#60a5fa]'
                  : (isIncome ? 'text-[#22c55e]' : 'text-[#f87171]')

                return (
                  <div key={transaction.id} className={`flex items-center justify-between border-b px-4 py-3 md:px-5 ${cardSubtleDividerClass}`}>
                    <div className="flex min-w-0 items-center gap-3 pr-4">
                      <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${badgeClass}`}>
                        {isIncome ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                      </span>

                      <div className="min-w-0">
                        <p className={`truncate text-sm font-medium ${primaryTextClass}`}>{transaction?.description || text.uncategorized}</p>
                        <p className={`mt-0.5 flex items-center gap-1.5 text-xs ${secondaryTextClass}`}>
                          {getBankLogoUrl(accountMeta) ? (
                            <img
                              src={getBankLogoUrl(accountMeta)}
                              alt={accountName}
                              className="h-3.5 w-3.5 shrink-0 rounded object-contain"
                              onError={(e) => {
                                const nextLogo = getBankLogoFallbackUrl(accountMeta, e.currentTarget.src)
                                if (nextLogo) e.currentTarget.src = nextLogo
                              }}
                            />
                          ) : (
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${isLightMode ? 'bg-zinc-400' : 'bg-zinc-500'}`} />
                          )}
                          <span className="truncate">{accountName}</span>
                          <span>•</span>
                          <span className="truncate">{categoryName}</span>
                        </p>
                      </div>
                    </div>

                    <span className={`text-sm font-semibold tabular-nums ${valueClass}`}>
                      {isIncome ? '+' : '-'}{formatMoney(Math.abs(normalizedAmount))}
                    </span>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>

      <div className={`flex flex-col gap-3 border-t px-4 py-4 md:px-5 md:flex-row md:items-center md:justify-between ${cardSubtleDividerClass} ${isLightMode ? 'bg-zinc-100/40' : 'bg-black/15'}`}>
        <p className={`text-[12px] font-medium ${secondaryTextClass}`}>
          {totalTransactionCount} {text.transactionCount}
        </p>
        <div className={`flex flex-col gap-2 md:flex-row md:gap-6`}>
          <p className={`text-[12px] font-semibold tabular-nums ${secondaryTextClass}`}>
            {text.openingBalanceLabel}: {formatMoney(openingBalance)}
          </p>
          <p className={`text-[12px] font-semibold tabular-nums ${primaryTextClass}`}>
            {filteredBalanceLabel}: {formatMoney(filteredTransactionNet)}
          </p>
        </div>
      </div>
    </section>
    </div>
  )
}

export default FlowPage
