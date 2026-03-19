import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { ArrowDownRight, ArrowUpRight, ChevronDown, ChevronUp, Clock3, CreditCard, Donut, Landmark, ReceiptText, ScrollText, TrendingUp, Wallet } from 'lucide-react'
import { getCreditLimit, getInstitutionName } from '../config/dashboardConfig'

function OverviewPage({
  glassCardClass,
  topCardTitleClass,
  primaryTextClass,
  secondaryTextClass,
  cardPrimaryDividerClass,
  cardSubtleDividerClass,
  investmentToggleWrapperClass,
  investmentToggleInactiveClass,
  investmentBarTrackClass,
  investmentBarFillClass,
  isLightMode,
  text,
  bankBalanceTotal,
  sortedBankAccounts,
  getBankLogo,
  formatMoney,
  creditUsedTotal,
  creditUsage,
  creditLimitTotal,
  sortedCreditAccounts,
  formatCardName,
  investmentsTotal,
  investmentView,
  setInvestmentView,
  investmentClassesCount,
  investments,
  institutionInvestments,
  isEvolutionCollapsed,
  setIsEvolutionCollapsed,
  evolutionTotal,
  evolutionData,
  spendingByCategoryData,
  categoryChartColors,
  recentTransactions,
  handleGoToFlow,
  getNormalizedAmount,
  accountMetadataById,
  truncateText,
  formatTransactionDate,
  monthlyIncome,
  monthlyExpenses,
  cashFlowBarWidth,
  cashFlowExpenseToIncomePct,
  upcomingBills,
}) {
  return (
    <>
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <article className={`${glassCardClass} overflow-hidden lg:min-h-[290px] flex flex-col`}>
          <div className="mb-2 flex h-9 items-center justify-between px-4 pt-5">
            <div className="flex items-center gap-2">
              <Landmark className="h-[18px] w-[18px] text-[#1f67ff]" />
              <p className={topCardTitleClass}>{text.bankAccounts}</p>
            </div>
          </div>
          <p className={`mt-2 px-4 font-display text-2xl font-bold tabular-nums ${primaryTextClass}`}>{formatMoney(bankBalanceTotal)}</p>
          <div className={`mt-3 border-t ${cardPrimaryDividerClass}`} />
          <div className="px-4 pt-4 pb-2 space-y-0">
            {sortedBankAccounts.slice(0, 4).map((account, index) => (
              <div
                key={account.id}
                className={`flex items-center justify-between py-2.5 text-xs ${index > 0 ? `border-t ${cardSubtleDividerClass}` : ''}`}
              >
                <span className={`flex items-center gap-2 ${isLightMode ? 'text-zinc-700' : 'text-zinc-300'}`}>
                  {getBankLogo(account) ? (
                    <img
                      src={getBankLogo(account)}
                      alt={getInstitutionName(account)}
                      className="h-5 w-5 rounded-md"
                    />
                  ) : (
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-semibold ${isLightMode ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-700 text-[#e9f0ff]'}`}>
                      {getInstitutionName(account).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <span>
                    <p className={`text-sm ${primaryTextClass}`}>{getInstitutionName(account)}</p>
                    <p className={`text-xs ${secondaryTextClass}`}>
                      {text.accountUnit} • {bankBalanceTotal > 0 ? ((Math.abs(Number(account.balance) || 0) / bankBalanceTotal) * 100).toFixed(1) : '0.0'}%
                    </p>
                  </span>
                </span>
                <span className="text-sm font-semibold tabular-nums text-[#22c55e]">
                  {formatMoney(Number(account.balance) || 0)}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className={`${glassCardClass} overflow-hidden lg:min-h-[290px] flex flex-col`}>
          <div className="mb-2 flex h-9 items-center justify-between px-4 pt-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-[18px] w-[18px] text-[#1f67ff]" />
              <p className={topCardTitleClass}>{text.creditCards}</p>
            </div>
          </div>

          <p className="mt-2 px-4 font-display text-2xl font-bold tabular-nums text-[#f87171]">{formatMoney(creditUsedTotal)}</p>
          <div className={`mt-3 border-t ${cardPrimaryDividerClass}`} />

          <div className="pt-4 pb-2">
            <div className={`flex items-center justify-between px-4 text-xs ${secondaryTextClass}`}>
              <span>{creditUsage.toFixed(0)}% {text.limitUsage}</span>
              <span>{text.usedOf} {formatMoney(creditLimitTotal)}</span>
            </div>

            <div className="mt-1.5 px-4">
              <div className="h-1.5 w-full rounded-full bg-zinc-800">
                <div
                  className="h-1.5 rounded-full bg-[#f87171] transition-all"
                  style={{ width: `${creditUsage.toFixed(0)}%` }}
                />
              </div>
            </div>

            <div className={`mt-3 mx-4 border-t ${cardSubtleDividerClass}`}>
            {sortedCreditAccounts.map((account) => (
              <div
                key={account.id}
                className={`flex items-center justify-between border-b py-3 last:border-b-0 ${cardSubtleDividerClass}`}
              >
                <div className="flex items-center gap-2">
                  {getBankLogo(account) ? (
                    <img
                      src={getBankLogo(account)}
                      alt={getInstitutionName(account)}
                      className="h-5 w-5 rounded-md"
                    />
                  ) : (
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-semibold ${isLightMode ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-700 text-[#e9f0ff]'}`}>
                      {getInstitutionName(account).slice(0, 2).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <p className={`text-sm ${primaryTextClass}`}>{formatCardName(account)}</p>
                    <p className={`text-xs ${secondaryTextClass}`}>
                      xxxx {account.number || '----'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-[#f87171]">
                    {formatMoney(Math.abs(Number(account.balance) || 0))}
                  </p>
                  <p className={`text-xs tabular-nums ${secondaryTextClass}`}>{text.limitLabel} {formatMoney(Number(getCreditLimit(account)))}</p>
                </div>
              </div>
            ))}
            </div>
          </div>
        </article>

        <article className={`${glassCardClass} overflow-hidden lg:min-h-[290px] flex flex-col`}>
          <div className="mb-2 flex h-9 items-center justify-between px-4 pt-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-[18px] w-[18px] text-[#1f67ff]" />
              <p className={topCardTitleClass}>{text.investments}</p>
            </div>
            <div className={investmentToggleWrapperClass}>
              <button
                onClick={() => setInvestmentView('classes')}
                className={`rounded px-2.5 py-1.5 text-[10px] font-medium leading-none transition-colors ${
                  investmentView === 'classes' ? 'bg-[rgba(31,103,255,0.75)] text-white' : investmentToggleInactiveClass
                }`}
              >
                {text.classes}
              </button>
              <button
                onClick={() => setInvestmentView('institutions')}
                className={`rounded px-2.5 py-1.5 text-[10px] font-medium leading-none transition-colors ${
                  investmentView === 'institutions' ? 'bg-[rgba(31,103,255,0.75)] text-white' : investmentToggleInactiveClass
                }`}
              >
                {text.institutions}
              </button>
            </div>
          </div>
          <p className="mt-2 px-4 font-display text-2xl font-bold tabular-nums text-[#22c55e]">{formatMoney(investmentsTotal)}</p>
          <div className={`mt-3 border-t ${cardPrimaryDividerClass}`} />
          <div className="pt-4 pb-2">
            <p className={`px-4 text-xs ${secondaryTextClass}`}>{investmentClassesCount} {text.classes.toLowerCase()} · {investments.length} {text.assetsLabel}</p>

            {investmentView === 'classes' ? (
              <>
                <div className={`mt-4 mx-4 border-t ${cardSubtleDividerClass}`} />
                <div className="pt-3.5 px-4 pb-4">
                  <div className={`mb-1.5 flex items-center justify-between text-sm ${isLightMode ? 'text-zinc-700' : 'text-zinc-300'}`}>
                    <span>{text.fixedIncome}</span>
                    <span>100.0% &nbsp; {formatMoney(investmentsTotal)}</span>
                  </div>
                  <div className={`h-1.5 w-full rounded-full ${investmentBarTrackClass}`}>
                    <div className={`h-1.5 w-full rounded-full ${investmentBarFillClass}`} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={`mt-4 mx-4 border-t ${cardSubtleDividerClass}`} />
                <div className="space-y-3 pt-3.5 px-4 pb-4">
                {institutionInvestments.map((entry) => {
                  const percentage = investmentsTotal > 0 ? (entry.total / investmentsTotal) * 100 : 0
                  return (
                    <div key={entry.name}>
                      <div className={`mb-1.5 flex items-center justify-between text-sm ${isLightMode ? 'text-zinc-700' : 'text-zinc-300'}`}>
                        <span>{entry.name} ({entry.count})</span>
                        <span>{percentage.toFixed(1)}% &nbsp; {formatMoney(entry.total)}</span>
                      </div>
                      <div className={`h-1.5 w-full rounded-full ${investmentBarTrackClass}`}>
                        <div className={`h-1.5 rounded-full ${investmentBarFillClass}`} style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  )
                })}
                </div>
              </>
            )}
          </div>
        </article>
      </section>

      <section className={`${glassCardClass} mt-4 p-4`}>
        <div className="flex flex-col">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2">
              <Wallet className="h-[18px] w-[18px] text-[#1f67ff]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                {text.balanceEvolution}
              </span>
            </h2>
            <span className="text-xs text-zinc-500">{text.monthlyView}</span>
          </div>

          <div className="mt-2 flex items-end justify-between">
            <p className={`font-display text-2xl font-bold tabular-nums ${primaryTextClass}`}>{formatMoney(evolutionTotal)}</p>

            <div className="flex items-center">
              <button
                onClick={() => setIsEvolutionCollapsed((current) => !current)}
                className={`inline-flex items-center gap-1 rounded px-2.5 py-1.5 text-[10px] font-medium leading-none transition-colors ${
                  isLightMode
                    ? 'bg-white text-zinc-600 hover:bg-[rgba(31,103,255,0.75)] hover:text-white'
                    : 'bg-zinc-900/70 text-zinc-400 hover:bg-[rgba(31,103,255,0.75)] hover:text-white'
                }`}
                aria-label={isEvolutionCollapsed ? 'Expand balance evolution chart' : 'Collapse balance evolution chart'}
                title={isEvolutionCollapsed ? 'Expand' : 'Collapse'}
              >
                <span>{isEvolutionCollapsed ? text.expand : text.collapse}</span>
                {isEvolutionCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {!isEvolutionCollapsed && (
          <div className="mt-3 h-[210px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolutionData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="evolutionGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f67ff" stopOpacity={0.34} />
                    <stop offset="100%" stopColor="#1f67ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#22252d" strokeDasharray="2 2" />
                <XAxis
                  dataKey="day"
                  tick={{ fill: '#71717a', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={26}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0d0f14',
                    border: '1px solid #2c303a',
                    borderRadius: '10px',
                    color: '#e4e4e7',
                  }}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.fullDate || ''}
                  formatter={(value) => formatMoney(Number(value))}
                />
                <Area
                  dataKey="value"
                  type="monotone"
                  stroke="#1f67ff"
                  strokeWidth={2.5}
                  fill="url(#evolutionGlow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className={`${glassCardClass} p-4`}>
          <h3 className={`mb-4 flex items-center gap-2 ${topCardTitleClass}`}>
            <Donut className="h-[18px] w-[18px] text-[#1f67ff]" />
            <span>{text.spendingByCategory}</span>
          </h3>
          {spendingByCategoryData.length === 0 ? (
            <p className={`mt-4 text-sm ${secondaryTextClass}`}>{text.noCategoryData}</p>
          ) : (
            <div className="mt-3 grid grid-cols-[120px_1fr] items-center gap-3">
              <div className="h-[120px] w-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spendingByCategoryData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={34}
                      outerRadius={52}
                      paddingAngle={2}
                    >
                      {spendingByCategoryData.map((entry, index) => (
                        <Cell key={entry.name} fill={categoryChartColors[index % categoryChartColors.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {spendingByCategoryData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <span className={`flex min-w-0 items-center gap-2 pr-2 ${secondaryTextClass}`}>
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: categoryChartColors[index % categoryChartColors.length] }} />
                      <span className="truncate">{entry.name}</span>
                    </span>
                    <span className={`font-semibold tabular-nums ${primaryTextClass}`}>{formatMoney(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        <article className={`${glassCardClass} p-4`}>
          <div className="mb-4 flex items-center justify-between gap-2">
            <h3 className={`flex items-center gap-2 ${topCardTitleClass}`}>
              <ScrollText className="h-[18px] w-[18px] text-[#1f67ff]" />
              <span>{text.recentTransactions}</span>
            </h3>
            <button
              onClick={handleGoToFlow}
              className={`inline-flex h-[26px] min-w-[84px] items-center justify-center rounded px-2.5 text-[10px] font-medium leading-none transition-colors ${
                isLightMode
                  ? 'bg-white text-zinc-600 hover:bg-[rgba(31,103,255,0.75)] hover:text-white'
                  : 'bg-zinc-900/70 text-zinc-400 hover:bg-[rgba(31,103,255,0.75)] hover:text-white'
              }`}
            >
              {text.showAll}
            </button>
          </div>
          {recentTransactions.length === 0 ? (
            <p className={`mt-4 text-sm ${secondaryTextClass}`}>{text.noTransactions}</p>
          ) : (
            <div className="mt-3 space-y-2">
              {recentTransactions.map((transaction) => {
                const normalizedAmount = getNormalizedAmount(transaction)
                const isIncome = normalizedAmount > 0
                const accountMeta = accountMetadataById.get(transaction?.accountId || transaction?.account?.id || null)
                const accountName = accountMeta?.name || transaction?.account?.name || text.accountUnit
                const categoryName = transaction?.category || text.uncategorized
                const description = truncateText(transaction?.description || text.uncategorized)
                return (
                  <div key={transaction.id} className={`flex items-center justify-between border-b pb-2 text-sm last:border-b-0 ${cardSubtleDividerClass}`}>
                    <div className="flex min-w-0 items-center gap-2 pr-3">
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
                        <p className={`truncate ${primaryTextClass}`}>{description}</p>
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

                    <div className="text-right">
                      <span className={`font-semibold tabular-nums ${isIncome ? 'text-[#22c55e]' : 'text-[#f87171]'}`}>
                        {isIncome ? '+' : '-'}{formatMoney(Math.abs(normalizedAmount))}
                      </span>
                      <p className={`mt-0.5 text-xs ${secondaryTextClass}`}>
                        {formatTransactionDate(transaction?.date || transaction?.paymentDate || transaction?.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </article>

        <article className={`${glassCardClass} p-4`}>
          <h3 className={`mb-4 flex items-center gap-2 ${topCardTitleClass}`}>
            <ReceiptText className="h-[18px] w-[18px] text-[#1f67ff]" />
            <span>{text.monthlyCashFlow}</span>
          </h3>
          <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className={secondaryTextClass}>{text.incomeLabel}</span>
              <span className="font-semibold tabular-nums text-[#22c55e]">{formatMoney(monthlyIncome)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={secondaryTextClass}>{text.expensesLabel}</span>
              <span className="font-semibold tabular-nums text-[#f87171]">{formatMoney(monthlyExpenses)}</span>
            </div>
          </div>
          <div className="mt-3">
            <div className={`h-2 w-full rounded-full ${isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'}`}>
              <div className="h-2 rounded-full bg-[#1f67ff] transition-all" style={{ width: `${cashFlowBarWidth.toFixed(0)}%` }} />
            </div>
            <p className={`mt-2 text-xs ${secondaryTextClass}`}>{cashFlowExpenseToIncomePct.toFixed(0)}% {text.ofIncomeSpent}</p>
          </div>
        </article>

        <article className={`${glassCardClass} p-4`}>
          <h3 className={`mb-4 flex items-center gap-2 ${topCardTitleClass}`}>
            <Clock3 className="h-[18px] w-[18px] text-[#1f67ff]" />
            <span>{text.upcomingBills}</span>
          </h3>
          {upcomingBills.length === 0 ? (
            <p className={`mt-4 text-sm ${secondaryTextClass}`}>{text.noUpcomingBills}</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {upcomingBills.slice(0, 5).map((bill) => (
                <div key={bill.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className={`flex min-w-0 items-center gap-2 ${primaryTextClass}`}>
                      <span className="shrink-0">
                        {bill.logo ? (
                          <img src={bill.logo} alt={bill.name} className="h-4 w-4 rounded-md" />
                        ) : (
                          <span className={`inline-block h-2 w-2 rounded-full ${isLightMode ? 'bg-zinc-400' : 'bg-zinc-500'}`} />
                        )}
                      </span>
                      <span className="truncate">{bill.name} - {text.dueInLabel}: {bill.dueDateLabel}</span>
                    </span>
                    <span className="font-semibold tabular-nums text-[#f87171]">{formatMoney(bill.used)}</span>
                  </div>
                  <p className={`mt-0.5 text-xs ${secondaryTextClass}`}>{text.usedLabel}: {formatMoney(bill.used)} {text.usedOf} {formatMoney(bill.limit)}</p>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </>
  )
}

export default OverviewPage
