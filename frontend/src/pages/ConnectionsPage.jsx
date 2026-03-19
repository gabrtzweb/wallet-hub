import { AppWindow, ChevronRight, Clock3, Link2, Plus } from 'lucide-react'
import { getBankLogo, getInstitutionName } from '../config/dashboardConfig'

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
}) {
  const sources = [...bankAccounts, ...creditAccounts, ...investments]

  const connectionsByItem = sources.reduce((map, entry) => {
    const itemId = entry?.itemId
    if (!itemId || map.has(itemId)) return map
    map.set(itemId, entry)
    return map
  }, new Map())

  const connections = Array.from(connectionsByItem.values())

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
    <section className="w-full space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <div>
          <h2 className={`font-display text-2xl font-bold tracking-tight ${primaryTextClass}`}>{text.connectionsDataPassportTitle}</h2>
          <p className={`mt-1.5 text-sm ${secondaryTextClass}`}>{text.connectionsDataPassportSubtitle}</p>
        </div>
      </div>

      <article className={`${glassCardClass} w-full overflow-hidden`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${cardSubtleDividerClass}`}>
          <div className="flex items-center gap-2">
            <Link2 className="h-[18px] w-[18px] text-[#1f67ff]" />
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.navConnections}</h3>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              {connections.length} {text.connectionsActiveLabel}
            </span>
          </div>

          <button className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#1f67ff] px-3 text-xs font-semibold text-white transition hover:brightness-105">
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

                      <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>

                    <p className={`text-2xl font-semibold ${primaryTextClass}`}>{institution}</p>
                    <p className={`mt-1 flex items-center gap-1.5 text-sm ${secondaryTextClass}`}>
                      <Clock3 className="h-[18px] w-[18px]" />
                      <span>{formatRelativeSync(entry)}</span>
                    </p>

                    <div className={`mt-4 border-t pt-3 ${cardSubtleDividerClass}`}>
                      <button className={`inline-flex items-center gap-1 text-sm ${secondaryTextClass} transition-colors ${isLightMode ? 'hover:text-zinc-700' : 'hover:text-zinc-300'}`}>
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

      <article className={`${glassCardClass} w-full overflow-hidden`}>
        <div className={`flex items-center gap-2 border-b px-4 py-3 ${cardSubtleDividerClass}`}>
          <AppWindow className="h-[18px] w-[18px] text-[#1f67ff]" />
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsPartnerApps}</h3>
        </div>
        <div className="p-5">
          <p className={`text-sm ${secondaryTextClass}`}>{text.connectionsNoPartnerApps}</p>
        </div>
      </article>
    </section>
  )
}

export default ConnectionsPage