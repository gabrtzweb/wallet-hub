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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className={`font-display text-2xl font-bold tracking-tight ${primaryTextClass}`}>{text.connectionsDataPassportTitle}</h2>
          <p className={`mt-1.5 text-sm ${secondaryTextClass}`}>{text.connectionsDataPassportSubtitle}</p>
        </div>

        <button className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1f67ff] px-4 text-sm font-semibold text-white transition hover:brightness-105">
          <Plus className="h-[18px] w-[18px]" />
          <span>{text.connectionsNewConnection}</span>
        </button>
      </div>

      <div>
        <div className={`mb-3 flex items-center gap-2 ${primaryTextClass}`}>
          <Link2 className="h-[18px] w-[18px] text-[#1f67ff]" />
          <p className="text-sm font-semibold uppercase tracking-wider">{text.navConnections}</p>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
            {connections.length} {text.connectionsActiveLabel}
          </span>
        </div>

        {connections.length === 0 ? (
          <article className={`${glassCardClass} w-full p-5`}>
            <p className={`text-sm ${secondaryTextClass}`}>{text.connectionsNoConnections}</p>
          </article>
        ) : (
          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2">
            {connections.map((entry) => {
              const institution = getInstitutionName(entry)
              const logo = getBankLogo(entry)

              return (
                <article key={entry.itemId} className={`${glassCardClass} w-full p-4`}>
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

      <div>
        <div className={`mb-3 flex items-center gap-2 ${primaryTextClass}`}>
          <AppWindow className="h-[18px] w-[18px] text-[#1f67ff]" />
          <p className="text-sm font-semibold uppercase tracking-wider">{text.connectionsPartnerApps}</p>
        </div>

        <article className={`${glassCardClass} w-full p-5`}>
          <p className={`text-sm ${secondaryTextClass}`}>{text.connectionsNoPartnerApps}</p>
        </article>
      </div>
    </section>
  )
}

export default ConnectionsPage