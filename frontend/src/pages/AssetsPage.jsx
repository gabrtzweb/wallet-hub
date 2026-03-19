import { useMemo, useState } from 'react'
import { ArrowDownRight, BriefcaseBusiness, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'
import { getInstitutionName } from '../config/dashboardConfig'

function AssetsPage({
  glassCardClass,
  topCardTitleClass,
  primaryTextClass,
  secondaryTextClass,
  cardSubtleDividerClass,
  text,
  investments,
  investmentsTotal,
  formatMoney,
  getBankLogo,
  isLightMode,
}) {
  const [expandedById, setExpandedById] = useState({})

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(text.overview === 'Visão geral' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    [text.overview],
  )

  const formatAssetClassLabel = (rawClassName) => {
    const normalized = String(rawClassName || '').trim().toUpperCase()
    if (!normalized || normalized === 'FIXED_INCOME') {
      return text.assetsFixedIncomeLabel
    }
    return normalized.replace(/_/g, ' ')
  }

  const getFirstMovement = (investment) => (
    investment?.movements?.[0]
    || investment?.transactions?.[0]
    || investment?.operations?.[0]
    || null
  )

  const getMovementDateLabel = (investment) => {
    const movement = getFirstMovement(investment)
    const rawDate =
      movement?.date
      || movement?.createdAt
      || movement?.operationDate
      || investment?.date
      || investment?.createdAt
      || null

    if (!rawDate) return '--'
    const parsed = new Date(rawDate)
    if (Number.isNaN(parsed.getTime())) return '--'
    return dateFormatter.format(parsed)
  }

  const getMovementAmount = (investment) => {
    const movement = getFirstMovement(investment)
    const amountCandidate =
      movement?.amount
      ?? movement?.value
      ?? movement?.paymentAmount
      ?? investment?.amountOriginal
      ?? investment?.investedAmount
      ?? investment?.principal
      ?? investment?.initialAmount
      ?? investment?.cost
      ?? null

    const parsed = Number(amountCandidate)
    return Number.isFinite(parsed) ? Math.abs(parsed) : null
  }

  const getInvestedValue = (investment) => {
    const movementAmount = getMovementAmount(investment)
    const candidate =
      investment?.amountOriginal
      ?? investment?.investedAmount
      ?? investment?.principal
      ?? investment?.initialAmount
      ?? investment?.cost
      ?? movementAmount
      ?? null

    const parsed = Number(candidate)
    return Number.isFinite(parsed) ? Math.abs(parsed) : null
  }

  const getProfitabilityLabel = (investment) => {
    const candidate =
      investment?.profitability
      ?? investment?.yield
      ?? investment?.rate
      ?? investment?.returnRate
      ?? investment?.interestRate
      ?? investment?.fixedIncome?.rate
      ?? null

    const benchmark =
      investment?.indexer
      || investment?.benchmark
      || investment?.rateBenchmark
      || investment?.rateType
      || investment?.fixedIncome?.indexer
      || ''

    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim().toUpperCase()
    }

    if (typeof candidate === 'number' && Number.isFinite(candidate)) {
      const suffix = benchmark ? ` ${String(benchmark).toUpperCase()}` : ''
      return `${candidate.toFixed(2)}%${suffix}`
    }

    return text.assetsNotAvailable
  }

  const groupedByClass = investments.reduce((map, investment) => {
    const className = investment?.type || investment?.subtype || 'FIXED_INCOME'
    if (!map.has(className)) {
      map.set(className, [])
    }
    map.get(className).push(investment)
    return map
  }, new Map())

  return (
    <section className="w-full space-y-4">
      <article className={`${glassCardClass} w-full overflow-hidden`}>
        <div className={`flex items-center justify-between border-b px-4 py-3 md:px-5 ${cardSubtleDividerClass}`}>
          <h2 className={`flex items-center gap-2 ${topCardTitleClass}`}>
            <BriefcaseBusiness className="h-[18px] w-[18px] text-[#1f67ff]" />
            <span>{text.assetsPortfolioLabel} ({investments.length} {text.assetsLabel})</span>
          </h2>
          <span className="text-2xl font-bold tabular-nums text-[#22c55e]">{formatMoney(investmentsTotal)}</span>
        </div>

        {investments.length === 0 ? (
          <p className={`p-5 text-sm ${secondaryTextClass}`}>{text.noAssetsData}</p>
        ) : (
          <div>
            {Array.from(groupedByClass.entries()).map(([className, classInvestments]) => {
              const classTotal = classInvestments.reduce((sum, investment) => {
                const value = Number(investment?.balance) || Number(investment?.amount) || Number(investment?.value) || 0
                return sum + value
              }, 0)

              return (
                <div key={className}>
                  <div className={`flex items-center justify-between border-b px-4 py-2 md:px-5 ${cardSubtleDividerClass}`}>
                    <span className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{formatAssetClassLabel(className)}</span>
                    <span className={`text-sm font-semibold tabular-nums ${primaryTextClass}`}>{formatMoney(classTotal)}</span>
                  </div>

                  {classInvestments.map((investment) => {
                    const value = Number(investment?.balance) || Number(investment?.amount) || Number(investment?.value) || 0
                    const institution = getInstitutionName(investment)
                    const assetName = investment?.name || text.uncategorized
                    const assetType = String(investment?.subtype || investment?.type || text.assetsUnknownType).toUpperCase().replace(/_/g, ' ')
                    const share = classTotal > 0 ? ((value / classTotal) * 100).toFixed(1) : '0.0'
                    const rowId = investment?.id || `${className}-${assetName}`
                    const isExpanded = Boolean(expandedById[rowId])
                    const movementDate = getMovementDateLabel(investment)
                    const movementAmount = getMovementAmount(investment)
                    const investedValue = getInvestedValue(investment)
                    const profitabilityLabel = getProfitabilityLabel(investment)
                    const bankLogo = getBankLogo(investment)

                    return (
                      <div key={rowId} className={`border-b ${cardSubtleDividerClass}`}>
                        <button
                          type="button"
                          onClick={() => setExpandedById((current) => ({ ...current, [rowId]: !current[rowId] }))}
                          className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors md:px-5 ${
                            isLightMode ? 'hover:bg-zinc-100/40' : 'hover:bg-zinc-900/30'
                          }`}
                          aria-label={isExpanded ? text.collapse : text.expand}
                          aria-expanded={isExpanded}
                        >
                          <div className="flex min-w-0 items-start gap-3 pr-4">
                            <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${isLightMode ? 'bg-zinc-100 text-zinc-500' : 'bg-zinc-900/70 text-zinc-400'}`}>
                              <TrendingUp className="h-5 w-5" />
                            </span>

                            <div className="min-w-0">
                              <p className={`truncate text-sm font-medium ${primaryTextClass}`}>{assetName}</p>
                              <p className={`mt-0.5 flex items-center gap-1.5 text-xs ${secondaryTextClass}`}>
                                {bankLogo ? (
                                  <img src={bankLogo} alt={institution} className="h-3.5 w-3.5 rounded object-contain" />
                                ) : (
                                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${isLightMode ? 'bg-zinc-400' : 'bg-zinc-500'}`} />
                                )}
                                <span className="truncate">{institution}</span>
                                <span>•</span>
                                <span className="truncate">{assetType}</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <p className="text-sm font-semibold tabular-nums text-[#22c55e]">{formatMoney(value)}</p>
                              <span className={`inline-flex h-5 w-5 items-center justify-center rounded ${isLightMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                              </span>
                            </div>
                            <p className={`mt-0.5 text-sm ${secondaryTextClass}`}>{share}%</p>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className={`border-t px-4 py-3 md:px-5 ${cardSubtleDividerClass}`}>
                            <div className={`mb-3 grid grid-cols-1 gap-3 border-b pb-3 md:grid-cols-3 ${cardSubtleDividerClass}`}>
                              <div>
                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.assetsBalanceLabel}</p>
                                <p className={`mt-0.5 text-sm font-semibold leading-none ${primaryTextClass}`}>{formatMoney(value)}</p>
                              </div>
                              <div>
                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.assetsProfitabilityLabel}</p>
                                <p className={`mt-0.5 text-sm font-semibold leading-none ${primaryTextClass}`}>{profitabilityLabel}</p>
                              </div>
                              <div>
                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.assetsInvestedValueLabel}</p>
                                <p className={`mt-0.5 text-sm font-semibold leading-none ${primaryTextClass}`}>
                                  {investedValue == null ? text.assetsNotAvailable : formatMoney(investedValue)}
                                </p>
                              </div>
                            </div>

                            <p className={`mb-2 text-[10px] font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.assetsMovementsLabel}</p>
                            <div className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isLightMode ? 'border-zinc-300/70 bg-zinc-50/70' : 'border-zinc-700/60 bg-zinc-900/30'}`}>
                              <div className="flex min-w-0 items-center gap-2 pr-4">
                                <span className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded ${isLightMode ? 'bg-emerald-100 text-[#22c55e]' : 'bg-emerald-500/10 text-[#22c55e]'}`}>
                                  <ArrowDownRight className="h-3 w-3" />
                                </span>
                                <div className="min-w-0">
                                  <p className={`text-xs font-semibold ${primaryTextClass}`}>{text.assetsBuyLabel}</p>
                                  <p className={`text-[10px] ${secondaryTextClass}`}>{movementDate}</p>
                                </div>
                              </div>
                              <span className="text-sm font-semibold tabular-nums text-[#22c55e]">
                                {movementAmount == null ? text.assetsNotAvailable : formatMoney(movementAmount)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </article>
    </section>
  )
}

export default AssetsPage