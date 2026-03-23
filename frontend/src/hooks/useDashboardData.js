import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  API_BASE,
  DASHBOARD_ITEMS,
  getArrayResults,
  getBankLogo,
  getCreditLimit,
  getInstitutionName,
  getInvestmentValue,
} from '../config/dashboardConfig'
import { getStoredManualConnections, getStoredManualWalletTransactions, toPhysicalWalletAccount, isManualWalletConnection } from '../utils/manualConnections'
import { getPluggyRequestHeaders } from '../utils/pluggyCredentials'

function useDashboardData({ language, text }) {
  const [bankAccounts, setBankAccounts] = useState([])
  const [creditAccounts, setCreditAccounts] = useState([])
  const [investments, setInvestments] = useState([])
  const [transactions, setTransactions] = useState([])
  const [balanceEvolution, setBalanceEvolution] = useState([])
  const [investmentView, setInvestmentView] = useState('classes')
  const [isEvolutionCollapsed, setIsEvolutionCollapsed] = useState(false)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedFlowMonth, setSelectedFlowMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })

  const brlFormatter = useMemo(
    () =>
      new Intl.NumberFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
        style: 'currency',
        currency: 'BRL',
      }),
    [language],
  )

  const formatMoney = useCallback((value) => {
    const formatted = brlFormatter.format(typeof value === 'number' ? value : 0)
    if (language === 'en') {
      return formatted.replace(/^R\$(?!\s)/, 'R$ ')
    }
    return formatted
  }, [brlFormatter, language])

  const loadDashboard = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/dashboard-data`, {
        headers: {
          ...getPluggyRequestHeaders(),
        },
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        const firstFailure = getArrayResults(payload?.failedItems)[0]
        const detailedReason = firstFailure?.message ? ` (${firstFailure.message})` : ''
        throw new Error((payload?.error || text.loadDashboardError) + detailedReason)
      }

      const payload = await response.json()

      const manualConnections = getStoredManualConnections()
      const manualWalletAccounts = manualConnections.map((connection) => toPhysicalWalletAccount(connection))
      const manualWalletTransactions = manualConnections.flatMap((connection) =>
        getStoredManualWalletTransactions(connection.id, text, connection),
      )

      const apiBankAccounts = getArrayResults(payload?.bankAccounts)
      const apiTransactions = getArrayResults(payload?.transactions)

      setBankAccounts([...apiBankAccounts, ...manualWalletAccounts])
      setCreditAccounts(getArrayResults(payload?.creditCards))
      setInvestments(getArrayResults(payload?.investments))
      setTransactions([...apiTransactions, ...manualWalletTransactions])
      setBalanceEvolution(getArrayResults(payload?.balanceEvolution))
      setLastSyncedAt(new Date())

      const failedItems = getArrayResults(payload?.failedItems)
      if (failedItems.length > 0) {
        const firstFailure = failedItems[0]
        const institutionName = DASHBOARD_ITEMS[firstFailure?.itemId] || firstFailure?.itemId || text.unknownItem
        setError(`${text.partialRefreshPrefix} (${institutionName}). ${text.partialRefreshSuffix}`)
      }
    } catch (err) {
      const manualConnections = getStoredManualConnections()
      const manualWalletAccounts = manualConnections.map((connection) => toPhysicalWalletAccount(connection))
      const manualWalletTransactions = manualConnections.flatMap((connection) =>
        getStoredManualWalletTransactions(connection.id, text, connection),
      )

      setBankAccounts(manualWalletAccounts)
      setCreditAccounts([])
      setInvestments([])
      setTransactions(manualWalletTransactions)
      setBalanceEvolution([])
      setError(err instanceof Error ? err.message : text.fallbackLoadError)
    } finally {
      setLoading(false)
    }
  }, [
    text
  ])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const bankBalanceTotal = useMemo(
    () => bankAccounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0),
    [bankAccounts],
  )

  const sortedBankAccounts = useMemo(() => {
    // Separate manual wallet accounts from regular bank accounts
    const manualWallets = bankAccounts.filter((account) => isManualWalletConnection(account))
    const regularAccounts = bankAccounts.filter((account) => !isManualWalletConnection(account))

    // If there are manual wallets, create a grouped Physical Wallet entry
    let result = regularAccounts
    if (manualWallets.length > 0) {
      const totalBalance = manualWallets.reduce((sum, wallet) => sum + (Number(wallet.balance) || 0), 0)
      const groupedPhysicalWallet = {
        itemId: 'manual-wallets-group',
        id: 'manual-wallets-group',
        connectionType: 'MANUAL_WALLET',
        name: text.connectionsPhysicalConnectionLabel || 'Physical Wallet',
        marketingName: text.connectionsPhysicalConnectionLabel || 'Physical Wallet',
        balance: totalBalance,
        currency: 'BRL',
        type: 'BANK',
      }
      result = [...regularAccounts, groupedPhysicalWallet]
    }

    // Sort by balance
    return result.sort((first, second) => (Number(second.balance) || 0) - (Number(first.balance) || 0))
  }, [bankAccounts, text])

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

  const accountMetadataById = useMemo(() => {
    const allAccounts = [...bankAccounts, ...creditAccounts]
    return new Map(
      allAccounts
        .filter((account) => account?.id)
        .map((account) => [account.id, account]),
    )
  }, [bankAccounts, creditAccounts])

  const getNormalizedAmount = useCallback((transaction) => {
    const rawAmount = Number(transaction?.amount) || 0
    const accountId = transaction?.accountId || transaction?.account?.id || null
    const accountMeta = accountMetadataById.get(accountId)
    const accountType = accountMeta?.type || transaction?.account?.type || 'BANK'

    return accountType === 'CREDIT' ? rawAmount * -1 : rawAmount
  }, [accountMetadataById])

  const getTransactionDate = useCallback((transaction) => {
    const rawDate = transaction?.date || transaction?.paymentDate || transaction?.createdAt
    if (!rawDate) return null

    const parsedDate = new Date(rawDate)
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
  }, [])

  const currentMonthTransactions = useMemo(() => {
    const now = new Date()
    return transactions.filter((transaction) => {
      const parsedDate = getTransactionDate(transaction)
      if (!parsedDate) return false

      return parsedDate.getFullYear() === now.getFullYear() && parsedDate.getMonth() === now.getMonth()
    })
  }, [getTransactionDate, transactions])

  const monthlyIncome = useMemo(
    () => currentMonthTransactions.reduce((sum, transaction) => {
      const amount = getNormalizedAmount(transaction)
      return amount > 0 ? sum + amount : sum
    }, 0),
    [currentMonthTransactions, getNormalizedAmount],
  )

  const monthlyExpenses = useMemo(
    () => Math.abs(currentMonthTransactions.reduce((sum, transaction) => {
      const amount = getNormalizedAmount(transaction)
      return amount < 0 ? sum + amount : sum
    }, 0)),
    [currentMonthTransactions, getNormalizedAmount],
  )

  const cashFlowExpenseToIncomePct = useMemo(() => {
    if (monthlyIncome <= 0) {
      return monthlyExpenses > 0 ? 100 : 0
    }

    return (monthlyExpenses / monthlyIncome) * 100
  }, [monthlyExpenses, monthlyIncome])

  const cashFlowBarWidth = Math.min(cashFlowExpenseToIncomePct, 100)

  const recentTransactions = useMemo(
    () => [...transactions]
      .sort((first, second) => {
        const firstDateObj = new Date(first?.date || first?.paymentDate || first?.createdAt || 0)
        const secondDateObj = new Date(second?.date || second?.paymentDate || second?.createdAt || 0)

        const firstDayKey = Number.isNaN(firstDateObj.getTime())
          ? 0
          : new Date(firstDateObj.getFullYear(), firstDateObj.getMonth(), firstDateObj.getDate()).getTime()
        const secondDayKey = Number.isNaN(secondDateObj.getTime())
          ? 0
          : new Date(secondDateObj.getFullYear(), secondDateObj.getMonth(), secondDateObj.getDate()).getTime()

        if (secondDayKey !== firstDayKey) return secondDayKey - firstDayKey

        const firstCreatedAt = new Date(first?.createdAt || 0).getTime()
        const secondCreatedAt = new Date(second?.createdAt || 0).getTime()
        if (firstCreatedAt !== secondCreatedAt) return secondCreatedAt - firstCreatedAt

        const firstDate = Number.isNaN(firstDateObj.getTime()) ? 0 : firstDateObj.getTime()
        const secondDate = Number.isNaN(secondDateObj.getTime()) ? 0 : secondDateObj.getTime()
        return secondDate - firstDate
      })
      .slice(0, 3),
    [transactions],
  )

  const spendingByCategoryData = useMemo(() => {
    const grouped = new Map()

    currentMonthTransactions.forEach((transaction) => {
      const amount = getNormalizedAmount(transaction)
      if (amount >= 0) return

      const categoryName = transaction?.category || text.uncategorized
      grouped.set(categoryName, (grouped.get(categoryName) || 0) + Math.abs(amount))
    })

    const sortedCategories = Array.from(grouped.entries())
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((first, second) => second.value - first.value)

    if (sortedCategories.length <= 4) {
      return sortedCategories
    }

    const top4 = sortedCategories.slice(0, 4)
    const othersValue = sortedCategories.slice(4).reduce((sum, entry) => sum + entry.value, 0)

    return [
      ...top4,
      { name: text.othersCategory, value: Number(othersValue.toFixed(2)) },
    ]
  }, [currentMonthTransactions, getNormalizedAmount, text.othersCategory, text.uncategorized])

  const truncateText = useCallback((value, maxLength = 44) => {
    if (!value || typeof value !== 'string') return text.uncategorized
    if (value.length <= maxLength) return value
    return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
  }, [text.uncategorized])

  const formatCardName = useCallback((account) => {
    if (account?.type !== 'CREDIT') return account?.name || getInstitutionName(account)

    return text.mastercardGold
  }, [text.mastercardGold])

  const upcomingBills = useMemo(
    () => sortedCreditAccounts.map((account) => {
      const used = Math.abs(Number(account?.balance) || 0)
      const limit = Number(getCreditLimit(account)) || 0
      const usage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0

      const rawDueDate = account?.creditData?.balanceDueDate
      const parsedDueDate = rawDueDate ? new Date(rawDueDate) : null

      let dueDateLabel = null
      if (parsedDueDate && !Number.isNaN(parsedDueDate.getTime())) {
        dueDateLabel = new Intl.DateTimeFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
          day: '2-digit',
          month: '2-digit',
        }).format(parsedDueDate)
      } else {
        const institutionName = getInstitutionName(account).toLowerCase()
        const fallbackDay = institutionName.includes('nubank') ? '02' : institutionName.includes('inter') ? '15' : '10'
        dueDateLabel = `${text.dayLabel} ${fallbackDay}`
      }

      return {
        id: account.id,
        name: formatCardName(account),
        logo: getBankLogo(account),
        used,
        limit,
        usage,
        dueDateLabel,
      }
    }),
    [formatCardName, language, sortedCreditAccounts, text.dayLabel],
  )

  const formatTransactionDate = useCallback((value) => {
    if (!value) return '--'
    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) return '--'
    return new Intl.DateTimeFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
    }).format(parsedDate)
  }, [language])

  const flowMonthLabel = useMemo(() => {
    const label = new Intl.DateTimeFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
      month: 'long',
      year: 'numeric',
    }).format(selectedFlowMonth)

    return label.charAt(0).toUpperCase() + label.slice(1)
  }, [language, selectedFlowMonth])

  const earliestFlowMonth = useMemo(() => {
    const timestamps = transactions
      .map((transaction) => getTransactionDate(transaction)?.getTime() || null)
      .filter((value) => Number.isFinite(value))

    if (timestamps.length === 0) {
      const now = new Date()
      return new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const oldestDate = new Date(Math.min(...timestamps))
    return new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1)
  }, [getTransactionDate, transactions])

  const currentFlowMonth = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }, [])

  const canGoToPreviousFlowMonth = useMemo(() => {
    return selectedFlowMonth.getTime() > earliestFlowMonth.getTime()
  }, [earliestFlowMonth, selectedFlowMonth])

  const canGoToNextFlowMonth = useMemo(() => {
    return selectedFlowMonth.getTime() < currentFlowMonth.getTime()
  }, [currentFlowMonth, selectedFlowMonth])

  const goToPreviousFlowMonth = useCallback(() => {
    setSelectedFlowMonth((current) => {
      const previous = new Date(current.getFullYear(), current.getMonth() - 1, 1)
      return previous.getTime() < earliestFlowMonth.getTime() ? current : previous
    })
  }, [earliestFlowMonth])

  const goToNextFlowMonth = useCallback(() => {
    setSelectedFlowMonth((current) => {
      const next = new Date(current.getFullYear(), current.getMonth() + 1, 1)
      return next.getTime() > currentFlowMonth.getTime() ? current : next
    })
  }, [currentFlowMonth])

  const selectedMonthTransactions = useMemo(
    () => transactions.filter((transaction) => {
      const parsedDate = getTransactionDate(transaction)
      if (!parsedDate) return false

      return parsedDate.getFullYear() === selectedFlowMonth.getFullYear() && parsedDate.getMonth() === selectedFlowMonth.getMonth()
    }),
    [getTransactionDate, selectedFlowMonth, transactions],
  )

  const flowMonthlyIncome = useMemo(
    () => selectedMonthTransactions.reduce((sum, transaction) => {
      const amount = getNormalizedAmount(transaction)
      return amount > 0 ? sum + amount : sum
    }, 0),
    [getNormalizedAmount, selectedMonthTransactions],
  )

  const flowMonthlyExpenses = useMemo(
    () => Math.abs(selectedMonthTransactions.reduce((sum, transaction) => {
      const amount = getNormalizedAmount(transaction)
      return amount < 0 ? sum + amount : sum
    }, 0)),
    [getNormalizedAmount, selectedMonthTransactions],
  )

  const flowTransactions = useMemo(
    () => [...selectedMonthTransactions].sort((first, second) => {
      const firstDateObj = getTransactionDate(first)
      const secondDateObj = getTransactionDate(second)

      const firstDayKey = firstDateObj
        ? new Date(firstDateObj.getFullYear(), firstDateObj.getMonth(), firstDateObj.getDate()).getTime()
        : 0
      const secondDayKey = secondDateObj
        ? new Date(secondDateObj.getFullYear(), secondDateObj.getMonth(), secondDateObj.getDate()).getTime()
        : 0

      if (secondDayKey !== firstDayKey) return secondDayKey - firstDayKey

      const firstCreatedAt = new Date(first?.createdAt || 0).getTime()
      const secondCreatedAt = new Date(second?.createdAt || 0).getTime()
      if (firstCreatedAt !== secondCreatedAt) return secondCreatedAt - firstCreatedAt

      const firstDate = firstDateObj?.getTime() || 0
      const secondDate = secondDateObj?.getTime() || 0
      return secondDate - firstDate
    }),
    [getTransactionDate, selectedMonthTransactions],
  )

  const flowGroupedTransactions = useMemo(() => {
    const grouped = new Map()

    flowTransactions.forEach((transaction) => {
      const rawDate = transaction?.date || transaction?.paymentDate || transaction?.createdAt
      const parsedDate = rawDate ? new Date(rawDate) : null
      if (!parsedDate || Number.isNaN(parsedDate.getTime())) return

      const dayKey = String(parsedDate.getDate()).padStart(2, '0')
      if (!grouped.has(dayKey)) {
        grouped.set(dayKey, {
          day: dayKey,
          weekday: new Intl.DateTimeFormat(language === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'long' }).format(parsedDate),
          entries: [],
        })
      }

      grouped.get(dayKey).entries.push(transaction)
    })

    return Array.from(grouped.values())
  }, [flowTransactions, language])

  const lastSyncedText = useMemo(() => {
    if (!lastSyncedAt) return text.notSyncedYet

    return new Intl.DateTimeFormat(language === 'pt' ? 'pt-BR' : 'en-US', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(lastSyncedAt)
  }, [language, lastSyncedAt, text.notSyncedYet])

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

  return {
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
  }
}

export default useDashboardData
