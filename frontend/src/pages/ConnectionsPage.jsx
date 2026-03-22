import { useMemo, useState, useRef } from 'react'
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Clock3, Cloud, Copy, CreditCard, Download, Eye, EyeOff, FileText, Landmark, Link2, Plus, TrendingUp, Trash2, Upload, Wallet, X } from 'lucide-react'
import walletLogo from '../assets/bank-wallet.png'
import { getBankLogo, getInstitutionName, getInvestmentValue } from '../config/dashboardConfig'
import { exportBackup, importBackup } from '../utils/backupExport'
import { clearStoredPluggyCredentials, getPluggyCredentialsDraft, removeStoredPluggyItemId, savePluggyCredentials } from '../utils/pluggyCredentials'
import {
  appendManualWalletTransaction,
  getStoredManualConnections,
  getStoredManualWalletTransactions,
  initializeManualWalletTransactions,
  isManualWalletConnection,
  saveStoredManualConnections,
  toPhysicalWalletAccount,
} from '../utils/manualConnections'

const getTodayInputDate = () => new Date().toISOString().slice(0, 10)

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
  transactions,
  getNormalizedAmount,
  onCredentialsSaved,
}) {
  const [selectedConnectionItemId, setSelectedConnectionItemId] = useState(null)
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false)
  const [connectionFlowStep, setConnectionFlowStep] = useState('selection')
  const [credentialsForm, setCredentialsForm] = useState(getPluggyCredentialsDraft())
  const [manualConnections, setManualConnections] = useState(getStoredManualConnections)
  const [csvImportForm, setCsvImportForm] = useState({ institutionName: '', accountName: '' })
  const [physicalWalletForm, setPhysicalWalletForm] = useState({ walletName: '', currentBalance: '' })
  const [credentialsError, setCredentialsError] = useState('')
  const [showClientSecret, setShowClientSecret] = useState(false)
  const [copiedField, setCopiedField] = useState('')
  const [expandedManualAccountId, setExpandedManualAccountId] = useState(null)
  const [expandedPluggyAccountId, setExpandedPluggyAccountId] = useState(null)
  const [isManualTransactionFormOpen, setIsManualTransactionFormOpen] = useState(false)
  const [manualTransactionsRefreshKey, setManualTransactionsRefreshKey] = useState(0)
  const [manualTransactionError, setManualTransactionError] = useState('')
  const [manualTransactionForm, setManualTransactionForm] = useState({
    description: '',
    amount: '',
    type: 'INCOME',
    date: getTodayInputDate(),
  })
  const [backupImportFeedback, setBackupImportFeedback] = useState('')
  const [backupImportFeedbackType, setBackupImportFeedbackType] = useState('')
  const fileInputRef = useRef(null)

  const manualWalletAccounts = useMemo(
    () => manualConnections.map((entry) => toPhysicalWalletAccount(entry)),
    [manualConnections],
  )

  // Create a synthetic Physical Wallet connection that groups all manual wallets
  const physicalWalletConnection = useMemo(() => {
    if (manualConnections.length === 0) return null
    
    const totalBalance = manualConnections.reduce((sum, wallet) => sum + (wallet.balance || 0), 0)
    return {
      itemId: 'manual-wallets-group',
      id: 'manual-wallets-group',
      connectionType: 'MANUAL_WALLET',
      walletName: text.connectionsPhysicalConnectionLabel || 'Physical Wallet',
      marketingName: text.connectionsPhysicalConnectionLabel || 'Physical Wallet',
      balance: totalBalance,
      currency: 'BRL',
      logo: walletLogo,
      createdAt: manualConnections.length > 0 ? manualConnections[0].createdAt : new Date().toISOString(),
      updatedAt: manualConnections.length > 0 ? manualConnections[manualConnections.length - 1].updatedAt : new Date().toISOString(),
    }
  }, [manualConnections, text])

  // Filter out manual wallet accounts from the regular bank accounts to avoid duplicates in connections list
  const nonManualBankAccounts = useMemo(
    () => bankAccounts.filter((account) => !isManualWalletConnection(account)),
    [bankAccounts],
  )

  const sources = [...nonManualBankAccounts, ...creditAccounts, ...investments]
  
  // Add the physical wallet connection if there are manual connections
  if (physicalWalletConnection) {
    sources.unshift(physicalWalletConnection)
  }

  const connectionsByItem = sources.reduce((map, entry) => {
    const itemId = entry?.itemId
    if (!itemId || map.has(itemId)) return map
    map.set(itemId, entry)
    return map
  }, new Map())

  // Sort: Pluggy Automated first, then Manual Import, then Physical Wallet last
  const connections = Array.from(connectionsByItem.values()).sort((a, b) => {
    // Physical Wallet always last
    if (a.connectionType === 'MANUAL_WALLET' && b.connectionType !== 'MANUAL_WALLET') return 1;
    if (b.connectionType === 'MANUAL_WALLET' && a.connectionType !== 'MANUAL_WALLET') return -1;

    // Manual Import (CSV/manual) after Pluggy Automated
    const isManualImportA = a.connectionType === 'MANUAL_IMPORT';
    const isManualImportB = b.connectionType === 'MANUAL_IMPORT';
    if (isManualImportA && !isManualImportB) return 1;
    if (isManualImportB && !isManualImportA) return -1;

    // Default: keep original order
    return 0;
  });

  const selectedConnection = useMemo(
    () => connections.find((entry) => entry?.itemId === selectedConnectionItemId) || null,
    [connections, selectedConnectionItemId],
  )

  const isPhysicalWalletConnection = isManualWalletConnection(selectedConnection)
  const selectedManualTransactions = useMemo(() => {
    if (!expandedManualAccountId) return []
    if (selectedConnectionItemId !== 'manual-wallets-group') return []

    return [...getStoredManualWalletTransactions(expandedManualAccountId, text, selectedConnection)].sort((first, second) => {
      const firstCreatedAt = new Date(first?.createdAt || first?.date || 0).getTime()
      const secondCreatedAt = new Date(second?.createdAt || second?.date || 0).getTime()

      if (secondCreatedAt !== firstCreatedAt) {
        return secondCreatedAt - firstCreatedAt
      }

      const firstDate = new Date(first?.date || first?.paymentDate || 0).getTime()
      const secondDate = new Date(second?.date || second?.paymentDate || 0).getTime()
      return secondDate - firstDate
    })
  }, [expandedManualAccountId, selectedConnectionItemId, manualTransactionsRefreshKey, selectedConnection, text])

  const selectedPluggyAccountTransactions = useMemo(() => {
    if (!expandedPluggyAccountId) return []

    const expandedInvestment = investments.find(
      (entry) => entry?.itemId === selectedConnectionItemId && String(entry?.id) === String(expandedPluggyAccountId),
    )

    const investmentCandidateIds = new Set(
      [
        expandedInvestment?.id,
        expandedInvestment?.accountId,
        expandedInvestment?.account?.id,
      ]
        .filter(Boolean)
        .map((value) => String(value)),
    )

    const investmentMatches = expandedInvestment
      ? transactions.filter((tx) => {
        const candidateIds = [
          tx?.accountId,
          tx?.account?.id,
          tx?.investmentId,
          tx?.investment?.id,
          tx?.account?.investmentId,
        ]
          .filter(Boolean)
          .map((value) => String(value))

        return candidateIds.some((value) => investmentCandidateIds.has(value))
      })
      : []

    // Some investment operations can arrive as regular account transactions with investment-related category/description.
    const investmentFallbackMatches = expandedInvestment
      ? transactions.filter((tx) => {
        if (tx?.itemId !== selectedConnectionItemId) return false

        const searchable = `${String(tx?.category || '')} ${String(tx?.description || '')}`.toLowerCase()
        return /(invest|investment|investimento|aplica|aplicacao|aplicação|rdb|cdb|buy|sell)/i.test(searchable)
      })
      : []

    const filteredTransactions = investmentMatches.length > 0
      ? investmentMatches
      : investmentFallbackMatches.length > 0
        ? investmentFallbackMatches
        : transactions.filter((tx) => (tx?.accountId || tx?.account?.id) === expandedPluggyAccountId)

    return filteredTransactions
      .sort((first, second) => {
        const firstDate = new Date(first?.date || first?.paymentDate || first?.createdAt || 0).getTime()
        const secondDate = new Date(second?.date || second?.paymentDate || second?.createdAt || 0).getTime()
        return secondDate - firstDate
      })
      .slice(0, 5)
  }, [expandedPluggyAccountId, investments, selectedConnectionItemId, transactions])

  const selectedBankAccounts = useMemo(
    () => {
      // If viewing the grouped Physical Wallet connection, show all manual wallet accounts
      if (selectedConnectionItemId === 'manual-wallets-group') {
        return manualWalletAccounts
      }

      const accountsFromDashboard = nonManualBankAccounts.filter((entry) => entry?.itemId === selectedConnectionItemId)
      if (accountsFromDashboard.length > 0) return accountsFromDashboard

      return []
    },
    [nonManualBankAccounts, manualWalletAccounts, selectedConnectionItemId],
  )

  const selectedCreditAccounts = useMemo(
    () => creditAccounts.filter((entry) => entry?.itemId === selectedConnectionItemId),
    [creditAccounts, selectedConnectionItemId],
  )

  const selectedInvestments = useMemo(
    () => investments.filter((entry) => entry?.itemId === selectedConnectionItemId),
    [investments, selectedConnectionItemId],
  )

  const transactionCountByAccountId = useMemo(() => {
    const counts = new Map()

    transactions.forEach((transaction) => {
      const accountId = transaction?.accountId || transaction?.account?.id || null
      if (!accountId) return

      counts.set(accountId, (counts.get(accountId) || 0) + 1)
    })

    return counts
  }, [transactions])

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

  const openCredentialsModal = () => {
    setCredentialsForm(getPluggyCredentialsDraft())
    setCsvImportForm({ institutionName: '', accountName: '' })
    setPhysicalWalletForm({ walletName: '', currentBalance: '' })
    setCredentialsError('')
    setShowClientSecret(false)
    setCopiedField('')
    setConnectionFlowStep('selection')
    setIsCredentialsModalOpen(true)
  }

  const closeCredentialsModal = () => {
    setIsCredentialsModalOpen(false)
    setCsvImportForm({ institutionName: '', accountName: '' })
    setPhysicalWalletForm({ walletName: '', currentBalance: '' })
    setCredentialsError('')
    setShowClientSecret(false)
    setCopiedField('')
    setConnectionFlowStep('selection')
  }

  const saveCredentials = async (event) => {
    event.preventDefault()

    try {
      savePluggyCredentials(credentialsForm)
      closeCredentialsModal()
      await onCredentialsSaved?.()
    } catch {
      setCredentialsError(text.connectionsCredentialsError || 'Preencha Client ID, Client Secret e Item IDs.')
    }
  }

  const handleCopy = async (fieldName, fieldValue) => {
    try {
      await navigator.clipboard.writeText(String(fieldValue || ''))
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField((current) => (current === fieldName ? '' : current)), 1600)
    } catch {
      // no-op
    }
  }

  const handleDeleteConnection = async () => {
    if (!selectedConnectionItemId) return

    // Handle deletion of the grouped Physical Wallet (which deletes all manual wallets)
    if (selectedConnectionItemId === 'manual-wallets-group') {
      if (!window.confirm(text.connectionsDeleteConfirm || 'Deseja remover esta conexão?')) {
        return
      }

      saveStoredManualConnections([])
      setManualConnections([])
      setSelectedConnectionItemId(null)
      setExpandedManualAccountId(null)
      setIsManualTransactionFormOpen(false)
      await onCredentialsSaved?.()
      return
    }

    // Handle deletion of individual manual wallets (shouldn't happen now, but keeping for safety)
    if (isManualWalletConnection(selectedConnection)) {
      if (!window.confirm(text.connectionsDeleteConfirm || 'Deseja remover esta conexão?')) {
        return
      }

      const nextManualConnections = manualConnections.filter((entry) => entry.itemId !== selectedConnectionItemId)
      saveStoredManualConnections(nextManualConnections)
      setManualConnections(nextManualConnections)
      setSelectedConnectionItemId(null)
      setExpandedManualAccountId(null)
      setIsManualTransactionFormOpen(false)
      await onCredentialsSaved?.()
      return
    }

    if (!window.confirm(text.connectionsDeleteConfirm || 'Deseja remover esta conexão dos seus item IDs?')) {
      return
    }

    removeStoredPluggyItemId(selectedConnectionItemId)
    setSelectedConnectionItemId(null)
    await onCredentialsSaved?.()
  }

  const handleDeleteManualWallet = async (walletId) => {
    if (!walletId) return

    if (!window.confirm(text.connectionsDeleteConfirm || 'Deseja remover esta carteira?')) {
      return
    }

    const nextManualConnections = manualConnections.filter((entry) => entry.id !== walletId)
    saveStoredManualConnections(nextManualConnections)
    setManualConnections(nextManualConnections)
    setExpandedManualAccountId(null)
    setIsManualTransactionFormOpen(false)
    setManualTransactionError('')
    await onCredentialsSaved?.()
  }

  const handleDisconnectPluggy = async () => {
    if (!window.confirm(text.connectionsDisconnectConfirm || 'Deseja desconectar completamente a Pluggy?')) {
      return
    }

    clearStoredPluggyCredentials()
    setCredentialsForm(getPluggyCredentialsDraft())
    setCredentialsError('')
    setShowClientSecret(false)
    setCopiedField('')
    setSelectedConnectionItemId(null)
    closeCredentialsModal()
    await onCredentialsSaved?.()
  }

  const handlePhysicalWalletSubmit = (event) => {
    event.preventDefault()

    const walletName = String(physicalWalletForm.walletName || '').trim()
    const currentBalanceRaw = String(physicalWalletForm.currentBalance || '').trim()
    const parsedBalance = Number(currentBalanceRaw)

    if (!walletName || !currentBalanceRaw || Number.isNaN(parsedBalance)) {
      setCredentialsError(text.connectionsPhysicalValidationError || 'Fill Wallet Name and Current Balance.')
      return
    }

    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}`

    const nowIso = new Date().toISOString()
    const newConnection = {
      id,
      itemId: `manual-wallet-${id}`,
      connectionType: 'MANUAL_WALLET',
      walletName,
      marketingName: walletName,
      balance: parsedBalance,
      currency: 'BRL',
      logo: walletLogo,
      createdAt: nowIso,
      updatedAt: nowIso,
    }

    const existingManualConnections = getStoredManualConnections()
    const nextManualConnections = [...existingManualConnections, newConnection]
    saveStoredManualConnections(nextManualConnections)
    initializeManualWalletTransactions(newConnection, text)

    setManualConnections(nextManualConnections)
    setCredentialsError('')
    closeCredentialsModal()
    onCredentialsSaved?.()
  }

  const handleImportBackup = async (event) => {
    const file = event.target?.files?.[0]
    if (!file) return

    setBackupImportFeedback('Processing backup...')
    setBackupImportFeedbackType('loading')

    const result = await importBackup(file)

    if (result.success) {
      setBackupImportFeedback(result.message)
      setBackupImportFeedbackType('success')
      // Reload the page after a short delay to allow user to see the success message
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } else {
      setBackupImportFeedback(result.message)
      setBackupImportFeedbackType('error')
      // Clear error message after 5 seconds
      setTimeout(() => {
        setBackupImportFeedback('')
        setBackupImportFeedbackType('')
      }, 5000)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleManualTransactionSubmit = async (event) => {
    event.preventDefault()
    if (!expandedManualAccountId) return

    const description = String(manualTransactionForm.description || '').trim()
    const amountRaw = String(manualTransactionForm.amount || '').trim()
    const parsedAmount = Number(amountRaw)

    if (!description || !amountRaw || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setManualTransactionError(text.connectionsManualTransactionValidation || 'Fill description and a valid amount.')
      return
    }

    const saved = appendManualWalletTransaction({
      connectionId: expandedManualAccountId,
      description,
      amount: parsedAmount,
      type: manualTransactionForm.type,
      date: manualTransactionForm.date,
      text,
    })

    if (!saved) {
      setManualTransactionError(text.connectionsManualTransactionSaveError || 'Could not save this transaction.')
      return
    }

    setManualConnections(getStoredManualConnections())
    setManualTransactionsRefreshKey((current) => current + 1)
    setManualTransactionError('')
    setManualTransactionForm({ description: '', amount: '', type: 'INCOME', date: getTodayInputDate() })
    setIsManualTransactionFormOpen(false)
    await onCredentialsSaved?.()
  }

  return (
    <section className="w-full space-y-5">
      {isCredentialsModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4">
            <article className={`w-full max-w-2xl rounded-xl border p-4 md:p-5 ${isLightMode ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-[#10131a]'}`}>
              <div className="mb-6 flex items-center justify-between gap-3">
                <h3 className={`text-lg font-semibold ${primaryTextClass}`}>
                  {connectionFlowStep === 'selection'
                    ? text.connectionsModalTitle || 'Nova conexão'
                    : connectionFlowStep === 'automated'
                      ? text.connectionsCredentialsTitle || 'Nova conexão Pluggy'
                      : connectionFlowStep === 'manual'
                        ? text.connectionsManualImportTitle || 'Manual Import'
                        : text.connectionsPhysicalTitle || 'Physical Wallet'}
                </h3>
                <button type="button" onClick={closeCredentialsModal} className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${isLightMode ? 'hover:bg-zinc-100' : 'hover:bg-zinc-800'}`}>
                  <X className="h-4 w-4" />
                </button>
              </div>

              {connectionFlowStep === 'selection' && (
                <div className="space-y-4 pb-1">
                  <p className={`mb-2 text-sm ${secondaryTextClass}`}>{text.connectionsAddConnectionType || 'How do you want to add your data?'}</p>
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setConnectionFlowStep('automated')}
                      className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all ${isLightMode ? 'border-zinc-300 hover:border-blue-400 hover:bg-blue-50/30' : 'border-zinc-700 hover:border-blue-500 hover:bg-blue-950/20'}`}
                    >
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/40 text-blue-300'}`}>
                        <Cloud className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[16px] font-semibold leading-tight ${primaryTextClass}`}>{text.connectionsAutomatedTitle || 'Automated Connection (Pluggy)'}</span>
                        <span className={`mt-1 block text-sm leading-relaxed ${secondaryTextClass}`}>{text.connectionsAutomatedSubtitle || 'Sync automatically using your API keys.'}</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConnectionFlowStep('manual')}
                      className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all ${isLightMode ? 'border-zinc-300 hover:border-blue-400 hover:bg-blue-50/30' : 'border-zinc-700 hover:border-blue-500 hover:bg-blue-950/20'}`}
                    >
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/40 text-blue-300'}`}>
                        <FileText className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[16px] font-semibold leading-tight ${primaryTextClass}`}>{text.connectionsManualTitle || 'Manual Import (CSV)'}</span>
                        <span className={`mt-1 block text-sm leading-relaxed ${secondaryTextClass}`}>{text.connectionsManualSubtitle || 'Upload your exported statements.'}</span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setConnectionFlowStep('physical')}
                      className={`flex w-full items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all ${isLightMode ? 'border-zinc-300 hover:border-blue-400 hover:bg-blue-50/30' : 'border-zinc-700 hover:border-blue-500 hover:bg-blue-950/20'}`}
                    >
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/40 text-blue-300'}`}>
                        <Wallet className="h-5 w-5" />
                      </span>
                      <span className="min-w-0">
                        <span className={`block text-[16px] font-semibold leading-tight ${primaryTextClass}`}>{text.connectionsPhysicalTitle || 'Physical Wallet (Cash)'}</span>
                        <span className={`mt-1 block text-sm leading-relaxed ${secondaryTextClass}`}>{text.connectionsPhysicalSubtitle || 'Track physical cash or manual balances.'}</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {connectionFlowStep === 'automated' && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setConnectionFlowStep('selection')}
                    className={`mb-4 inline-flex items-center gap-2 text-sm ${secondaryTextClass} ${isLightMode ? 'hover:text-zinc-700' : 'hover:text-zinc-300'}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{text.connectionsBackLabel || 'Back'}</span>
                  </button>

                  <form className="space-y-3" onSubmit={saveCredentials}>
                    <label className="block">
                      <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsClientIdLabel || 'Pluggy Client ID'}</span>
                      <div className="relative">
                        <input
                          type="text"
                          value={credentialsForm.clientId}
                          onChange={(event) => setCredentialsForm((current) => ({ ...current, clientId: event.target.value }))}
                          placeholder={text.connectionsClientIdPlaceholder || 'Cole seu Client ID'}
                          className={`w-full rounded-lg border px-3 py-2 pr-11 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy('clientId', credentialsForm.clientId)}
                          aria-label={text.copyFieldLabel || 'Copiar'}
                          title={text.copyFieldLabel || 'Copiar'}
                          className={`absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition ${isLightMode ? 'text-zinc-600 hover:bg-zinc-100' : 'text-zinc-300 hover:bg-zinc-800'} ${copiedField === 'clientId' ? 'text-emerald-400' : ''}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsClientSecretLabel || 'Pluggy Client Secret'}</span>
                      <div className="relative">
                        <input
                          type={showClientSecret ? 'text' : 'password'}
                          value={credentialsForm.clientSecret}
                          onChange={(event) => setCredentialsForm((current) => ({ ...current, clientSecret: event.target.value }))}
                          placeholder={text.connectionsClientSecretPlaceholder || 'Cole seu Client Secret'}
                          className={`w-full rounded-lg border px-3 py-2 pr-20 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowClientSecret((current) => !current)}
                          aria-label={showClientSecret ? (text.hideSecretLabel || 'Ocultar') : (text.showSecretLabel || 'Mostrar')}
                          title={showClientSecret ? (text.hideSecretLabel || 'Ocultar') : (text.showSecretLabel || 'Mostrar')}
                          className={`absolute right-9 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition ${isLightMode ? 'text-zinc-600 hover:bg-zinc-100' : 'text-zinc-300 hover:bg-zinc-800'}`}
                        >
                          {showClientSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy('clientSecret', credentialsForm.clientSecret)}
                          aria-label={text.copyFieldLabel || 'Copiar'}
                          title={text.copyFieldLabel || 'Copiar'}
                          className={`absolute right-1 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md transition ${isLightMode ? 'text-zinc-600 hover:bg-zinc-100' : 'text-zinc-300 hover:bg-zinc-800'} ${copiedField === 'clientSecret' ? 'text-emerald-400' : ''}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsItemIdsLabel || 'Item IDs (separados por vírgula ou linha)'}</span>
                      <div className="relative">
                        <textarea
                          value={credentialsForm.itemIdsRaw}
                          onChange={(event) => setCredentialsForm((current) => ({ ...current, itemIdsRaw: event.target.value }))}
                          rows={4}
                          placeholder={text.connectionsItemIdsPlaceholder || 'item_id_1, item_id_2'}
                          className={`w-full rounded-lg border px-3 py-2 pr-11 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                        />
                        <button
                          type="button"
                          onClick={() => handleCopy('itemIdsRaw', credentialsForm.itemIdsRaw)}
                          aria-label={text.copyFieldLabel || 'Copiar'}
                          title={text.copyFieldLabel || 'Copiar'}
                          className={`absolute right-1 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md transition ${isLightMode ? 'text-zinc-600 hover:bg-zinc-100' : 'text-zinc-300 hover:bg-zinc-800'} ${copiedField === 'itemIdsRaw' ? 'text-emerald-400' : ''}`}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </label>

                    {credentialsError && <p className="text-sm text-rose-400">{credentialsError}</p>}

                    <div className="flex items-center justify-between gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleDisconnectPluggy}
                        className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-semibold ${isLightMode ? 'border-rose-300 text-rose-700 hover:bg-rose-50' : 'border-rose-500/40 text-rose-300 hover:bg-rose-900/20'}`}
                      >
                        {text.connectionsDisconnectLabel || 'Disconnect Pluggy'}
                      </button>

                      <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConnectionFlowStep('selection')}
                        className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-semibold ${isLightMode ? 'border-zinc-300 text-zinc-700' : 'border-zinc-700 text-zinc-300'}`}
                      >
                        {text.connectionsCancelLabel || 'Cancelar'}
                      </button>
                      <button type="submit" className="inline-flex h-9 items-center rounded-lg bg-[#1f67ff] px-3 text-sm font-semibold text-white">
                        {text.connectionsSaveCredentialsLabel || 'Salvar e conectar'}
                      </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}

              {connectionFlowStep === 'manual' && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setConnectionFlowStep('selection')}
                    className={`mb-4 inline-flex items-center gap-2 text-sm ${secondaryTextClass} ${isLightMode ? 'hover:text-zinc-700' : 'hover:text-zinc-300'}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{text.connectionsBackLabel || 'Back'}</span>
                  </button>

                  <div className="space-y-3 pb-3">
                    <label className="block">
                      <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsCsvInstitutionLabel || 'Institution Name'}</span>
                      <input
                        type="text"
                        value={csvImportForm.institutionName}
                        onChange={(event) => setCsvImportForm((current) => ({ ...current, institutionName: event.target.value }))}
                        placeholder={text.connectionsCsvInstitutionPlaceholder || 'e.g. Inter, Nubank'}
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                      />
                    </label>
                    <label className="block">
                      <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsCsvAccountLabel || 'Account Name'}</span>
                      <input
                        type="text"
                        value={csvImportForm.accountName}
                        onChange={(event) => setCsvImportForm((current) => ({ ...current, accountName: event.target.value }))}
                        placeholder={text.connectionsCsvAccountPlaceholder || 'e.g. Main Checking'}
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                      />
                    </label>
                  </div>

                  <div className={`rounded-lg border-2 border-dashed p-8 text-center ${isLightMode ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-700 bg-zinc-900/30'}`}>
                    <Upload className={`mx-auto mb-3 h-12 w-12 ${secondaryTextClass}`} />
                    <p className={`mb-2 font-semibold ${primaryTextClass}`}>{text.connectionsManualDragDrop || 'Drag and drop your CSV file here'}</p>
                    <p className={`mb-4 text-sm ${secondaryTextClass}`}>{text.connectionsManualOrUpload || 'or'}</p>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center rounded-lg bg-[#1f67ff] px-4 text-sm font-semibold text-white"
                    >
                      {text.connectionsManualBrowseFiles || 'Browse files'}
                    </button>
                  </div>
                </div>
              )}

              {connectionFlowStep === 'physical' && (
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => setConnectionFlowStep('selection')}
                    className={`mb-4 inline-flex items-center gap-2 text-sm ${secondaryTextClass} ${isLightMode ? 'hover:text-zinc-700' : 'hover:text-zinc-300'}`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>{text.connectionsBackLabel || 'Back'}</span>
                  </button>

                  <form className="space-y-3" onSubmit={handlePhysicalWalletSubmit}>
                    <label className="block">
                      <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsPhysicalWalletNameLabel || 'Wallet Name'}</span>
                      <input
                        type="text"
                        value={physicalWalletForm.walletName}
                        onChange={(event) => {
                          setPhysicalWalletForm((current) => ({ ...current, walletName: event.target.value }))
                          if (credentialsError) setCredentialsError('')
                        }}
                        placeholder={text.connectionsPhysicalWalletNamePlaceholder || 'Pocket Money'}
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                      />
                    </label>

                    <label className="block">
                      <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsPhysicalBalanceLabel || 'Current Balance'}</span>
                      <input
                        type="number"
                        value={physicalWalletForm.currentBalance}
                        onChange={(event) => {
                          setPhysicalWalletForm((current) => ({ ...current, currentBalance: event.target.value }))
                          if (credentialsError) setCredentialsError('')
                        }}
                        placeholder="0.00"
                        step="0.01"
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                      />
                    </label>

                    {credentialsError && <p className="text-sm text-rose-400">{credentialsError}</p>}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setConnectionFlowStep('selection')}
                        className={`inline-flex h-9 items-center rounded-lg border px-3 text-sm font-semibold ${isLightMode ? 'border-zinc-300 text-zinc-700' : 'border-zinc-700 text-zinc-300'}`}
                      >
                        {text.connectionsCancelLabel || 'Cancelar'}
                      </button>
                      <button type="submit" className="inline-flex h-9 items-center rounded-lg bg-[#1f67ff] px-3 text-sm font-semibold text-white">
                        {text.connectionsSaveCredentialsLabel || 'Save and connect'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </article>
          </div>
      )}

      {selectedConnection && (
        <article className={`${glassCardClass} w-full overflow-hidden p-4 md:p-5`}>
          <button
            type="button"
            onClick={() => {
              setSelectedConnectionItemId(null)
              setExpandedManualAccountId(null)
              setExpandedPluggyAccountId(null)
              setIsManualTransactionFormOpen(false)
              setManualTransactionError('')
            }}
            className={`mb-5 inline-flex items-center gap-2 text-sm ${secondaryTextClass} ${isLightMode ? 'hover:text-zinc-700' : 'hover:text-zinc-300'}`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{text.connectionsBack || text.navConnections}</span>
          </button>

          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {getBankLogo(selectedConnection) ? (
                <img
                  src={getBankLogo(selectedConnection)}
                  alt={getInstitutionName(selectedConnection)}
                  className="h-10 w-10 rounded-lg object-contain"
                />
              ) : isPhysicalWalletConnection ? (
                <img
                  src={walletLogo}
                  alt={selectedConnection?.walletName || text.connectionsPhysicalTitle || 'Physical Wallet'}
                  className="h-10 w-10 rounded-lg object-contain"
                />
              ) : (
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${isLightMode ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-800 text-zinc-300'}`}>
                  {getInstitutionName(selectedConnection).slice(0, 2).toUpperCase()}
                </span>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <p className={`text-[14px] font-semibold ${primaryTextClass}`}>
                    {isPhysicalWalletConnection
                      ? (text.connectionsPhysicalConnectionLabel || 'Physical Wallet')
                      : `${text.connectionsBankLabel || 'Banco'} ${getInstitutionName(selectedConnection)}`}
                  </p>
                  <span className={`inline-flex h-2 w-2 rounded-full motion-safe:animate-pulse ${isPhysicalWalletConnection ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]'}`} />
                </div>
                <p className={`mt-1 flex items-center gap-1.5 text-[12px]`}>
                  <Clock3 className={`h-[12px] w-[12px] ${secondaryTextClass}`} />
                  <span className={secondaryTextClass}>{formatRelativeSync(selectedConnection)}</span>
                  {!isPhysicalWalletConnection && (
                    <>
                      <span className={secondaryTextClass}>·</span>
                      <span className={`text-[11px] ${secondaryTextClass}`}>{text.connectionsItemIdLabel || 'Item ID'}: {selectedConnection?.itemId || '--'}</span>
                    </>
                  )}
                  <span className={secondaryTextClass}>·</span>
                  <span className={`font-semibold ${isPhysicalWalletConnection ? 'text-amber-400/80' : 'text-emerald-400/60'}`}>
                    {isPhysicalWalletConnection ? (text.connectionsManualLabel || 'Manual') : (text.connectionsSyncLabel || 'Sincronizado')}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteConnection}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold ${isLightMode ? 'border-zinc-300 text-zinc-700 hover:bg-zinc-100' : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800/80'}`}
                title={isPhysicalWalletConnection ? text.connectionsDeleteAllWalletsHint || 'Remove this connection and all wallets' : ''}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{text.connectionsDelete || 'Excluir'}</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {selectedBankAccounts.length > 0 && (
            <div>
              <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
                {isPhysicalWalletConnection ? (
                  <Wallet className="h-4 w-4 text-[#1f67ff]" />
                ) : (
                  <Landmark className="h-4 w-4 text-[#1f67ff]" />
                )}
                <span>{isPhysicalWalletConnection ? (text.connectionsPhysicalWalletsLabel || 'Carteiras físicas') : text.bankAccounts}</span>
              </div>

              <div className="space-y-2">
                {selectedBankAccounts.map((account) => (
                  <div key={account.id} className={expandedManualAccountId === account.id || expandedPluggyAccountId === account.id ? '' : 'space-y-2'}>
                    <article
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        if (isPhysicalWalletConnection) {
                          setExpandedManualAccountId((current) => (current === account.id ? null : account.id))
                          setManualTransactionError('')
                        } else {
                          setExpandedPluggyAccountId((current) => (current === account.id ? null : account.id))
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          if (isPhysicalWalletConnection) {
                            setExpandedManualAccountId((current) => (current === account.id ? null : account.id))
                            setManualTransactionError('')
                          } else {
                            setExpandedPluggyAccountId((current) => (current === account.id ? null : account.id))
                          }
                        }
                      }}
                      className={`flex items-center justify-between border px-4 py-3 cursor-pointer ${(expandedManualAccountId === account.id || expandedPluggyAccountId === account.id) ? 'rounded-t-xl' : 'rounded-xl'} ${isLightMode ? 'border-zinc-300/60' : 'border-zinc-700/60'}`}
                    >
                      <div className="min-w-0 pr-3">
                        <p className={`truncate text-sm font-semibold ${primaryTextClass}`}>{account?.name || getInstitutionName(account)}</p>
                        <p className={`truncate text-xs ${secondaryTextClass}`}>
                          {isPhysicalWalletConnection
                            ? `${transactionCountByAccountId.get(account.id) || 0} ${text.transactionCount}`
                            : `${account?.number || account?.id || '--'} - ${transactionCountByAccountId.get(account.id) || 0} ${text.transactionCount}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="shrink-0 text-sm font-semibold text-[#22c55e]">R$ {Number(account?.balance || 0).toFixed(2)}</p>
                        <ChevronRight className={`h-4 w-4 transition-transform ${(expandedManualAccountId === account.id || expandedPluggyAccountId === account.id) ? 'rotate-90' : ''} ${secondaryTextClass}`} />
                      </div>
                    </article>

                    {(expandedManualAccountId === account.id || expandedPluggyAccountId === account.id) && (
                      <div className={`rounded-b-xl border border-t-0 p-3 ${isLightMode ? 'border-zinc-300/60 bg-zinc-50/60' : 'border-zinc-700/60 bg-zinc-900/35'}`}>
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h4 className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
                            {text.connectionsTransactionsLabel || 'Transactions'}
                          </h4>
                          {isPhysicalWalletConnection && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteManualWallet(account.id)}
                                className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold ${isLightMode ? 'border-zinc-300 text-zinc-700 hover:bg-zinc-100' : 'border-zinc-700 text-zinc-300 hover:bg-zinc-800/80'}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>{text.connectionsDelete || 'Delete'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setIsManualTransactionFormOpen((current) => !current)
                                  setManualTransactionError('')
                                }}
                                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold ${isManualTransactionFormOpen ? (isLightMode ? 'bg-zinc-200 text-zinc-800' : 'bg-zinc-700 text-zinc-100') : 'bg-[#1f67ff] text-white'}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>{text.connectionsAddTransaction || 'Add transaction'}</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {isPhysicalWalletConnection && isManualTransactionFormOpen && (
                          <form className={`mb-3 rounded-lg border p-3 ${isLightMode ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-zinc-900/40'}`} onSubmit={handleManualTransactionSubmit}>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                              <label className="block md:col-span-2">
                                <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsTransactionDescriptionLabel || 'Description'}</span>
                                <input
                                  type="text"
                                  value={manualTransactionForm.description}
                                  onChange={(event) => {
                                    setManualTransactionForm((current) => ({ ...current, description: event.target.value }))
                                    if (manualTransactionError) setManualTransactionError('')
                                  }}
                                  placeholder={text.connectionsTransactionDescriptionPlaceholder || 'Groceries, ATM Withdrawal...'}
                                  className={`w-full rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                                />
                              </label>

                              <label className="block">
                                <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsTransactionAmountLabel || 'Amount'}</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={manualTransactionForm.amount}
                                  onChange={(event) => {
                                    setManualTransactionForm((current) => ({ ...current, amount: event.target.value }))
                                    if (manualTransactionError) setManualTransactionError('')
                                  }}
                                  className={`w-full rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                                />
                              </label>

                              <label className="block">
                                <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsTransactionTypeLabel || 'Type'}</span>
                                <select
                                  value={manualTransactionForm.type}
                                  onChange={(event) => setManualTransactionForm((current) => ({ ...current, type: event.target.value }))}
                                  className={`w-full rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                                >
                                  <option value="INCOME">{text.incomesFilter || 'Income'}</option>
                                  <option value="EXPENSE">{text.expensesFilter || 'Expense'}</option>
                                </select>
                              </label>

                              <label className="block md:col-span-2">
                                <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsTransactionDateLabel || 'Date'}</span>
                                <input
                                  type="date"
                                  value={manualTransactionForm.date}
                                  onChange={(event) => setManualTransactionForm((current) => ({ ...current, date: event.target.value }))}
                                  className={`w-full rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                                />
                              </label>
                            </div>

                            {manualTransactionError && <p className="mt-2 text-sm text-rose-400">{manualTransactionError}</p>}

                            <div className="mt-3 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsManualTransactionFormOpen(false)
                                  setManualTransactionError('')
                                }}
                                className={`inline-flex h-8 items-center rounded-lg border px-3 text-xs font-semibold ${isLightMode ? 'border-zinc-300 text-zinc-700' : 'border-zinc-700 text-zinc-300'}`}
                              >
                                {text.connectionsCancelLabel || 'Cancel'}
                              </button>
                              <button type="submit" className="inline-flex h-8 items-center rounded-lg bg-[#1f67ff] px-3 text-xs font-semibold text-white">
                                {text.connectionsSaveTransactionLabel || 'Save transaction'}
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="space-y-2">
                          {isPhysicalWalletConnection ? (
                            // Show manual transactions for physical wallets
                            selectedManualTransactions.length === 0 ? (
                              <p className={`text-xs ${secondaryTextClass}`}>{text.noTransactions || 'No transactions available.'}</p>
                            ) : (
                              selectedManualTransactions.map((transaction) => {
                                const amount = Number(transaction?.amount || 0)
                                const isIncome = amount >= 0
                                const rawDate = transaction?.date || transaction?.createdAt
                                const parsedDate = rawDate ? new Date(rawDate) : null
                                const dateLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
                                  ? new Intl.DateTimeFormat(text.connectionsBackLabel === 'Voltar' ? 'pt-BR' : 'en-US', { day: '2-digit', month: '2-digit' }).format(parsedDate)
                                  : '--'

                                return (
                                  <div key={transaction.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isLightMode ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-zinc-900/40'}`}>
                                    <div className="flex min-w-0 items-center gap-2 pr-3">
                                      <span
                                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                                          isLightMode
                                            ? isIncome ? 'bg-emerald-100/80 text-[#22c55e]' : 'bg-rose-100/80 text-[#f87171]'
                                            : isIncome ? 'bg-emerald-500/10 text-[#22c55e]' : 'bg-rose-500/10 text-[#f87171]'
                                        }`}
                                      >
                                        {isIncome ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                                      </span>
                                      <div className="min-w-0">
                                        <p className={`truncate text-sm font-medium ${primaryTextClass}`}>{transaction?.description || text.uncategorized}</p>
                                        <p className={`text-xs ${secondaryTextClass}`}>{dateLabel}</p>
                                      </div>
                                    </div>
                                    <p className={`shrink-0 text-sm font-semibold ${isIncome ? 'text-[#22c55e]' : 'text-[#f87171]'}`}>
                                      {isIncome ? '+' : '-'}R$ {Math.abs(amount).toFixed(2)}
                                    </p>
                                  </div>
                                )
                              })
                            )
                          ) : (
                            // Show pluggy transactions for regular accounts
                            selectedPluggyAccountTransactions.length === 0 ? (
                              <p className={`text-xs ${secondaryTextClass}`}>{text.noTransactions || 'No transactions available.'}</p>
                            ) : (
                              selectedPluggyAccountTransactions.map((transaction) => {
                                const amount = Number(getNormalizedAmount?.(transaction) ?? transaction?.amount ?? 0)
                                const isIncome = amount >= 0
                                const rawDate = transaction?.date || transaction?.createdAt
                                const parsedDate = rawDate ? new Date(rawDate) : null
                                const dateLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
                                  ? new Intl.DateTimeFormat(text.connectionsBackLabel === 'Voltar' ? 'pt-BR' : 'en-US', { day: '2-digit', month: '2-digit' }).format(parsedDate)
                                  : '--'

                                return (
                                  <div key={transaction.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isLightMode ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-zinc-900/40'}`}>
                                    <div className="flex min-w-0 items-center gap-2 pr-3">
                                      <span
                                        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                                          isLightMode
                                            ? isIncome ? 'bg-emerald-100/80 text-[#22c55e]' : 'bg-rose-100/80 text-[#f87171]'
                                            : isIncome ? 'bg-emerald-500/10 text-[#22c55e]' : 'bg-rose-500/10 text-[#f87171]'
                                        }`}
                                      >
                                        {isIncome ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                                      </span>
                                      <div className="min-w-0">
                                        <p className={`truncate text-sm font-medium ${primaryTextClass}`}>{transaction?.description || text.uncategorized}</p>
                                        <p className={`text-xs ${secondaryTextClass}`}>{dateLabel}</p>
                                      </div>
                                    </div>
                                    <p className={`shrink-0 text-sm font-semibold ${isIncome ? 'text-[#22c55e]' : 'text-[#f87171]'}`}>
                                      {isIncome ? '+' : '-'}R$ {Math.abs(amount).toFixed(2)}
                                    </p>
                                  </div>
                                )
                              })
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}

            {selectedCreditAccounts.length > 0 && (
            <div>
              <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
                <CreditCard className="h-4 w-4 text-[#1f67ff]" />
                <span>{text.creditCards}</span>
              </div>

              <div className="space-y-2">
                {selectedCreditAccounts.map((account) => (
                  <div key={account.id} className={expandedPluggyAccountId === account.id ? '' : 'space-y-2'}>
                    <article
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setExpandedPluggyAccountId((current) => (current === account.id ? null : account.id))
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setExpandedPluggyAccountId((current) => (current === account.id ? null : account.id))
                        }
                      }}
                      className={`flex items-center justify-between border px-4 py-3 cursor-pointer ${expandedPluggyAccountId === account.id ? 'rounded-t-xl' : 'rounded-xl'} ${isLightMode ? 'border-zinc-300/60' : 'border-zinc-700/60'}`}
                    >
                      <div className="min-w-0 pr-3">
                        <p className={`truncate text-sm font-semibold ${primaryTextClass}`}>{account?.name || 'Card'}</p>
                        <p className={`truncate text-xs ${secondaryTextClass}`}>
                          {transactionCountByAccountId.get(account.id) || 0} {text.transactionCount}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="shrink-0 text-sm font-semibold text-[#f87171]">R$ {Math.abs(Number(account?.balance || 0)).toFixed(2)}</p>
                        <ChevronRight className={`h-4 w-4 transition-transform ${expandedPluggyAccountId === account.id ? 'rotate-90' : ''} ${secondaryTextClass}`} />
                      </div>
                    </article>

                    {expandedPluggyAccountId === account.id && (
                      <div className={`rounded-b-xl border border-t-0 p-3 ${isLightMode ? 'border-zinc-300/60 bg-zinc-50/60' : 'border-zinc-700/60 bg-zinc-900/35'}`}>
                        <h4 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
                          {text.connectionsTransactionsLabel || 'Transactions'}
                        </h4>
                        <div className="space-y-2">
                          {selectedPluggyAccountTransactions.length === 0 ? (
                            <p className={`text-xs ${secondaryTextClass}`}>{text.noTransactions || 'No transactions available.'}</p>
                          ) : (
                            selectedPluggyAccountTransactions.map((transaction) => {
                              const amount = Number(getNormalizedAmount?.(transaction) ?? transaction?.amount ?? 0)
                              const isIncome = amount >= 0
                              const rawDate = transaction?.date || transaction?.createdAt
                              const parsedDate = rawDate ? new Date(rawDate) : null
                              const dateLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
                                ? new Intl.DateTimeFormat(text.connectionsBackLabel === 'Voltar' ? 'pt-BR' : 'en-US', { day: '2-digit', month: '2-digit' }).format(parsedDate)
                                : '--'

                              return (
                                <div key={transaction.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isLightMode ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-zinc-900/40'}`}>
                                  <div className="flex min-w-0 items-center gap-2 pr-3">
                                    <span
                                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                                        isLightMode
                                          ? isIncome ? 'bg-emerald-100/80 text-[#22c55e]' : 'bg-rose-100/80 text-[#f87171]'
                                          : isIncome ? 'bg-emerald-500/10 text-[#22c55e]' : 'bg-rose-500/10 text-[#f87171]'
                                      }`}
                                    >
                                      {isIncome ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                                    </span>
                                    <div className="min-w-0">
                                      <p className={`truncate text-sm font-medium ${primaryTextClass}`}>{transaction?.description || text.uncategorized}</p>
                                      <p className={`text-xs ${secondaryTextClass}`}>{dateLabel}</p>
                                    </div>
                                  </div>
                                  <p className={`shrink-0 text-sm font-semibold ${isIncome ? 'text-[#22c55e]' : 'text-[#f87171]'}`}>
                                    {isIncome ? '+' : '-'}R$ {Math.abs(amount).toFixed(2)}
                                  </p>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}

            {selectedInvestments.length > 0 && (
            <div>
              <div className={`mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
                <TrendingUp className="h-4 w-4 text-[#1f67ff]" />
                <span>{text.investments}</span>
              </div>

              <div className="space-y-2">
                {selectedInvestments.map((investment) => (
                  <div key={investment.id} className={expandedPluggyAccountId === investment.id ? '' : 'space-y-2'}>
                    <article
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        setExpandedPluggyAccountId((current) => (current === investment.id ? null : investment.id))
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          setExpandedPluggyAccountId((current) => (current === investment.id ? null : investment.id))
                        }
                      }}
                      className={`flex items-center justify-between border px-4 py-3 cursor-pointer ${expandedPluggyAccountId === investment.id ? 'rounded-t-xl' : 'rounded-xl'} ${isLightMode ? 'border-zinc-300/60' : 'border-zinc-700/60'}`}
                    >
                      <div className="min-w-0 pr-3">
                        <p className={`truncate text-sm font-semibold ${primaryTextClass}`}>{investment?.name || getInstitutionName(investment)}</p>
                        <p className={`truncate text-xs ${secondaryTextClass}`}>
                          {investment?.type || 'FIXED_INCOME'} - {Number(investment?.numberOfTransactions || 1)} {text.connectionsMovements || 'movimentações'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="shrink-0 text-sm font-semibold text-[#22c55e]">R$ {getInvestmentValue(investment).toFixed(2)}</p>
                        <ChevronRight className={`h-4 w-4 transition-transform ${expandedPluggyAccountId === investment.id ? 'rotate-90' : ''} ${secondaryTextClass}`} />
                      </div>
                    </article>

                    {expandedPluggyAccountId === investment.id && (
                      <div className={`rounded-b-xl border border-t-0 p-3 ${isLightMode ? 'border-zinc-300/60 bg-zinc-50/60' : 'border-zinc-700/60 bg-zinc-900/35'}`}>
                        <h4 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
                          {text.connectionsTransactionsLabel || 'Transactions'}
                        </h4>
                        <div className="space-y-2">
                          {selectedPluggyAccountTransactions.length === 0 ? (
                            <p className={`text-xs ${secondaryTextClass}`}>{text.noTransactions || 'No transactions available.'}</p>
                          ) : (
                            selectedPluggyAccountTransactions.map((transaction) => {
                              const amount = Number(getNormalizedAmount?.(transaction) ?? transaction?.amount ?? 0)
                              const isIncome = amount >= 0
                              const rawDate = transaction?.date || transaction?.createdAt
                              const parsedDate = rawDate ? new Date(rawDate) : null
                              const dateLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
                                ? new Intl.DateTimeFormat(text.connectionsBackLabel === 'Voltar' ? 'pt-BR' : 'en-US', { day: '2-digit', month: '2-digit' }).format(parsedDate)
                                : '--'

                              return (
                                <div key={transaction.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${isLightMode ? 'border-zinc-300 bg-white' : 'border-zinc-700 bg-zinc-900/40'}`}>
                                  <div className="flex min-w-0 items-center gap-2 pr-3">
                                    <span
                                      className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                                        isLightMode ? 'bg-sky-100/80 text-[#60a5fa]' : 'bg-sky-500/10 text-[#60a5fa]'
                                      }`}
                                    >
                                      {isIncome ? <ArrowDownRight className="h-3.5 w-3.5" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                                    </span>
                                    <div className="min-w-0">
                                      <p className={`truncate text-sm font-medium ${primaryTextClass}`}>{transaction?.description || text.uncategorized}</p>
                                      <p className={`text-xs ${secondaryTextClass}`}>{dateLabel}</p>
                                    </div>
                                  </div>
                                  <p className="shrink-0 text-sm font-semibold text-[#60a5fa]">
                                    {isIncome ? '+' : '-'}R$ {Math.abs(amount).toFixed(2)}
                                  </p>
                                </div>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        </article>
      )}

      {!selectedConnection && (
      <article className={`${glassCardClass} w-full overflow-hidden`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${cardSubtleDividerClass}`}>
          <div className="flex items-center gap-2">
            <Link2 className="h-[18px] w-[18px] text-[#1f67ff]" />
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.navConnections}</h3>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              {connections.length} {text.connectionsActiveLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={exportBackup} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-blue-500/50 bg-blue-500/10 px-3 text-xs font-semibold text-blue-400 transition hover:bg-blue-500/20" title="Download backup of your connections and data">
              <Download className="h-4 w-4" />
              <span>{text.connectionsExportBackup || 'Export'}</span>
            </button>
            <button type="button" onClick={triggerFileInput} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-green-500/50 bg-green-500/10 px-3 text-xs font-semibold text-green-400 transition hover:bg-green-500/20" title="Restore backup from a JSON file">
              <Upload className="h-4 w-4" />
              <span>{text.connectionsImportBackup || 'Import'}</span>
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            <button type="button" onClick={openCredentialsModal} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#1f67ff] px-3 text-xs font-semibold text-white">
              <Plus className="h-4 w-4" />
              <span>{text.connectionsNewConnection}</span>
            </button>
          </div>
        </div>

        {backupImportFeedback && (
          <div className={`px-4 py-2 text-center text-sm ${backupImportFeedbackType === 'success' ? (isLightMode ? 'bg-green-50 text-green-700' : 'bg-green-950/30 text-green-300') : backupImportFeedbackType === 'error' ? (isLightMode ? 'bg-red-50 text-red-600' : 'bg-red-950/30 text-red-300') : (isLightMode ? 'bg-blue-50 text-blue-600' : 'bg-blue-950/30 text-blue-300')}`}>
            {backupImportFeedback}
          </div>
        )}

        <div className="p-4">
          {connections.length === 0 ? (
            <p className={`text-sm ${secondaryTextClass}`}>{text.connectionsNoConnections}</p>
          ) : (
            <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {connections.map((entry) => {
                const institution = getInstitutionName(entry)
                const logo = getBankLogo(entry)
                const isPhysicalWalletCard = isManualWalletConnection(entry)

                return (
                  <article key={entry.itemId} className={`w-full rounded-xl border p-4 ${isLightMode ? 'border-zinc-300/60 bg-transparent' : 'border-zinc-700/60 bg-transparent'}`}>
                    <div className="mb-4 flex items-start justify-between">
                      {logo ? (
                        <img src={logo} alt={institution} className="h-10 w-10 rounded-lg object-contain" />
                      ) : isPhysicalWalletCard ? (
                        <img
                          src={walletLogo}
                          alt={entry?.walletName || text.connectionsPhysicalTitle || 'Physical Wallet'}
                          className="h-10 w-10 rounded-lg object-contain"
                        />
                      ) : (
                        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${isLightMode ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-800 text-zinc-300'}`}>
                          {institution.slice(0, 2).toUpperCase()}
                        </span>
                      )}

                      <span className={`inline-flex h-2.5 w-2.5 rounded-full motion-safe:animate-pulse ${isPhysicalWalletCard ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]'}`} />
                    </div>

                    <p className={`text-[14px] font-semibold ${primaryTextClass}`}>
                      {isPhysicalWalletCard
                        ? (text.connectionsPhysicalConnectionLabel || 'Physical Wallet')
                        : `${text.connectionsBankLabel || 'Banco'} ${institution}`}
                    </p>
                    <p className={`mt-1 flex items-center gap-1.5 text-[12px]`}>
                      <Clock3 className={`h-[12px] w-[12px] ${secondaryTextClass}`} />
                      <span className={secondaryTextClass}>{formatRelativeSync(entry)}</span>
                      <span className={secondaryTextClass}>·</span>
                      <span className={`font-semibold ${isPhysicalWalletCard ? 'text-amber-400/80' : 'text-emerald-400/60'}`}>
                        {isPhysicalWalletCard ? (text.connectionsManualLabel || 'Manual') : (text.connectionsSyncLabel || 'Sincronizado')}
                      </span>
                    </p>

                    <div className={`mt-4 border-t pt-3 ${cardSubtleDividerClass}`}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedConnectionItemId(entry.itemId)
                          setExpandedManualAccountId(null)
                          setExpandedPluggyAccountId(null)
                          setIsManualTransactionFormOpen(false)
                          setManualTransactionError('')
                        }}
                        className={`inline-flex items-center gap-1 text-[12px] ${secondaryTextClass} transition-colors ${isLightMode ? 'hover:text-zinc-700' : 'hover:text-zinc-300'}`}
                      >
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
      )}


    </section>
  )
}

export default ConnectionsPage