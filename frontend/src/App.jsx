import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts'
import { ChevronDown, ChevronUp, CreditCard, Landmark, Languages, Moon, Sun, TrendingUp, Wallet } from 'lucide-react'
import flammaLogo from './assets/flamma-logo.svg'
import interLogo from './assets/banks/inter.webp'
import nubankLogo from './assets/banks/nubank.webp'

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
    lightMode: 'Light',
    darkMode: 'Dark',
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
    collapse: 'Collapse',
    expand: 'Expand',
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
    lightMode: 'Claro',
    darkMode: 'Escuro',
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
    collapse: 'Recolher',
    expand: 'Expandir',
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

function Dashboard() {
  const [theme, setTheme] = useState(() => localStorage.getItem('wallet-hub-theme') || 'dark')
  const [language, setLanguage] = useState('pt')
  const [bankAccounts, setBankAccounts] = useState([])
  const [creditAccounts, setCreditAccounts] = useState([])
  const [investments, setInvestments] = useState([])
  const [balanceEvolution, setBalanceEvolution] = useState([])
  const [investmentView, setInvestmentView] = useState('classes')
  const [isEvolutionCollapsed, setIsEvolutionCollapsed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    localStorage.setItem('wallet-hub-theme', theme)
  }, [theme])

  const text = COPY[language]
  const isLightMode = theme === 'light'

  const topCardTitleClass = isLightMode
    ? 'text-xs font-semibold uppercase tracking-wider text-zinc-600'
    : 'text-xs font-semibold uppercase tracking-wider text-zinc-500'

  const primaryTextClass = isLightMode ? 'text-[#080a0f]' : 'text-[#e9f0ff]'
  const secondaryTextClass = isLightMode ? 'text-zinc-600' : 'text-zinc-500'
  const cardPrimaryDividerClass = isLightMode ? 'border-zinc-400/90' : 'border-zinc-500/90'
  const cardSubtleDividerClass = isLightMode ? 'border-zinc-300/45' : 'border-zinc-700/45'
  const navActiveClass = isLightMode
    ? 'rounded-lg bg-zinc-900 px-2.5 py-1 text-sm font-medium text-white'
    : 'rounded-lg bg-zinc-800 px-2.5 py-1 text-sm font-medium text-[#e9f0ff]'
  const navInactiveClass = isLightMode
    ? 'rounded-lg px-2.5 py-1 text-sm text-zinc-600 transition hover:bg-[rgba(31,103,255,0.75)] hover:text-white'
    : 'rounded-lg px-2.5 py-1 text-sm text-zinc-400 transition hover:bg-[rgba(31,103,255,0.75)] hover:text-white'
  const headerControlBaseClass = isLightMode
    ? 'inline-flex h-8 items-center rounded-lg bg-white px-2.5 text-xs font-medium text-zinc-800 transition hover:bg-[rgba(31,103,255,0.75)]'
    : 'inline-flex h-8 items-center rounded-lg bg-zinc-900/70 px-2.5 text-xs font-medium text-[#e9f0ff] transition hover:bg-[rgba(31,103,255,0.75)]'
  const themeToggleClass = `${headerControlBaseClass} gap-1.5`
  const languageWrapperClass = `${headerControlBaseClass} gap-1.5`
  const refreshButtonClass = isLightMode
    ? 'inline-flex h-8 items-center rounded-lg border border-[#1f67ff] bg-[#1f67ff] px-3 text-xs font-semibold text-white transition hover:brightness-95'
    : 'inline-flex h-8 items-center rounded-lg border border-[#1f67ff] bg-[#1f67ff] px-3 text-xs font-semibold text-white transition hover:brightness-110'
  const investmentToggleWrapperClass = isLightMode
    ? 'inline-flex items-center rounded-lg bg-white p-0.5'
    : 'inline-flex items-center rounded-lg bg-zinc-900/70 p-0.5'
  const investmentToggleInactiveClass = isLightMode ? 'text-zinc-600' : 'text-zinc-400'
  const investmentBarTrackClass = isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'
  const investmentBarFillClass = isLightMode ? 'bg-zinc-400' : 'bg-zinc-600'

  const glassCardClass = isLightMode
    ? 'rounded-xl border border-[rgba(8,10,15,0.08)] bg-[rgba(255,255,255,0.72)] backdrop-blur-[8px]'
    : 'rounded-xl border border-[rgba(8,10,15,0.10)] bg-[rgba(233,240,255,0.10)] backdrop-blur-[8px]'

  const headerGlassClass = isLightMode
    ? 'fixed left-0 right-0 top-0 z-50 border border-[rgba(8,10,15,0.08)] bg-[rgba(255,255,255,0.72)] backdrop-blur-[8px]'
    : 'fixed left-0 right-0 top-0 z-50 border border-[rgba(8,10,15,0.10)] bg-[rgba(233,240,255,0.10)] backdrop-blur-[8px]'

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
      setBalanceEvolution(getArrayResults(payload?.balanceEvolution))

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
    const backendSeries = getArrayResults(balanceEvolution)
      .map((point) => ({
        day: String(point?.day || ''),
        fullDate: String(point?.fullDate || ''),
        value: Number(point?.value) || 0,
      }))
      .filter((point) => point.day && point.fullDate)

    if (backendSeries.length > 0) {
      return backendSeries
    }

    const today = new Date()
    const day = String(today.getDate()).padStart(2, '0')
    const month = String(today.getMonth() + 1).padStart(2, '0')

    return [
      {
        day,
        fullDate: `${day}/${month}`,
        value: Number((Number(evolutionTotal) || 0).toFixed(2)),
      },
    ]
  }, [balanceEvolution, evolutionTotal])

  return (
    <main className={`relative min-h-screen overflow-hidden ${isLightMode ? 'bg-[#E9F0FF] text-[#080a0f]' : 'bg-[#080A0F] text-[#e9f0ff]'}`}>

      <header className={headerGlassClass}>
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-2.5 md:py-3">
          <div className="flex items-center gap-6">
            <img src={flammaLogo} alt="Flamma" className={`h-7 w-auto md:h-8 ${isLightMode ? 'brightness-0' : ''}`} />
            <nav className="hidden items-center gap-1.5 md:flex">
              <button className={navActiveClass}>
                {text.navOverview}
              </button>
              <button className={navInactiveClass}>
                {text.navFlow}
              </button>
              <button className={navInactiveClass}>
                {text.navAssets}
              </button>
              <button className={navInactiveClass}>
                {text.navConnections}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setTheme(isLightMode ? 'dark' : 'light')}
              className={themeToggleClass}
            >
              {isLightMode ? <Moon className="h-3.5 w-3.5 shrink-0" /> : <Sun className="h-3.5 w-3.5 shrink-0" />}
              <span className="leading-none">{isLightMode ? text.darkMode : text.lightMode}</span>
            </button>

            <button
              onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
              className={languageWrapperClass}
            >
              <Languages className="h-3.5 w-3.5 shrink-0" />
              <span className="leading-none">{language === 'pt' ? 'EN' : 'PT'}</span>
            </button>

            <button
              onClick={loadDashboard}
              className={refreshButtonClass}
            >
              {text.refresh}
            </button>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-20 pt-24">
        <header className="mb-5">
          <h1 className={`font-display text-2xl font-bold tracking-tight ${isLightMode ? 'text-[#080a0f]' : 'text-white'}`}>{text.overview}</h1>
          <p className={`mt-1 text-sm ${isLightMode ? 'text-zinc-600' : 'text-white/40'}`}>{text.subtitle}</p>
        </header>

        {loading && (
          <div className={`${glassCardClass} p-8 text-center ${isLightMode ? 'text-zinc-700' : 'text-zinc-300'}`}>
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
          </>
        )}
      </section>
    </main>
  )
}

export default Dashboard
