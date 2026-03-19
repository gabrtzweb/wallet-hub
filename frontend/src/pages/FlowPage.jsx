import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Coins, Search } from 'lucide-react'

function FlowPage({
  glassCardClass,
  cardSubtleDividerClass,
  isLightMode,
  primaryTextClass,
  secondaryTextClass,
  flowMonthLabel,
  monthlyIncome,
  monthlyExpenses,
  formatMoney,
  text,
  flowGroupedTransactions,
  getNormalizedAmount,
  accountMetadataById,
  getBankLogo,
}) {
  return (
    <section className={`${glassCardClass} overflow-hidden`}>
      <div className={`flex items-center gap-2 border-b px-4 pt-4 pb-3 md:px-5 ${cardSubtleDividerClass}`}>
        <Coins className="h-[18px] w-[18px] text-[#1f67ff]" />
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>Despesas</h3>
      </div>

      <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 md:px-5 ${cardSubtleDividerClass}`}>
        <div className="flex items-center gap-3">
          <button className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${isLightMode ? 'bg-white text-zinc-600' : 'bg-zinc-900/70 text-zinc-400'}`}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className={`text-base font-semibold ${primaryTextClass}`}>{flowMonthLabel}</p>
          <button className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${isLightMode ? 'bg-white text-zinc-600' : 'bg-zinc-900/70 text-zinc-400'}`}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold tabular-nums">
          <span className="text-[#22c55e]">↘ {formatMoney(monthlyIncome)}</span>
          <span className="text-[#f87171]">↗ {formatMoney(monthlyExpenses)}</span>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-2 border-b p-3 md:grid-cols-[1fr_330px_auto] md:px-5 ${cardSubtleDividerClass}`}>
        <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-600' : 'border-zinc-700 bg-zinc-900/40 text-zinc-500'}`}>
          <Search className="h-4 w-4" />
          <span>{text.searchTransactionPlaceholder}</span>
        </div>

        <button className={`inline-flex items-center justify-between rounded-md border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-700' : 'border-zinc-700 bg-zinc-900/40 text-zinc-300'}`}>
          <span>{text.allAccounts}</span>
          <ChevronDown className="h-4 w-4" />
        </button>

        <div className={`inline-flex items-center rounded-md border p-0.5 ${isLightMode ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-zinc-900/40'}`}>
          <button className="rounded px-3 py-1.5 text-xs font-medium bg-[rgba(31,103,255,0.75)] text-white">{text.allFilter}</button>
          <button className={`rounded px-3 py-1.5 text-xs font-medium ${secondaryTextClass}`}>{text.incomesFilter}</button>
          <button className={`rounded px-3 py-1.5 text-xs font-medium ${secondaryTextClass}`}>{text.expensesFilter}</button>
        </div>
      </div>

      <div>
        {flowGroupedTransactions.length === 0 ? (
          <p className={`p-5 text-sm ${secondaryTextClass}`}>{text.noTransactions}</p>
        ) : (
          flowGroupedTransactions.map((group) => (
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
                const accountName = accountMeta?.name || transaction?.account?.name || text.accountUnit
                const categoryName = transaction?.category || text.uncategorized

                return (
                  <div key={transaction.id} className={`flex items-center justify-between border-b px-4 py-3 md:px-5 ${cardSubtleDividerClass}`}>
                    <div className="flex min-w-0 items-center gap-3 pr-4">
                      <span
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                          isLightMode
                            ? isIncome ? 'bg-emerald-100/80 text-[#22c55e]' : 'bg-rose-100/80 text-[#f87171]'
                            : isIncome ? 'bg-emerald-500/10 text-[#22c55e]' : 'bg-rose-500/10 text-[#f87171]'
                        }`}
                      >
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

                    <span className={`text-sm font-semibold tabular-nums ${isIncome ? 'text-[#22c55e]' : 'text-[#f87171]'}`}>
                      {isIncome ? '+' : '-'}{formatMoney(Math.abs(normalizedAmount))}
                    </span>
                  </div>
                )
              })}
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default FlowPage
