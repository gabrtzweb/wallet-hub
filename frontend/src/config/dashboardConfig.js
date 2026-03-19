import interLogo from '../assets/bank-inter.webp'
import nubankLogo from '../assets/bank-nubank.webp'

export const API_BASE = 'http://localhost:3000/api'
export const APP_VERSION = 'Wallet Hub v1.1.0'
export const DEV_SIGNATURE = 'Flamma Digital'

export const DASHBOARD_ITEMS = {
  '115ae3ff-be4b-4330-8278-7de1d99e3a7b': 'Inter',
  '481ff23b-9bf0-4618-8c94-f046a27fbbc9': 'Nubank',
}

export const BANK_BRANDING = {
  '115ae3ff-be4b-4330-8278-7de1d99e3a7b': {
    name: 'Inter',
    logo: interLogo,
  },
  '481ff23b-9bf0-4618-8c94-f046a27fbbc9': {
    name: 'Nubank',
    logo: nubankLogo,
  },
}

export const COPY = {
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
    flowTitle: 'Cash Flow',
    flowSubtitle: 'Expenses, income and account transactions.',
    assetsTitle: 'Assets',
    assetsSubtitle: 'Your investments and movements.',
    connectionsTitle: 'Data Passport',
    connectionsSubtitle: 'Connect, view, and manage your financial connections.',
    connectionsDataPassportTitle: 'Data Passport',
    connectionsDataPassportSubtitle: 'Connect, view, and manage your financial connections.',
    connectionsNewConnection: 'New connection',
    connectionsActiveLabel: 'active',
    connectionsSyncedToday: 'Today',
    connectionsSyncedYesterday: '1 day ago',
    connectionsSyncedDaysAgo: '{days} days ago',
    connectionsSeeDetails: 'See details',
    connectionsPartnerApps: 'Partner Apps',
    connectionsNoPartnerApps: 'No partner app is accessing your data.',
    connectionsNoConnections: 'No active connections found.',
    connectionsBankLabel: 'Bank',
    connectionsBack: 'Connections',
    connectionsUpdate: 'Update',
    connectionsDelete: 'Delete',
    connectionsMovements: 'movements',
    connectionsSyncLabel: 'Synchronized',
    connectionsAutoUpdateLabel: 'Auto-updates automatically',
    connectionsManualLabel: 'Manual',
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
    monthlyCashFlow: 'Monthly Cash Flow',
    recentTransactions: 'Recent Transactions',
    spendingByCategory: 'Spending by Category',
    upcomingBills: 'Upcoming Bills',
    incomeLabel: 'Income',
    expensesLabel: 'Expenses',
    noTransactions: 'No transactions available.',
    noCategoryData: 'No category data for this month.',
    noUpcomingBills: 'No credit card bills available.',
    uncategorized: 'Uncategorized',
    othersCategory: 'Others',
    usedLabel: 'Used',
    ofIncomeSpent: 'of income spent',
    dueInLabel: 'Due on',
    dayLabel: 'day',
    showAll: 'Show all',
    assetsPortfolioLabel: 'Portfolio',
    assetsValueLabel: 'Current value',
    assetsFixedIncomeLabel: 'FIXED INCOME',
    assetsUnknownType: 'Unknown type',
    assetsMovementsLabel: 'Movements',
    assetsBuyLabel: 'BUY',
    assetsBalanceLabel: 'Balance',
    assetsProfitabilityLabel: 'Profitability',
    assetsInvestedValueLabel: 'Invested value',
    assetsNotAvailable: 'N/A',
    noAssetsData: 'No investment assets available.',
    allAccounts: 'All accounts',
    searchTransactionPlaceholder: 'Search transaction...',
    allFilter: 'All',
    incomesFilter: 'Income',
    expensesFilter: 'Expenses',
    transactionCount: 'transactions',
    balanceLabel: 'Balance',
    balanceDifferenceLabel: 'Difference Balance',
    balanceIncomeLabel: 'Income Balance',
    balanceExpenseLabel: 'Expense Balance',
    openingBalanceLabel: 'Opening Balance',
    appVersion: APP_VERSION,
    developedByLabel: 'developed by',
    developerSignature: DEV_SIGNATURE,
    apiOperationalStatus: 'API operational',
    lastSyncedLabel: 'Last synced',
    notSyncedYet: 'just now',
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
    flowTitle: 'Fluxo de Caixa',
    flowSubtitle: 'Despesas, receitas e movimentações das suas contas.',
    assetsTitle: 'Ativos de Investimento',
    assetsSubtitle: 'Seus investimentos e movimentações.',
    connectionsTitle: 'Passaporte de Dados',
    connectionsSubtitle: 'Conecte, visualize e gerencie suas conexões financeiras.',
    connectionsDataPassportTitle: 'Passaporte de Dados',
    connectionsDataPassportSubtitle: 'Conecte, visualize e gerencie suas conexões financeiras.',
    connectionsNewConnection: 'Nova conexão',
    connectionsActiveLabel: 'ativas',
    connectionsSyncedToday: 'Hoje',
    connectionsSyncedYesterday: '1 dia atrás',
    connectionsSyncedDaysAgo: '{days} dias atrás',
    connectionsSeeDetails: 'Ver detalhes',
    connectionsPartnerApps: 'Apps parceiros',
    connectionsNoPartnerApps: 'Nenhum app parceiro está acessando seus dados.',
    connectionsNoConnections: 'Nenhuma conexão ativa encontrada.',
    connectionsBankLabel: 'Banco',
    connectionsBack: 'Conexões',
    connectionsUpdate: 'Atualizar',
    connectionsDelete: 'Excluir',
    connectionsMovements: 'movimentações',
    connectionsSyncLabel: 'Sincronizado',
    connectionsAutoUpdateLabel: 'Atualiza automaticamente',
    connectionsManualLabel: 'Manual',
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
    monthlyCashFlow: 'Fluxo mensal',
    recentTransactions: 'Últimas transações',
    spendingByCategory: 'Gastos por categoria',
    upcomingBills: 'Próximos vencimentos',
    incomeLabel: 'Entradas',
    expensesLabel: 'Saídas',
    noTransactions: 'Sem transações disponíveis.',
    noCategoryData: 'Sem dados de categoria neste mês.',
    noUpcomingBills: 'Sem faturas de cartão disponíveis.',
    uncategorized: 'Sem categoria',
    othersCategory: 'Outros',
    usedLabel: 'Utilizado',
    ofIncomeSpent: 'da renda gasta',
    dueInLabel: 'Vence em',
    dayLabel: 'dia',
    showAll: 'Ver tudo',
    assetsPortfolioLabel: 'Carteira',
    assetsValueLabel: 'Valor atual',
    assetsFixedIncomeLabel: 'RENDA FIXA',
    assetsUnknownType: 'Tipo desconhecido',
    assetsMovementsLabel: 'Movimentações',
    assetsBuyLabel: 'COMPRA',
    assetsBalanceLabel: 'Saldo',
    assetsProfitabilityLabel: 'Rentabilidade',
    assetsInvestedValueLabel: 'Valor investido',
    assetsNotAvailable: 'N/D',
    noAssetsData: 'Sem ativos de investimentos disponíveis.',
    allAccounts: 'Todas contas',
    searchTransactionPlaceholder: 'Buscar transação...',
    allFilter: 'Todos',
    incomesFilter: 'Entradas',
    expensesFilter: 'Saídas',
    transactionCount: 'transações',
    balanceLabel: 'Saldo',
    balanceDifferenceLabel: 'Saldo de diferença',
    balanceIncomeLabel: 'Saldo de entradas',
    balanceExpenseLabel: 'Saldo de saídas',
    openingBalanceLabel: 'Saldo de Abertura',
    appVersion: APP_VERSION,
    developedByLabel: 'desenvolvido por',
    developerSignature: DEV_SIGNATURE,
    apiOperationalStatus: 'API operacional',
    lastSyncedLabel: 'Última sincronização',
    notSyncedYet: 'agora mesmo',
  },
}

export const getArrayResults = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.results)) return payload.results
  return []
}

export const getCreditLimit = (account) =>
  account?.creditData?.creditLimit ??
  account?.creditData?.limit ??
  account?.creditLimit ??
  account?.credit?.limit ??
  0

export const getInvestmentValue = (investment) =>
  Number(investment?.balance) || Number(investment?.amount) || Number(investment?.value) || 0

export const getInstitutionName = (entry) => {
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

export const getBankLogo = (entry) => BANK_BRANDING[entry?.itemId]?.logo || null

export const getFriendlyAccountLabel = (account, language = 'pt', fallbackLabel = 'Unknown account') => {
  if (!account) return fallbackLabel

  const institutionName = getInstitutionName(account)
  const accountType = String(account?.type || account?.accountType || 'BANK').toUpperCase()
  const isCreditAccount = accountType === 'CREDIT'

  const typeLabel = language === 'pt'
    ? (isCreditAccount ? 'Cartão de Crédito' : 'Conta Corrente')
    : (isCreditAccount ? 'Credit Card' : 'Checking Account')

  return `${institutionName} (${typeLabel})`
}
