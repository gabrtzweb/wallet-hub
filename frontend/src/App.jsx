import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import DashboardFooter from './components/DashboardFooter'
import DashboardHeader from './components/DashboardHeader'
import { COPY, getBankLogo } from './config/dashboardConfig'
import useDashboardData from './hooks/useDashboardData'
import AssetsPage from './pages/AssetsPage'
import ConnectionsPage from './pages/ConnectionsPage'
import FlowPage from './pages/FlowPage'
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

    let dynamicTitle = 'Wallet Hub - Dashboard'
    let dynamicDescription = text.subtitle

    if (path === '/flow') {
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
    cashFlowBarWidth,
    cashFlowExpenseToIncomePct,
    upcomingBills,
    formatCardName,
    flowMonthLabel,
    flowGroupedTransactions,
    lastSyncedText,
  } = useDashboardData({ language, text })

  const topCardTitleClass = isLightMode
    ? 'text-xs font-semibold uppercase tracking-wider text-zinc-600'
    : 'text-xs font-semibold uppercase tracking-wider text-zinc-500'

  const primaryTextClass = isLightMode ? 'text-[#080a0f]' : 'text-[#e9f0ff]'
  const secondaryTextClass = isLightMode ? 'text-zinc-600' : 'text-zinc-500'
  const cardPrimaryDividerClass = isLightMode ? 'border-zinc-400/90' : 'border-zinc-500/90'
  const cardSubtleDividerClass = isLightMode ? 'border-zinc-300/45' : 'border-zinc-700/45'
  const navActiveClass = isLightMode
    ? 'rounded-lg bg-[rgba(31,103,255,0.85)] px-2 py-1 text-xs font-semibold text-white md:px-2.5 md:text-[15px]'
    : 'rounded-lg bg-[rgba(31,103,255,0.85)] px-2 py-1 text-xs font-semibold text-[#e9f0ff] md:px-2.5 md:text-[15px]'
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
  const investmentBarFillClass = isLightMode ? 'bg-zinc-400' : 'bg-zinc-600'

  const glassCardClass = isLightMode
    ? 'rounded-xl border border-[rgba(8,10,15,0.08)] bg-[rgba(255,255,255,0.72)] backdrop-blur-[8px]'
    : 'rounded-xl border border-[rgba(8,10,15,0.10)] bg-[rgba(233,240,255,0.10)] backdrop-blur-[8px]'

  const headerGlassClass = isLightMode
    ? 'fixed left-0 right-0 top-0 z-50 border border-[rgba(8,10,15,0.08)] bg-[rgba(255,255,255,0.72)] backdrop-blur-[8px]'
    : 'fixed left-0 right-0 top-0 z-50 border border-[rgba(8,10,15,0.10)] bg-[rgba(233,240,255,0.10)] backdrop-blur-[8px]'

  const categoryChartColors = useMemo(
    () => (isLightMode
      ? ['#1f67ff', '#22c55e', '#f87171', '#64748b', '#94a3b8']
      : ['#1f67ff', '#22c55e', '#f87171', '#94a3b8', '#64748b']),
    [isLightMode],
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
  const showPageHeader = !isConnectionsView

  return (
    <main className={`relative min-h-screen overflow-hidden ${isLightMode ? 'bg-[#E9F0FF] text-[#080a0f]' : 'bg-[#080A0F] text-[#e9f0ff]'}`}>
      <DashboardHeader
        headerGlassClass={headerGlassClass}
        isLightMode={isLightMode}
        text={text}
        navActiveClass={navActiveClass}
        navInactiveClass={navInactiveClass}
        navigate={navigate}
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
            <div className="w-full">
              <Routes>
                <Route
                  path="/"
                  element={
                    <OverviewPage
                      glassCardClass={glassCardClass}
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
                      primaryTextClass={primaryTextClass}
                      secondaryTextClass={secondaryTextClass}
                      flowMonthLabel={flowMonthLabel}
                      monthlyIncome={monthlyIncome}
                      monthlyExpenses={monthlyExpenses}
                      formatMoney={formatMoney}
                      text={text}
                      flowGroupedTransactions={flowGroupedTransactions}
                      getNormalizedAmount={getNormalizedAmount}
                      accountMetadataById={accountMetadataById}
                      getBankLogo={getBankLogo}
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
