import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { CreditCard, Landmark, TrendingUp } from 'lucide-react'
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

const ITEM_IDS = Object.keys(DASHBOARD_ITEMS)

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
  },
  pt: {
    overview: 'Overview',
    subtitle: 'Visao geral dos seus dados financeiros.',
    bankAccounts: 'Contas Bancarias',
    creditCards: 'Cartoes de Credito',
    investments: 'Investimentos',
    cards: 'cartoes',
    accounts: 'contas',
    positions: 'posicoes',
    usedOf: 'Utilizado de',
    limitUsage: 'limite usado',
    classesAndAssets: '1 classe - 1 ativo',
    fixedIncome: 'Renda Fixa',
    balanceEvolution: 'Evolucao do Saldo',
    monthlyView: 'Visao mensal',
    refresh: 'Atualizar Dados',
    connections: 'Todas conexoes',
    navOverview: 'Overview',
    navFlow: 'Fluxo',
    navAssets: 'Ativos',
    navConnections: 'Conexoes',
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
  const [language, setLanguage] = useState('en')
  const [bankAccounts, setBankAccounts] = useState([])
  const [creditAccounts, setCreditAccounts] = useState([])
  const [investments, setInvestments] = useState([])
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

  const formatMoney = (value) => brlFormatter.format(typeof value === 'number' ? value : 0)

  const loadDashboard = async () => {
    setLoading(true)
    setError('')

    try {
      const perItemData = await Promise.all(
        ITEM_IDS.map(async (itemId) => {
          const [accountsRes, investmentsRes] = await Promise.all([
            fetch(`${API_BASE}/accounts/${itemId}`),
            fetch(`${API_BASE}/investments/${itemId}`),
          ])

          if (!accountsRes.ok || !investmentsRes.ok) {
            throw new Error(`Failed to load data for item ${itemId}`)
          }

          const [accountsData, investmentsData] = await Promise.all([
            accountsRes.json(),
            investmentsRes.json(),
          ])

          const accounts = getArrayResults(accountsData).map((account) => ({ ...account, itemId }))
          const itemInvestments = getArrayResults(investmentsData).map((investment) => ({
            ...investment,
            itemId,
          }))

          return { accounts, investments: itemInvestments }
        }),
      )

      const allAccounts = perItemData.flatMap((entry) => entry.accounts)
      const allInvestments = perItemData.flatMap((entry) => entry.investments)

      setBankAccounts(allAccounts.filter((account) => account.type === 'BANK'))
      setCreditAccounts(allAccounts.filter((account) => account.type === 'CREDIT'))
      setInvestments(allInvestments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error while loading dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const bankBalanceTotal = useMemo(
    () => bankAccounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0),
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

  const investmentsTotal = useMemo(
    () =>
      investments.reduce(
        (sum, investment) =>
          sum +
          (Number(investment.balance) || Number(investment.amount) || Number(investment.value) || 0),
        0,
      ),
    [investments],
  )

  const creditUsage = creditLimitTotal > 0 ? Math.min((creditUsedTotal / creditLimitTotal) * 100, 100) : 0

  const getBankLogo = (entry) => BANK_BRANDING[entry?.itemId]?.logo || null

  const evolutionTotal = bankBalanceTotal + investmentsTotal + creditUsedTotal
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
    <main className="min-h-screen bg-[#05070b] text-[#e9f0ff]">
      <header className="fixed left-0 right-0 top-0 z-50 border-b border-zinc-800/70 bg-[#04060a]/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-8 md:py-4">
          <div className="flex items-center gap-7">
            <img src={flammaLogo} alt="Flamma" className="h-8 w-auto md:h-10" />
            <nav className="hidden items-center gap-2 md:flex">
              <button className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-[#e9f0ff]">
                {text.navOverview}
              </button>
              <button className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900/90 hover:text-[#e9f0ff]">
                {text.navFlow}
              </button>
              <button className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900/90 hover:text-[#e9f0ff]">
                {text.navAssets}
              </button>
              <button className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900/90 hover:text-[#e9f0ff]">
                {text.navConnections}
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-900 md:block">
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
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm font-medium text-[#e9f0ff] transition hover:border-zinc-500 hover:bg-zinc-800"
            >
              {text.refresh}
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-7xl px-4 pb-8 pt-28 md:px-8 md:pt-32">
        <header className="mb-6">
          <h1 className="text-4xl font-semibold tracking-tight text-[#e9f0ff]">{text.overview}</h1>
          <p className="mt-2 text-lg text-zinc-500">{text.subtitle}</p>
        </header>

        {loading && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center text-zinc-300">
            Loading dashboard...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-300">
            <p className="font-semibold">Dashboard unavailable</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <article className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 p-5 pb-0">
                    <Landmark className="h-4 w-4 text-violet-400" />
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500">{text.bankAccounts}</p>
                  </div>
                </div>
                <p className="px-5 text-[2.15rem] font-semibold text-[#e9f0ff]">{formatMoney(bankBalanceTotal)}</p>
                <div className="mt-4 space-y-0">
                  {bankAccounts.slice(0, 4).map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between border-t border-zinc-800/70 px-5 py-3 text-xs"
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
                        <span className="text-sm text-[#e9f0ff]">{getInstitutionName(account)}</span>
                      </span>
                      <span className="text-base font-semibold text-emerald-400">
                        {formatMoney(Number(account.balance) || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-rose-400" />
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500">{text.creditCards}</p>
                  </div>
                  <span className="rounded-lg bg-rose-500/10 px-2 py-1 text-xs text-rose-300">
                    {creditAccounts.length} {text.cards}
                  </span>
                </div>

                <p className="text-2xl font-semibold text-rose-400">{formatMoney(creditUsedTotal)}</p>
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>{creditUsage.toFixed(0)}% {text.limitUsage}</span>
                  <span>{text.usedOf} {formatMoney(creditLimitTotal)}</span>
                </div>

                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-[#f4b400] transition-all"
                    style={{ width: `${creditUsage.toFixed(0)}%` }}
                  />
                </div>

                <div className="mt-4 space-y-3 border-t border-zinc-800 pt-3">
                  {creditAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 p-3"
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
                          <p className="text-sm text-[#e9f0ff]">{account.name || getInstitutionName(account)}</p>
                          <p className="text-xs text-zinc-500">
                            xxxx {account.number || '----'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-rose-400">
                          {formatMoney(Math.abs(Number(account.balance) || 0))}
                        </p>
                        <p className="text-xs text-zinc-500">Limit: {formatMoney(Number(getCreditLimit(account)))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    <p className="text-sm font-semibold uppercase tracking-[0.08em] text-zinc-500">{text.investments}</p>
                  </div>
                  <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                    {investments.length} {text.positions}
                  </span>
                </div>
                <p className="text-2xl font-semibold text-emerald-400">{formatMoney(investmentsTotal)}</p>
                <p className="mt-1 text-sm text-zinc-500">{text.classesAndAssets}</p>
                <div className="mt-8">
                  <div className="mb-2 flex items-center justify-between text-sm text-zinc-400">
                    <span>{text.fixedIncome}</span>
                    <span>100.0% &nbsp; {formatMoney(investmentsTotal)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800">
                    <div className="h-1.5 w-full rounded-full bg-[#ff2f68]" />
                  </div>
                </div>
              </article>
            </section>

            <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-semibold uppercase tracking-[0.04em] text-zinc-300">
                  {text.balanceEvolution}
                </h2>
                <span className="text-xs text-zinc-500">{text.monthlyView}</span>
              </div>
              <p className="text-4xl font-semibold text-[#e9f0ff]">{formatMoney(evolutionTotal)}</p>

              <div className="mt-4 h-[230px] w-full">
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
