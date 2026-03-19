import { useMemo, useState } from 'react'
import { AppWindow, ChevronLeft, ChevronRight, Clock3, CreditCard, Landmark, Link2, Plus, RefreshCw, TrendingUp, Trash2 } from 'lucide-react'
import { getBankLogo, getInstitutionName, getInvestmentValue } from '../config/dashboardConfig'

function ConnectionsPage({
  glassCardClass,
  cardSubtleDividerClass,
  isLightMode,
  primaryTextClass,
  secondaryTextClass,
  text,
  bankAccounts,
  creditAccounts,
  investments,
  transactions,
}) {
  const [selectedConnectionItemId, setSelectedConnectionItemId] = useState(null)

  const sources = [...bankAccounts, ...creditAccounts, ...investments]

  const connectionsByItem = sources.reduce((map, entry) => {
    const itemId = entry?.itemId
    if (!itemId || map.has(itemId)) return map
    map.set(itemId, entry)
    return map
  }, new Map())

  const connections = Array.from(connectionsByItem.values())

  const selectedConnection = useMemo(
    () => connections.find((entry) => entry?.itemId === selectedConnectionItemId) || null,
    [connections, selectedConnectionItemId],
  )

  const selectedBankAccounts = useMemo(
    () => bankAccounts.filter((entry) => entry?.itemId === selectedConnectionItemId),
    [bankAccounts, selectedConnectionItemId],
  )

  const selectedCreditAccounts = useMemo(
    () => creditAccounts.filter((entry) => entry?.itemId === selectedConnectionItemId),
    [creditAccounts, selectedConnectionItemId],
  )

  const selectedInvestments = useMemo(
    () => investments.filter((entry) => entry?.itemId === selectedConnectionItemId),
    [investments, selectedConnectionItemId],
  )

  const transactionCountByAccountId = useMemo(() => {
    const counts = new Map()

    transactions.forEach((transaction) => {
      const accountId = transaction?.accountId || transaction?.account?.id || null
      if (!accountId) return

      counts.set(accountId, (counts.get(accountId) || 0) + 1)
    })

    return counts
  }, [transactions])

  const formatRelativeSync = (entry) => {
    const rawDate = entry?.updatedAt || entry?.date || entry?.createdAt || null
    if (!rawDate) return text.connectionsSyncedToday

    const parsed = new Date(rawDate)
    if (Number.isNaN(parsed.getTime())) return text.connectionsSyncedToday

    const now = new Date()
    const msPerDay = 1000 * 60 * 60 * 24
    const diffDays = Math.max(0, Math.floor((now - parsed) / msPerDay))

    if (diffDays === 0) return text.connectionsSyncedToday
    if (diffDays === 1) return text.connectionsSyncedYesterday
    return text.connectionsSyncedDaysAgo.replace('{days}', String(diffDays))
  }

  return (
    <section className="w-full space-y-5">
      {selectedConnection && (
        <article className={`${glassCardClass} w-full overflow-hidden p-4 md:p-5`}>
          <button
            type="button"
            onClick={() => setSelectedConnectionItemId(null)}
            className={`mb-5 inline-flex items-center gap-2 text-sm ${secondaryTextClass} ${isLightMode ? 'hover:text-zinc-700' : 'hover:text-zinc-300'}`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{text.connectionsBack || text.navConnections}</span>
          </button>

          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {getBankLogo(selectedConnection) ? (
                <img
                  src={getBankLogo(selectedConnection)}
                  alt={getInstitutionName(selectedConnection)}
                  className="h-10 w-10 rounded-lg object-contain"
                />
              ) : (
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${isLightMode ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-800 text-zinc-300'}`}>
                  {getInstitutionName(selectedConnection).slice(0, 2).toUpperCase()}
                </span>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <p className={`text-[14px] font-semibold ${primaryTextClass}`}>{`${text.connectionsBankLabel || 'Banco'} ${getInstitutionName(selectedConnection)}`}</p>
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.9)] motion-safe:animate-pulse" />
                </div>
                <p className={`mt-1 flex items-center gap-1.5 text-[12px]`}>
                  <Clock3 className="h-[14px] w-[14px]" />
                  <span className={secondaryTextClass}>{formatRelativeSync(selectedConnection)}</span>
                  <span className={secondaryTextClass}>·</span>
                  <span className="font-semibold text-emerald-400/60">{text.connectionsSyncLabel || 'Sincronizado'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className={`inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold opacity-60 ${isLightMode ? 'border-zinc-300 text-zinc-700' : 'border-zinc-700 text-zinc-300'}`}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{text.connectionsUpdate || text.refresh}</span>
              </button>
              <button
                type="button"
                disabled
                className={`inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold opacity-60 ${isLightMode ? 'border-zinc-300 text-zinc-700' : 'border-zinc-700 text-zinc-300'}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{text.connectionsDelete || 'Excluir'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {selectedBankAccounts.length > 0 && (
            <div>
              <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
                <Landmark className="h-4 w-4 text-[#1f67ff]" />
                <span>{text.bankAccounts}</span>
              </div>

              <div className="space-y-2">
                {selectedBankAccounts.map((account) => (
                  <article
                    key={account.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${isLightMode ? 'border-zinc-300/60' : 'border-zinc-700/60'}`}
                  >
                    <div className="min-w-0 pr-3">
                      <p className={`truncate text-sm font-semibold ${primaryTextClass}`}>{account?.name || getInstitutionName(account)}</p>
                      <p className={`truncate text-xs ${secondaryTextClass}`}>
                        {account?.number || account?.id || '--'} - {transactionCountByAccountId.get(account.id) || 0} {text.transactionCount}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[#22c55e]">R$ {Number(account?.balance || 0).toFixed(2)}</p>
                  </article>
                ))}
              </div>
            </div>
            )}

            {selectedCreditAccounts.length > 0 && (
            <div>
              <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
                <CreditCard className="h-4 w-4 text-[#1f67ff]" />
                <span>{text.creditCards}</span>
              </div>

              <div className="space-y-2">
                {selectedCreditAccounts.map((account) => (
                  <article
                    key={account.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${isLightMode ? 'border-zinc-300/60' : 'border-zinc-700/60'}`}
                  >
                    <div className="min-w-0 pr-3">
                      <p className={`truncate text-sm font-semibold ${primaryTextClass}`}>{account?.name || 'Card'}</p>
                      <p className={`truncate text-xs ${secondaryTextClass}`}>
                        {transactionCountByAccountId.get(account.id) || 0} {text.transactionCount}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[#f87171]">R$ {Math.abs(Number(account?.balance || 0)).toFixed(2)}</p>
                  </article>
                ))}
              </div>
            </div>
            )}

            {selectedInvestments.length > 0 && (
            <div>
              <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
                <TrendingUp className="h-4 w-4 text-[#1f67ff]" />
                <span>{text.investments}</span>
              </div>

              <div className="space-y-2">
                {selectedInvestments.map((investment) => (
                  <article
                    key={investment.id}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 ${isLightMode ? 'border-zinc-300/60' : 'border-zinc-700/60'}`}
                  >
                    <div className="min-w-0 pr-3">
                      <p className={`truncate text-sm font-semibold ${primaryTextClass}`}>{investment?.name || getInstitutionName(investment)}</p>
                      <p className={`truncate text-xs ${secondaryTextClass}`}>
                        {investment?.type || 'FIXED_INCOME'} - {Number(investment?.numberOfTransactions || 1)} {text.connectionsMovements || 'movimentações'}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-[#22c55e]">R$ {getInvestmentValue(investment).toFixed(2)}</p>
                  </article>
                ))}
              </div>
            </div>
            )}
          </div>
        </article>
      )}

      {!selectedConnection && (
      <article className={`${glassCardClass} w-full overflow-hidden`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${cardSubtleDividerClass}`}>
          <div className="flex items-center gap-2">
            <Link2 className="h-[18px] w-[18px] text-[#1f67ff]" />
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.navConnections}</h3>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              {connections.length} {text.connectionsActiveLabel}
            </span>
          </div>

          <button type="button" disabled className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg bg-[#1f67ff] px-3 text-xs font-semibold text-white opacity-60">
            <Plus className="h-4 w-4" />
            <span>{text.connectionsNewConnection}</span>
          </button>
        </div>

        <div className="p-4">
          {connections.length === 0 ? (
            <p className={`text-sm ${secondaryTextClass}`}>{text.connectionsNoConnections}</p>
          ) : (
            <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {connections.map((entry) => {
                const institution = getInstitutionName(entry)
                const logo = getBankLogo(entry)

                return (
                  <article key={entry.itemId} className={`w-full rounded-xl border p-4 ${isLightMode ? 'border-zinc-300/60 bg-transparent' : 'border-zinc-700/60 bg-transparent'}`}>
                    <div className="mb-4 flex items-start justify-between">
                      {logo ? (
                        <img src={logo} alt={institution} className="h-10 w-10 rounded-lg object-contain" />
                      ) : (
                        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${isLightMode ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-800 text-zinc-300'}`}>
                          {institution.slice(0, 2).toUpperCase()}
                        </span>
                      )}

                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.9)] motion-safe:animate-pulse" />
                    </div>

                    <p className={`text-[14px] font-semibold ${primaryTextClass}`}>{`${text.connectionsBankLabel || 'Banco'} ${institution}`}</p>
                    <p className={`mt-1 flex items-center gap-1.5 text-[12px]`}>
                      <Clock3 className="h-[14px] w-[14px]" />
                      <span className={secondaryTextClass}>{formatRelativeSync(entry)}</span>
                      <span className={secondaryTextClass}>·</span>
                      <span className="font-semibold text-emerald-400/60">{text.connectionsSyncLabel || 'Sincronizado'}</span>
                    </p>

                    <div className={`mt-4 border-t pt-3 ${cardSubtleDividerClass}`}>
                      <button
                        type="button"
                        onClick={() => setSelectedConnectionItemId(entry.itemId)}
                        className={`inline-flex items-center gap-1 text-[12px] ${secondaryTextClass} transition-colors ${isLightMode ? 'hover:text-zinc-700' : 'hover:text-zinc-300'}`}
                      >
                        <span>{text.connectionsSeeDetails}</span>
                        <ChevronRight className="h-[18px] w-[18px]" />
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </article>
      )}

      {!selectedConnection && (
        <article className={`${glassCardClass} w-full overflow-hidden`}>
          <div className={`flex items-center gap-2 border-b px-4 py-3 ${cardSubtleDividerClass}`}>
            <AppWindow className="h-[18px] w-[18px] text-[#1f67ff]" />
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsPartnerApps}</h3>
          </div>
          <div className="p-5">
            <p className={`text-sm ${secondaryTextClass}`}>{text.connectionsNoPartnerApps}</p>
          </div>
        </article>
      )}
    </section>
  )
}

export default ConnectionsPage