import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import DashboardFooter from './components/DashboardFooter'
import DashboardHeader from './components/DashboardHeader'
import noiseTexture from './assets/noise.png'
import { COPY, getBankLogo } from './config/dashboardConfig'
import useDashboardData from './hooks/useDashboardData'
import AssetsPage from './pages/AssetsPage'
import ConnectionsPage from './pages/ConnectionsPage'
import FlowPage from './pages/FlowPage'
import HomePage from './pages/HomePage'
import OverviewPage from './pages/OverviewPage'

function Dashboard() {
  const [theme, setTheme] = useState(() => localStorage.getItem('wallet-hub-theme') || 'dark')
  const [language, setLanguage] = useState('pt')

  const navigate = useNavigate()
  const location = useLocation()
  const text = COPY[language]

  useEffect(() => {
    localStorage.setItem('wallet-hub-theme', theme)
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
    } else if (path === '/connections') {
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
  const isConnectionsView = location.pathname === '/connections'

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
    evolutionTotal,
    evolutionData,
    spendingByCategoryData,
    recentTransactions,
    getNormalizedAmount,
    accountMetadataById,
    truncateText,
    formatTransactionDate,
    monthlyIncome,
    monthlyExpenses,
    flowMonthlyIncome,
    flowMonthlyExpenses,
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

  const hasLoadError = !loading && Boolean(error)
  const shouldLockDashboardView = hasLoadError && !isConnectionsView && !isHomeView

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
  const refreshButtonClass = isLightMode
    ? 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#1f67ff] bg-[#1f67ff] px-2 text-xs font-semibold text-white transition hover:brightness-95 md:w-auto md:px-3'
    : 'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#1f67ff] bg-[#1f67ff] px-2 text-xs font-semibold text-white transition hover:brightness-110 md:w-auto md:px-3'
  const investmentToggleWrapperClass = isLightMode
    ? 'inline-flex items-center rounded-lg bg-white p-0.5'
    : 'inline-flex items-center rounded-lg bg-zinc-900/70 p-0.5'
  const investmentToggleInactiveClass = isLightMode ? 'text-zinc-600' : 'text-zinc-400'
  const investmentBarTrackClass = isLightMode ? 'bg-zinc-200' : 'bg-zinc-800'
  const investmentBarFillClass = 'bg-[#60a5fa]'

  const glassCardClass = isLightMode
    ? 'rounded-xl border border-[rgba(8,10,15,0.08)] bg-[rgba(233,240,255,0.10)] backdrop-blur-[8px]'
    : 'rounded-xl border border-[rgba(233,240,255,0.20)] bg-[rgba(8,10,15,0.10)] shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-[8px]'

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
      : isConnectionsView
        ? text.connectionsTitle
        : text.overview
  const pageSubtitle = isFlowView
    ? text.flowSubtitle
    : isAssetsView
      ? text.assetsSubtitle
      : isConnectionsView
        ? text.connectionsSubtitle
        : text.subtitle
  const showPageHeader = !isHomeView && !shouldLockDashboardView

  return (
    <main className={`relative min-h-screen overflow-hidden ${isLightMode ? 'bg-[#E9F0FF] text-[#080a0f]' : 'bg-[#080A0F] text-[#e9f0ff]'}`}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-repeat opacity-10"
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
        isConnectionsView={isConnectionsView}
        themeToggleClass={themeToggleClass}
        setTheme={setTheme}
        languageWrapperClass={languageWrapperClass}
        language={language}
        setLanguage={setLanguage}
        refreshButtonClass={refreshButtonClass}
        loadDashboard={loadDashboard}
      />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-8 pt-24 md:pb-10">
        <div className="flex-1">
          {showPageHeader && (
            <header className="mb-5">
              <h1 className={`font-display text-2xl font-bold tracking-tight ${isLightMode ? 'text-[#080a0f]' : 'text-white'}`}>{pageTitle}</h1>
              <p className={`mt-1 text-sm ${isLightMode ? 'text-zinc-600' : 'text-white/40'}`}>{pageSubtitle}</p>
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

          {hasLoadError && !isConnectionsView && !isHomeView && (
            <div className="mx-auto w-full max-w-2xl pt-8">
              <div className={`${glassCardClass} border-rose-500/30 bg-rose-500/10 p-7 text-center text-rose-100`}>
                <p className="text-lg font-semibold">{text.dashboardUnavailable}</p>
                <p className="mt-2 text-sm text-rose-200/90">{text.dashboardUnavailableInstruction}</p>
                <Link
                  to="/connections"
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
                      text={text}
                      bankBalanceTotal={bankBalanceTotal}
                      sortedBankAccounts={sortedBankAccounts}
                      getBankLogo={getBankLogo}
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
                      evolutionTotal={evolutionTotal}
                      evolutionData={evolutionData}
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
                      monthlyIncome={flowMonthlyIncome}
                      monthlyExpenses={flowMonthlyExpenses}
                      canGoToPreviousFlowMonth={canGoToPreviousFlowMonth}
                      canGoToNextFlowMonth={canGoToNextFlowMonth}
                      goToPreviousFlowMonth={goToPreviousFlowMonth}
                      goToNextFlowMonth={goToNextFlowMonth}
                      formatMoney={formatMoney}
                      text={text}
                      flowGroupedTransactions={flowGroupedTransactions}
                      getNormalizedAmount={getNormalizedAmount}
                      accountMetadataById={accountMetadataById}
                      getBankLogo={getBankLogo}
                      bankBalanceTotal={bankBalanceTotal}
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
                      getBankLogo={getBankLogo}
                      isLightMode={isLightMode}
                    />
                  }
                />
                <Route
                  path="/connections"
                  element={
                    <ConnectionsPage
                      glassCardClass={glassCardClass}
                      cardSubtleDividerClass={cardSubtleDividerClass}
                      isLightMode={isLightMode}
                      primaryTextClass={primaryTextClass}
                      secondaryTextClass={secondaryTextClass}
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
