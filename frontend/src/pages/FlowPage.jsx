import { useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Wallet, Search } from 'lucide-react'
import { getFriendlyAccountLabel } from '../config/dashboardConfig'

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
  getBankLogo,
  bankBalanceTotal,
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

  return (
    <section className={`${glassCardClass} overflow-hidden`}>
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 md:px-5 ${cardSubtleDividerClass}`}>
        <div className="flex items-center gap-2 -ml-1 translate-y-[6px]">
          <Wallet className="h-[18px] w-[18px] text-[#1f67ff]" />
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>Despesas</h3>
        </div>
      </div>

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
                          {getBankLogo(accountMeta) ? (
                            <img
                              src={getBankLogo(accountMeta)}
                              alt={accountName}
                              className="h-3.5 w-3.5 shrink-0 rounded object-contain"
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
  )
}

export default FlowPage
