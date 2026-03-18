import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CreditCard, Landmark, TrendingUp, Wallet } from 'lucide-react'
import flammaLogo from './assets/flamma-logo.svg'
import interLogo from './assets/banks/inter.svg'
import nubankLogo from './assets/banks/nubank.svg'

const API_BASE = 'http://localhost:3000/api'

const DASHBOARD_ITEMS = {
  '115ae3ff-be4b-4330-8278-7de1d99e3a7b': 'Inter',
  '481ff23b-9bf0-4618-8c94-f046a27fbbc9': 'Nubank',
}

const BANK_BRANDING = {
  '115ae3ff-be4b-4330-8278-7de1d99e3a7b': {
    name: 'Inter',
    logo: interLogo,
  },
  '481ff23b-9bf0-4618-8c94-f046a27fbbc9': {
    name: 'Nubank',
    logo: nubankLogo,
  },
}

const COPY = {
  en: {
    overview: 'Overview',
    subtitle: 'General view of your financial data.',
    bankAccounts: 'Bank Accounts',
    creditCards: 'Credit Cards',
    investments: 'Investments',
    cards: 'cards',
    accounts: 'accounts',
    positions: 'positions',
    usedOf: 'Used of',
    limitUsage: 'limit usage',
    classesAndAssets: '1 class - 1 asset',
    fixedIncome: 'Fixed Income',
    balanceEvolution: 'Balance Evolution',
    monthlyView: 'Monthly view',
    refresh: 'Refresh Data',
    connections: 'All connections',
    navOverview: 'Overview',
    navFlow: 'Flow',
    navAssets: 'Assets',
    navConnections: 'Connections',
    classes: 'Classes',
    institutions: 'Institutions',
    loadingDashboard: 'Loading dashboard...',
    dashboardUnavailable: 'Dashboard unavailable',
    fallbackLoadError: 'Unexpected error while loading dashboard data.',
    loadDashboardError: 'Failed to load dashboard data.',
    unknownItem: 'an item',
    partialRefreshPrefix: 'Some connections failed to refresh',
    partialRefreshSuffix: 'Showing partial data.',
    accountUnit: '1 account',
    limitLabel: 'Limit:',
    mastercardGold: 'Mastercard Gold',
    assetsLabel: 'assets',
  },
  pt: {
    overview: 'Visão geral',
    subtitle: 'Visão geral dos seus dados financeiros.',
    bankAccounts: 'Contas bancárias',
    creditCards: 'Cartões de crédito',
    investments: 'Investimentos',
    cards: 'cartões',
    accounts: 'contas',
    positions: 'posições',
    usedOf: 'Utilizado de',
    limitUsage: 'limite usado',
    classesAndAssets: '1 classe - 1 ativo',
    fixedIncome: 'Renda Fixa',
    balanceEvolution: 'Evolução do saldo',
    monthlyView: 'Visão mensal',
    refresh: 'Atualizar Dados',
    connections: 'Todas conexões',
    navOverview: 'Visão geral',
    navFlow: 'Fluxo',
    navAssets: 'Ativos',
    navConnections: 'Conexões',
    classes: 'Classes',
    institutions: 'Instituições',
    loadingDashboard: 'Carregando dashboard...',
    dashboardUnavailable: 'Dashboard indisponível',
    fallbackLoadError: 'Erro inesperado ao carregar o dashboard.',
    loadDashboardError: 'Falha ao carregar os dados do dashboard.',
    unknownItem: 'um item',
    partialRefreshPrefix: 'Algumas conexões falharam ao atualizar',
    partialRefreshSuffix: 'Exibindo dados parciais.',
    accountUnit: '1 conta',
    limitLabel: 'Limite:',
    mastercardGold: 'Mastercard Gold',
    assetsLabel: 'ativos',
  },
}

const getArrayResults = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

const getCreditLimit = (account) =>
  account?.creditData?.creditLimit ??
  account?.creditData?.limit ??
  account?.creditLimit ??
  account?.credit?.limit ??
  0

const getInvestmentValue = (investment) =>
  Number(investment?.balance) || Number(investment?.amount) || Number(investment?.value) || 0

const getInstitutionName = (entry) => {
  if (entry?.itemId && BANK_BRANDING[entry.itemId]?.name) {
    return BANK_BRANDING[entry.itemId].name
  }

  const marketingName =
    entry?.marketingName ||
    entry?.item?.connector?.marketingName ||
    entry?.connector?.marketingName ||
    null

  if (marketingName) return marketingName

  const name = entry?.name || entry?.item?.connector?.name || entry?.connector?.name || null
  if (name) return name

  return DASHBOARD_ITEMS[entry?.itemId] || 'Unknown Institution'
}

const glassCardClass = 'rounded-xl border border-[rgba(8,10,15,0.10)] bg-[rgba(233,240,255,0.10)] backdrop-blur-[8px]'
const topCardTitleClass = 'text-xs font-semibold uppercase tracking-wider text-zinc-500'

function Dashboard() {
  const [language, setLanguage] = useState('en')
  const [bankAccounts, setBankAccounts] = useState([])
  const [creditAccounts, setCreditAccounts] = useState([])
  const [investments, setInvestments] = useState([])
  const [investmentView, setInvestmentView] = useState('classes')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const text = COPY[language]

  const brlFormatter = useMemo(
    () =>
      new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
        style: 'currency',
        currency: 'BRL',
      }),
    [language],
  )

  const formatMoney = (value) => {
    const formatted = brlFormatter.format(typeof value === 'number' ? value : 0)
    if (language === 'en') {
      return formatted.replace(/^R\$(?!\s)/, 'R$ ')
    }
    return formatted
  }

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/dashboard-data`)

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        const firstFailure = getArrayResults(payload?.failedItems)[0]
        const detailedReason = firstFailure?.message ? ` (${firstFailure.message})` : ''
        throw new Error((payload?.error || text.loadDashboardError) + detailedReason)
      }

      const payload = await response.json()

      setBankAccounts(getArrayResults(payload?.bankAccounts))
      setCreditAccounts(getArrayResults(payload?.creditCards))
      setInvestments(getArrayResults(payload?.investments))

      const failedItems = getArrayResults(payload?.failedItems)
      if (failedItems.length > 0) {
        const firstFailure = failedItems[0]
        const institutionName = DASHBOARD_ITEMS[firstFailure?.itemId] || firstFailure?.itemId || text.unknownItem
        setError(`${text.partialRefreshPrefix} (${institutionName}). ${text.partialRefreshSuffix}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : text.fallbackLoadError)
    } finally {
      setLoading(false)
    }
  }, [text.fallbackLoadError, text.loadDashboardError, text.partialRefreshPrefix, text.partialRefreshSuffix, text.unknownItem])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const bankBalanceTotal = useMemo(
    () => bankAccounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0),
    [bankAccounts],
  )

  const sortedBankAccounts = useMemo(
    () => [...bankAccounts].sort((first, second) => (Number(second.balance) || 0) - (Number(first.balance) || 0)),
    [bankAccounts],
  )

  const creditLimitTotal = useMemo(
    () => creditAccounts.reduce((sum, account) => sum + (Number(getCreditLimit(account)) || 0), 0),
    [creditAccounts],
  )

  const creditUsedTotal = useMemo(
    () => creditAccounts.reduce((sum, account) => sum + Math.abs(Number(account.balance) || 0), 0),
    [creditAccounts],
  )

  const sortedCreditAccounts = useMemo(
    () => [...creditAccounts].sort((first, second) => Math.abs(Number(second.balance) || 0) - Math.abs(Number(first.balance) || 0)),
    [creditAccounts],
  )

  const investmentsTotal = useMemo(
    () => investments.reduce((sum, investment) => sum + getInvestmentValue(investment), 0),
    [investments],
  )

  const institutionInvestments = useMemo(() => {
    const groupsMap = new Map()

    investments.forEach((investment) => {
      const institutionName = getInstitutionName(investment)
      const current = groupsMap.get(institutionName) || { name: institutionName, count: 0, total: 0 }
      current.count += 1
      current.total += getInvestmentValue(investment)
      groupsMap.set(institutionName, current)
    })

    return Array.from(groupsMap.values()).sort((first, second) => second.total - first.total)
  }, [investments])

  const investmentClassesCount = useMemo(() => {
    const classes = new Set(
      investments.map((investment) => investment?.type || investment?.subtype || 'FIXED_INCOME'),
    )
    return classes.size
  }, [investments])

  const creditUsage = creditLimitTotal > 0 ? Math.min((creditUsedTotal / creditLimitTotal) * 100, 100) : 0

  const getBankLogo = (entry) => BANK_BRANDING[entry?.itemId]?.logo || null

  const formatCardName = (account) => {
    if (account?.type !== 'CREDIT') return account?.name || getInstitutionName(account)

    return text.mastercardGold
  }

  const evolutionTotal = bankBalanceTotal + creditUsedTotal
  const evolutionData = useMemo(() => {
    const base = evolutionTotal || 1
    return [
      { month: '2025-02', value: base * 0.82 },
      { month: '2025-04', value: base * 0.81 },
      { month: '2025-06', value: base * 0.79 },
      { month: '2025-08', value: base * 0.84 },
      { month: '2025-10', value: base * 0.98 },
      { month: '2025-12', value: base * 1.06 },
      { month: '2026-01', value: base * 0.86 },
      { month: '2026-03', value: base * 0.92 },
    ].map((point) => ({ ...point, value: Number(point.value.toFixed(2)) }))
  }, [evolutionTotal])

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080A0F] text-[#e9f0ff]">

      <header className="fixed left-0 right-0 top-0 z-50 border border-[rgba(8,10,15,0.10)] bg-[rgba(233,240,255,0.10)] backdrop-blur-[8px]">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-2.5 md:py-3">
          <div className="flex items-center gap-6">
            <img src={flammaLogo} alt="Flamma" className="h-7 w-auto md:h-8" />
            <nav className="hidden items-center gap-1.5 md:flex">
              <button className="rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-[#e9f0ff]">
                {text.navOverview}
              </button>
              <button className="rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-900/90 hover:text-[#e9f0ff]">
                {text.navFlow}
              </button>
              <button className="rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-900/90 hover:text-[#e9f0ff]">
                {text.navAssets}
              </button>
              <button className="rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-900/90 hover:text-[#e9f0ff]">
                {text.navConnections}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <button className="hidden rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-900 md:block">
              {text.connections}
            </button>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-1">
              <button
                onClick={() => setLanguage('en')}
                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                  language === 'en' ? 'bg-zinc-700 text-[#e9f0ff]' : 'text-zinc-400'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('pt')}
                className={`rounded-md px-2 py-1 text-xs font-semibold ${
                  language === 'pt' ? 'bg-zinc-700 text-[#e9f0ff]' : 'text-zinc-400'
                }`}
              >
                PT
              </button>
            </div>

            <button
              onClick={loadDashboard}
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-[#e9f0ff] transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              {text.refresh}
            </button>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-24">
        <header className="mb-5">
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">{text.overview}</h1>
          <p className="mt-1 text-sm text-white/40">{text.subtitle}</p>
        </header>

        {loading && (
          <div className={`${glassCardClass} p-8 text-center text-zinc-300`}>
            {text.loadingDashboard}
          </div>
        )}

        {!loading && error && (
          <div className={`${glassCardClass} border-rose-500/30 bg-rose-500/10 p-6 text-rose-300`}>
            <p className="font-semibold">{text.dashboardUnavailable}</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <article className={`${glassCardClass} overflow-hidden lg:min-h-[262px]`}>
                <div className="mb-3 flex h-9 items-center justify-between px-4 pt-5">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-[18px] w-[18px] text-[#1f67ff]" />
                    <p className={topCardTitleClass}>{text.bankAccounts}</p>
                  </div>
                </div>
                <p className="mt-3 px-4 font-display text-2xl font-bold tabular-nums text-[#e9f0ff]">{formatMoney(bankBalanceTotal)}</p>
                <div className="mt-3 space-y-0">
                  {sortedBankAccounts.slice(0, 4).map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between border-t border-zinc-800/70 px-4 py-2.5 text-xs"
                    >
                      <span className="flex items-center gap-2 text-zinc-300">
                        {getBankLogo(account) ? (
                          <img
                            src={getBankLogo(account)}
                            alt={getInstitutionName(account)}
                            className="h-6 w-6 rounded-md"
                          />
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-zinc-700 text-[10px] font-semibold text-[#e9f0ff]">
                            {getInstitutionName(account).slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <span>
                          <p className="text-sm text-[#e9f0ff]">{getInstitutionName(account)}</p>
                          <p className="text-xs text-zinc-500">
                            {text.accountUnit} • {bankBalanceTotal > 0 ? ((Math.abs(Number(account.balance) || 0) / bankBalanceTotal) * 100).toFixed(1) : '0.0'}%
                          </p>
                        </span>
                      </span>
                      <span className="text-sm font-semibold tabular-nums text-emerald-400">
                        {formatMoney(Number(account.balance) || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className={`${glassCardClass} overflow-hidden lg:min-h-[262px]`}>
                <div className="mb-3 flex h-9 items-center justify-between px-4 pt-5">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-[18px] w-[18px] text-[#1f67ff]" />
                    <p className={topCardTitleClass}>{text.creditCards}</p>
                  </div>
                </div>

                <p className="mt-3 px-4 font-display text-2xl font-bold tabular-nums text-rose-400">{formatMoney(creditUsedTotal)}</p>
                <div className="mt-1.5 flex items-center justify-between px-4 text-xs text-zinc-500">
                  <span>{creditUsage.toFixed(0)}% {text.limitUsage}</span>
                  <span>{text.usedOf} {formatMoney(creditLimitTotal)}</span>
                </div>

                <div className="mt-1.5 px-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-[#f4b400] transition-all"
                      style={{ width: `${creditUsage.toFixed(0)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 border-t border-zinc-800/70">
                  {sortedCreditAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between border-b border-zinc-800/70 px-4 py-2.5 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        {getBankLogo(account) ? (
                          <img
                            src={getBankLogo(account)}
                            alt={getInstitutionName(account)}
                            className="h-5 w-5 rounded-md"
                          />
                        ) : (
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-zinc-700 text-[10px] font-semibold text-[#e9f0ff]">
                            {getInstitutionName(account).slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <p className="text-sm text-[#e9f0ff]">{formatCardName(account)}</p>
                          <p className="text-xs text-zinc-500">
                            xxxx {account.number || '----'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular-nums text-rose-400">
                          {formatMoney(Math.abs(Number(account.balance) || 0))}
                        </p>
                        <p className="text-xs tabular-nums text-zinc-500">{text.limitLabel} {formatMoney(Number(getCreditLimit(account)))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className={`${glassCardClass} overflow-hidden lg:min-h-[262px]`}>
                <div className="mb-3 flex h-9 items-center justify-between px-4 pt-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-[18px] w-[18px] text-[#1f67ff]" />
                    <p className={topCardTitleClass}>{text.investments}</p>
                  </div>
                  <div className="inline-flex items-center rounded-lg border border-zinc-800 bg-[#0b0f17] p-0.5">
                    <button
                      onClick={() => setInvestmentView('classes')}
                      className={`rounded px-2.5 py-2 text-[10px] font-medium leading-none transition-colors ${
                        investmentView === 'classes' ? 'bg-[#2a0b16] text-[#ff2f68]' : 'text-white/50'
                      }`}
                    >
                      {text.classes}
                    </button>
                    <button
                      onClick={() => setInvestmentView('institutions')}
                      className={`rounded px-2.5 py-2 text-[10px] font-medium leading-none transition-colors ${
                        investmentView === 'institutions' ? 'bg-[#2a0b16] text-[#ff2f68]' : 'text-white/50'
                      }`}
                    >
                      {text.institutions}
                    </button>
                  </div>
                </div>
                <p className="mt-3 px-4 font-display text-2xl font-bold tabular-nums text-emerald-400">{formatMoney(investmentsTotal)}</p>
                <p className="mt-1.5 px-4 text-sm text-zinc-500">{investmentClassesCount} {text.classes.toLowerCase()} · {investments.length} {text.assetsLabel}</p>

                {investmentView === 'classes' ? (
                  <>
                    <div className="mt-5 border-t border-zinc-800 pt-3.5 px-4 pb-4">
                      <div className="mb-1.5 flex items-center justify-between text-sm text-zinc-300">
                        <span>{text.fixedIncome}</span>
                        <span>100.0% &nbsp; {formatMoney(investmentsTotal)}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800">
                        <div className="h-1.5 w-full rounded-full bg-[#ff2f68]" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mt-5 space-y-3 border-t border-zinc-800 pt-3.5 px-4 pb-4">
                    {institutionInvestments.map((entry) => {
                      const percentage = investmentsTotal > 0 ? (entry.total / investmentsTotal) * 100 : 0
                      return (
                        <div key={entry.name}>
                          <div className="mb-1.5 flex items-center justify-between text-sm text-zinc-300">
                            <span>{entry.name} ({entry.count})</span>
                            <span>{percentage.toFixed(1)}% &nbsp; {formatMoney(entry.total)}</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-800">
                            <div className="h-1.5 rounded-full bg-[#ff2f68]" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </article>
            </section>

            <section className={`${glassCardClass} mt-4 p-4`}>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="flex items-center gap-2">
                  <Wallet className="h-[18px] w-[18px] text-[#1f67ff]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {text.balanceEvolution}
                  </span>
                </h2>
                <span className="text-xs text-zinc-500">{text.monthlyView}</span>
              </div>
              <p className="mt-2 font-display text-2xl font-bold tabular-nums text-[#e9f0ff]">{formatMoney(evolutionTotal)}</p>

              <div className="mt-3 h-[210px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={evolutionData}>
                    <defs>
                      <linearGradient id="evolutionGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff2f68" stopOpacity={0.42} />
                        <stop offset="100%" stopColor="#ff2f68" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#22252d" strokeDasharray="2 2" />
                    <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis
                      tick={{ fill: '#71717a', fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
                          notation: 'compact',
                          compactDisplay: 'short',
                        }).format(value)
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0d0f14',
                        border: '1px solid #2c303a',
                        borderRadius: '10px',
                        color: '#e4e4e7',
                      }}
                      formatter={(value) => formatMoney(Number(value))}
                    />
                    <Area
                      dataKey="value"
                      type="monotone"
                      stroke="#ff2f68"
                      strokeWidth={2.5}
                      fill="url(#evolutionGlow)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  )
}

export default Dashboard
