import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import DashboardFooter from './components/DashboardFooter'
import DashboardHeader from './components/DashboardHeader'
import noiseTexture from './assets/noise.png'
import { COPY } from './config/dashboardConfig'
import useDashboardData from './hooks/useDashboardData'
import AssetsPage from './pages/AssetsPage'
import SettingsPage from './pages/SettingsPage'
import FlowPage from './pages/FlowPage'
import HomePage from './pages/HomePage'
import OverviewPage from './pages/OverviewPage'
import { calculateFinancialHealthFromFinancialAccounts } from './utils/financialHealthCalculator'

function Dashboard() {
  const [theme, setTheme] = useState(() => localStorage.getItem('wallet-hub-theme') || 'dark')
  const [language, setLanguage] = useState('pt')
  const [includeBenefitsInOverview, setIncludeBenefitsInOverview] = useState(false)
  const [includeBenefitsInFlow, setIncludeBenefitsInFlow] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const text = COPY[language]

  useEffect(() => {
    localStorage.setItem('wallet-hub-theme', theme)
    document.body.classList.remove('light', 'dark')
    document.body.classList.add(theme)
  }, [theme])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  useEffect(() => {
    const path = location.pathname

    let dynamicTitle = 'Wallet Hub'
    let dynamicDescription = text.homeSubtitle

    if (path === '/overview') {
      dynamicTitle = `Dashboard - ${text.navOverview}`
      dynamicDescription = text.subtitle
    } else if (path === '/flow') {
      dynamicTitle = `Dashboard - ${text.navFlow}`
      dynamicDescription = text.flowSubtitle
    } else if (path === '/assets') {
      dynamicTitle = `Dashboard - ${text.navAssets}`
      dynamicDescription = text.assetsSubtitle
    } else if (path === '/settings') {
      dynamicTitle = `Dashboard - ${text.navConnections}`
      dynamicDescription = text.connectionsSubtitle
    }

    document.title = dynamicTitle

    const existingMeta = document.querySelector('meta[name="description"]')
    if (existingMeta) {
      existingMeta.setAttribute('content', dynamicDescription)
    } else {
      const meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      meta.setAttribute('content', dynamicDescription)
      document.head.appendChild(meta)
    }
  }, [location.pathname, text])

  const isLightMode = theme === 'light'
  const isHomeView = location.pathname === '/'
  const isOverviewView = location.pathname === '/overview'
  const isFlowView = location.pathname === '/flow'
  const isAssetsView = location.pathname === '/assets'
  const isSettingsView = location.pathname === '/settings'

  const {
    loading,
    error,
    loadDashboard,
    formatMoney,
    bankBalanceTotal,
    sortedBankAccounts,
    creditUsedTotal,
    creditUsage,
    creditLimitTotal,
    sortedCreditAccounts,
    investmentsTotal,
    investmentView,
    setInvestmentView,
    investmentClassesCount,
    investments,
    transactions,
    institutionInvestments,
    isEvolutionCollapsed,
    setIsEvolutionCollapsed,
    evolutionData,
    spendingByCategoryData,
    recentTransactions,
    getNormalizedAmount,
    accountMetadataById,
    truncateText,
    formatTransactionDate,
    monthlyIncome,
    monthlyExpenses,
    cashFlowBarWidth,
    cashFlowExpenseToIncomePct,
    upcomingBills,
    formatCardName,
    flowMonthLabel,
    canGoToPreviousFlowMonth,
    canGoToNextFlowMonth,
    goToPreviousFlowMonth,
    goToNextFlowMonth,
    flowGroupedTransactions,
    lastSyncedText,
  } = useDashboardData({ language, text })

  const isBenefitsCategory = useCallback((account) => {
    return String(account?.category || '').trim().toLowerCase() === 'benefits'
  }, [])

  const benefitsBalanceTotal = useMemo(() => {
    return sortedBankAccounts.reduce((sum, account) => {
      if (!isBenefitsCategory(account)) return sum
      return sum + (Number(account?.balance) || 0)
    }, 0)
  }, [isBenefitsCategory, sortedBankAccounts])

  const overviewBankBalanceTotal = useMemo(() => {
    if (includeBenefitsInOverview) return bankBalanceTotal
    return bankBalanceTotal - benefitsBalanceTotal
  }, [bankBalanceTotal, benefitsBalanceTotal, includeBenefitsInOverview])

  const overviewEvolutionTotal = useMemo(() => {
    return overviewBankBalanceTotal + creditUsedTotal
  }, [creditUsedTotal, overviewBankBalanceTotal])

  const overviewEvolutionData = useMemo(() => {
    if (includeBenefitsInOverview) return evolutionData

    return evolutionData.map((point) => ({
      ...point,
      value: Number(((Number(point?.value) || 0) - benefitsBalanceTotal).toFixed(2)),
    }))
  }, [benefitsBalanceTotal, evolutionData, includeBenefitsInOverview])

  const benefitAccountIds = useMemo(() => {
    return new Set(
      sortedBankAccounts
        .filter((account) => isBenefitsCategory(account))
        .map((account) => String(account?.id || ''))
        .filter(Boolean),
    )
  }, [isBenefitsCategory, sortedBankAccounts])

  const flowGroupedTransactionsForView = useMemo(() => {
    if (includeBenefitsInFlow) return flowGroupedTransactions

    return flowGroupedTransactions
      .map((group) => ({
        ...group,
        entries: group.entries.filter((transaction) => {
          const accountId = String(transaction?.accountId || transaction?.account?.id || '')
          if (benefitAccountIds.has(accountId)) return false

          if (isBenefitsCategory(transaction?.account)) return false

          const accountMeta = accountMetadataById.get(transaction?.accountId || transaction?.account?.id || null)
          if (isBenefitsCategory(accountMeta)) return false

          return true
        }),
      }))
      .filter((group) => group.entries.length > 0)
  }, [accountMetadataById, benefitAccountIds, flowGroupedTransactions, includeBenefitsInFlow, isBenefitsCategory])

  const flowMonthlyIncomeForView = useMemo(() => {
    return flowGroupedTransactionsForView.reduce((sum, group) => {
      return sum + group.entries.reduce((groupSum, transaction) => {
        if (transaction?.isTransfer) return groupSum
        const amount = getNormalizedAmount(transaction)
        return amount > 0 ? groupSum + amount : groupSum
      }, 0)
    }, 0)
  }, [flowGroupedTransactionsForView, getNormalizedAmount])

  const flowMonthlyExpensesForView = useMemo(() => {
    return Math.abs(flowGroupedTransactionsForView.reduce((sum, group) => {
      return sum + group.entries.reduce((groupSum, transaction) => {
        if (transaction?.isTransfer) return groupSum
        const amount = getNormalizedAmount(transaction)
        return amount < 0 ? groupSum + amount : groupSum
      }, 0)
    }, 0))
  }, [flowGroupedTransactionsForView, getNormalizedAmount])

  const flowBankBalanceTotalForView = useMemo(() => {
    if (includeBenefitsInFlow) return bankBalanceTotal
    return bankBalanceTotal - benefitsBalanceTotal
  }, [bankBalanceTotal, benefitsBalanceTotal, includeBenefitsInFlow])

  const flowProjectedBankBalanceTotal = useMemo(() => {
    return bankBalanceTotal - benefitsBalanceTotal
  }, [bankBalanceTotal, benefitsBalanceTotal])

  const flowAccountMetadataByIdForView = useMemo(() => {
    if (includeBenefitsInFlow) return accountMetadataById

    return new Map(
      Array.from(accountMetadataById.entries()).filter(([, account]) => !isBenefitsCategory(account)),
    )
  }, [accountMetadataById, includeBenefitsInFlow, isBenefitsCategory])

  const flowFinancialHealth = useMemo(() => {
    return calculateFinancialHealthFromFinancialAccounts({
      flowGroupedTransactions,
      accountMetadataById,
      getNormalizedAmount,
      sortedCreditAccounts,
      investmentsTotal,
    })
  }, [accountMetadataById, flowGroupedTransactions, getNormalizedAmount, sortedCreditAccounts, investmentsTotal])

  const hasLoadError = !loading && Boolean(error)
  const hasAnyDashboardData =
    sortedBankAccounts.length > 0 ||
    sortedCreditAccounts.length > 0 ||
    investments.length > 0 ||
    transactions.length > 0
  const shouldShowDashboardUnavailable = hasLoadError && !hasAnyDashboardData
  const shouldLockDashboardView = shouldShowDashboardUnavailable && !isSettingsView && !isHomeView

  const topCardTitleClass = isLightMode
    ? 'text-xs font-semibold uppercase tracking-wider text-zinc-600'
    : 'text-xs font-semibold uppercase tracking-wider text-zinc-500'

  const primaryTextClass = isLightMode ? 'text-[#080a0f]' : 'text-[#e9f0ff]'
  const secondaryTextClass = isLightMode ? 'text-zinc-600' : 'text-zinc-500'
  const cardPrimaryDividerClass = isLightMode ? 'border-zinc-300/45' : 'border-zinc-700/45'
  const cardSubtleDividerClass = isLightMode ? 'border-zinc-300/45' : 'border-zinc-700/45'
  const navActiveClass = isLightMode
    ? 'rounded-lg bg-[rgba(31,103,255,0.85)] px-2 py-1 text-xs font-semibold text-white md:px-2.5 md:text-[14px]'
    : 'rounded-lg bg-[rgba(31,103,255,0.85)] px-2 py-1 text-xs font-semibold text-[#e9f0ff] md:px-2.5 md:text-[14px]'
  const navInactiveClass = isLightMode
    ? 'rounded-lg px-2 py-1 text-xs text-zinc-600 transition hover:bg-[rgba(31,103,255,0.75)] hover:text-white md:px-2.5 md:text-sm'
    : 'rounded-lg px-2 py-1 text-xs text-zinc-400 transition hover:bg-[rgba(31,103,255,0.75)] hover:text-white md:px-2.5 md:text-sm'
  const headerControlBaseClass = isLightMode
    ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white px-2 text-xs font-medium text-zinc-800 transition hover:bg-[rgba(31,103,255,0.75)] hover:text-white md:w-auto md:px-2.5'
    : 'inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900/70 px-2 text-xs font-medium text-[#e9f0ff] transition hover:bg-[rgba(31,103,255,0.75)] hover:text-white md:w-auto md:px-2.5'
  const themeToggleClass = `${headerControlBaseClass} gap-1.5`
  const languageWrapperClass = `${headerControlBaseClass} gap-1.5`
  const refreshButtonClass = headerControlBaseClass
  const profileButtonClass = isLightMode
    ? 'inline-flex h-8 items-center gap-2 rounded-lg bg-white px-2.5 text-xs font-medium text-zinc-800 transition hover:bg-[rgba(31,103,255,0.75)] hover:text-white'
    : 'inline-flex h-8 items-center gap-2 rounded-lg bg-zinc-900/70 px-2.5 text-xs font-medium text-[#e9f0ff] transition hover:bg-[rgba(31,103,255,0.75)] hover:text-white'
  const investmentToggleWrapperClass = isLightMode
    ? 'inline-flex items-center rounded-lg bg-white p-0.5'
    : 'inline-flex items-center rounded-lg bg-zinc-900/70 p-0.5'
  const investmentToggleInactiveClass = isLightMode ? 'text-zinc-600' : 'text-zinc-400'
  const investmentBarTrackClass = isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'
  const investmentBarFillClass = 'bg-[#60a5fa]'

  const glassCardClass = isLightMode
    ? 'card-interactive rounded-xl border border-[rgba(8,10,15,0.08)] bg-[rgba(233,240,255,0.10)] backdrop-blur-[8px] hover:-translate-y-0.5'
    : 'card-interactive rounded-xl border border-[rgba(233,240,255,0.20)] bg-[rgba(8,10,15,0.10)] backdrop-blur-[8px] hover:-translate-y-0.5'

  const headerGlassClass = isLightMode
    ? 'fixed left-0 right-0 top-0 z-50 border border-[rgba(8,10,15,0.08)] bg-[rgba(233,240,255,0.10)] backdrop-blur-[8px]'
    : 'fixed left-0 right-0 top-0 z-50 border border-[rgba(233,240,255,0.20)] bg-[rgba(8,10,15,0.10)] shadow-[0_6px_24px_rgba(0,0,0,0.35)] backdrop-blur-[8px]'

  const categoryChartColors = useMemo(
    () => [
      '#f472b6', // pink-400
      '#a78bfa', // violet-400
      '#818cf8', // indigo-400
      '#fb7185', // rose-400
      '#22d3ee', // cyan-400
      '#fbbf24', // amber-400
      '#34d399', // emerald-400
      '#60a5fa', // blue-400
      '#2dd4bf', // teal-400
      '#fb923c', // orange-400
      '#a3e635', // lime-400
      '#e879f9', // fuchsia-400
    ],
    [],
  )

  const handleGoToFlow = () => {
    navigate('/flow')
  }

  const pageTitle = isFlowView
    ? text.flowTitle
    : isAssetsView
      ? text.assetsTitle
      : isSettingsView
        ? text.connectionsTitle
        : text.overview
  const pageSubtitle = isFlowView
    ? text.flowSubtitle
    : isAssetsView
      ? text.assetsSubtitle
      : isSettingsView
        ? text.connectionsSubtitle
        : text.subtitle
  const hasBenefitsAccounts = useMemo(() => {
    return sortedBankAccounts.some((account) => isBenefitsCategory(account))
  }, [isBenefitsCategory, sortedBankAccounts])

  const showPageHeader = !isHomeView && !shouldLockDashboardView
  const showBenefitsToggle = (isOverviewView || isFlowView) && hasBenefitsAccounts
  const includeBenefitsLabel = language === 'pt' ? 'Incluir Beneficios' : 'Include Benefits'
  const includeBenefitsEnabled = isOverviewView ? includeBenefitsInOverview : includeBenefitsInFlow
  const toggleBenefits = () => {
    if (isOverviewView) {
      setIncludeBenefitsInOverview((current) => !current)
      return
    }

    if (isFlowView) {
      setIncludeBenefitsInFlow((current) => !current)
    }
  }

  return (
    <main
      className={`relative min-h-screen overflow-hidden ${isLightMode ? 'bg-[#E9F0FF] text-[#080a0f]' : 'bg-[#080A0F] text-[#e9f0ff]'}`}
      style={{ '--background-50': isLightMode ? 'rgba(233,240,255,0.5)' : 'rgba(8,10,15,0.5)' }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-repeat opacity-5"
        style={{ backgroundImage: `url(${noiseTexture})` }}
      />
      <DashboardHeader
        headerGlassClass={headerGlassClass}
        isLightMode={isLightMode}
        text={text}
        navActiveClass={navActiveClass}
        navInactiveClass={navInactiveClass}
        navigate={navigate}
        isHomeView={isHomeView}
        isOverviewView={isOverviewView}
        isFlowView={isFlowView}
        isAssetsView={isAssetsView}
        themeToggleClass={themeToggleClass}
        setTheme={setTheme}
        languageWrapperClass={languageWrapperClass}
        language={language}
        setLanguage={setLanguage}
        refreshButtonClass={refreshButtonClass}
        loadDashboard={loadDashboard}
        profileButtonClass={profileButtonClass}
      />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:pb-10">
        <div className="flex-1">
          {showPageHeader && (
            <header className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h1 className={`font-display text-2xl font-bold tracking-tight ${isLightMode ? 'text-[#080a0f]' : 'text-white'}`}>{pageTitle}</h1>
                <p className={`mt-1 text-sm ${isLightMode ? 'text-zinc-600' : 'text-white/40'}`}>{pageSubtitle}</p>
              </div>

              {showBenefitsToggle && (
                <button
                  type="button"
                  onClick={toggleBenefits}
                  className={`inline-flex h-8 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition ${
                    includeBenefitsEnabled
                      ? 'border-[#1f67ff] bg-[rgba(31,103,255,0.15)] text-[#60a5fa]'
                      : isLightMode
                        ? 'border-zinc-300 bg-white text-zinc-700 hover:border-[#1f67ff] hover:text-[#1f67ff]'
                        : 'border-zinc-700 bg-zinc-900/70 text-zinc-300 hover:border-[#1f67ff] hover:text-[#60a5fa]'
                  }`}
                  aria-pressed={includeBenefitsEnabled}
                >
                  <span>{includeBenefitsLabel}</span>
                  <span className={`rounded-md px-1.5 py-0.5 text-[10px] leading-none ${includeBenefitsEnabled ? 'bg-[#1f67ff] text-white' : isLightMode ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-800 text-zinc-300'}`}>
                    {includeBenefitsEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
              )}
            </header>
          )}

          {!isHomeView && loading && (
            <div className="mx-auto w-full max-w-2xl pt-8 flex justify-center items-center min-h-[300px]">
              <div className={`${glassCardClass} border-blue-500/30 bg-blue-500/10 p-7 text-center ${isLightMode ? 'text-[#080a0f]' : 'text-blue-100'} flex items-center justify-center`}>
                <p className="text-lg font-semibold mr-4">{text.loadingDashboard}</p>
                <div className="animate-spin rounded-full border-4 border-blue-400 border-t-transparent h-10 w-10" />
              </div>
            </div>
          )}

          {shouldShowDashboardUnavailable && !isSettingsView && !isHomeView && (
            <div className="mx-auto w-full max-w-2xl pt-8">
              <div className={`${glassCardClass} border-rose-500/30 bg-rose-500/10 p-7 text-center text-rose-100`}>
                <p className="text-lg font-semibold">{text.dashboardUnavailable}</p>
                <p className="mt-2 text-sm text-rose-200/90">{text.dashboardUnavailableInstruction}</p>
                <Link
                  to="/settings"
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-white/90 px-5 text-sm font-semibold text-rose-900 transition hover:bg-white"
                >
                  {text.homePrimaryCta}
                </Link>
              </div>
            </div>
          )}

          {!shouldLockDashboardView && (isHomeView || !loading) && (
            <div className="w-full">
              <Routes>
                <Route
                  path="/"
                  element={<HomePage isLightMode={isLightMode} text={text} />}
                />
                <Route
                  path="/overview"
                  element={
                    <OverviewPage
                      glassCardClass={glassCardClass}
                      language={language}
                      topCardTitleClass={topCardTitleClass}
                      primaryTextClass={primaryTextClass}
                      secondaryTextClass={secondaryTextClass}
                      cardPrimaryDividerClass={cardPrimaryDividerClass}
                      cardSubtleDividerClass={cardSubtleDividerClass}
                      investmentToggleWrapperClass={investmentToggleWrapperClass}
                      investmentToggleInactiveClass={investmentToggleInactiveClass}
                      investmentBarTrackClass={investmentBarTrackClass}
                      investmentBarFillClass={investmentBarFillClass}
                      isLightMode={isLightMode}
                      includeBenefits={includeBenefitsInOverview}
                      text={text}
                      bankBalanceTotal={overviewBankBalanceTotal}
                      sortedBankAccounts={sortedBankAccounts}
                      formatMoney={formatMoney}
                      creditUsedTotal={creditUsedTotal}
                      creditUsage={creditUsage}
                      creditLimitTotal={creditLimitTotal}
                      sortedCreditAccounts={sortedCreditAccounts}
                      formatCardName={formatCardName}
                      investmentsTotal={investmentsTotal}
                      investmentView={investmentView}
                      setInvestmentView={setInvestmentView}
                      investmentClassesCount={investmentClassesCount}
                      investments={investments}
                      institutionInvestments={institutionInvestments}
                      isEvolutionCollapsed={isEvolutionCollapsed}
                      setIsEvolutionCollapsed={setIsEvolutionCollapsed}
                      evolutionTotal={overviewEvolutionTotal}
                      evolutionData={overviewEvolutionData}
                      spendingByCategoryData={spendingByCategoryData}
                      categoryChartColors={categoryChartColors}
                      recentTransactions={recentTransactions}
                      handleGoToFlow={handleGoToFlow}
                      getNormalizedAmount={getNormalizedAmount}
                      accountMetadataById={accountMetadataById}
                      truncateText={truncateText}
                      formatTransactionDate={formatTransactionDate}
                      monthlyIncome={monthlyIncome}
                      monthlyExpenses={monthlyExpenses}
                      cashFlowBarWidth={cashFlowBarWidth}
                      cashFlowExpenseToIncomePct={cashFlowExpenseToIncomePct}
                      upcomingBills={upcomingBills}
                    />
                  }
                />
                <Route
                  path="/flow"
                  element={
                    <FlowPage
                      glassCardClass={glassCardClass}
                      cardSubtleDividerClass={cardSubtleDividerClass}
                      isLightMode={isLightMode}
                      language={language}
                      primaryTextClass={primaryTextClass}
                      secondaryTextClass={secondaryTextClass}
                      flowMonthLabel={flowMonthLabel}
                      monthlyIncome={flowMonthlyIncomeForView}
                      monthlyExpenses={flowMonthlyExpensesForView}
                      canGoToPreviousFlowMonth={canGoToPreviousFlowMonth}
                      canGoToNextFlowMonth={canGoToNextFlowMonth}
                      goToPreviousFlowMonth={goToPreviousFlowMonth}
                      goToNextFlowMonth={goToNextFlowMonth}
                      formatMoney={formatMoney}
                      text={text}
                      flowGroupedTransactions={flowGroupedTransactionsForView}
                      getNormalizedAmount={getNormalizedAmount}
                      accountMetadataById={flowAccountMetadataByIdForView}
                      bankBalanceTotal={flowBankBalanceTotalForView}
                      projectedBankBalanceTotal={flowProjectedBankBalanceTotal}
                      categoryChartColors={categoryChartColors}
                      creditUsedTotal={creditUsedTotal}
                      creditLimitTotal={creditLimitTotal}
                      financialHealth={flowFinancialHealth}
                      investmentsTotal={investmentsTotal}
                    />
                  }
                />
                <Route
                  path="/assets"
                  element={
                    <AssetsPage
                      glassCardClass={glassCardClass}
                      topCardTitleClass={topCardTitleClass}
                      primaryTextClass={primaryTextClass}
                      secondaryTextClass={secondaryTextClass}
                      cardSubtleDividerClass={cardSubtleDividerClass}
                      text={text}
                      investments={investments}
                      investmentsTotal={investmentsTotal}
                      formatMoney={formatMoney}
                      isLightMode={isLightMode}
                    />
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <SettingsPage
                      glassCardClass={glassCardClass}
                      cardSubtleDividerClass={cardSubtleDividerClass}
                      isLightMode={isLightMode}
                      primaryTextClass={primaryTextClass}
                      secondaryTextClass={secondaryTextClass}
                      language={language}
                      text={text}
                      bankAccounts={sortedBankAccounts}
                      creditAccounts={sortedCreditAccounts}
                      investments={investments}
                      transactions={transactions}
                      getNormalizedAmount={getNormalizedAmount}
                      onCredentialsSaved={loadDashboard}
                    />
                  }
                />
                <Route path="/connections" element={<Navigate to="/settings" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          )}
        </div>

        <DashboardFooter
          isLightMode={isLightMode}
          secondaryTextClass={secondaryTextClass}
          text={text}
          lastSyncedText={lastSyncedText}
        />
      </section>
    </main>
  )
}

export default Dashboard
