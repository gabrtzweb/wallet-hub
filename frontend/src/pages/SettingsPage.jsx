import { useEffect, useMemo, useState, useRef } from 'react'

import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, CirclePlus, Clock3, Cloud, Copy, CreditCard, Download, Eye, EyeOff, FileText, Landmark, Link2, Pencil, Plus, TrendingUp, Trash2, Upload, UserCircle2, Wallet, X } from 'lucide-react'
import { getBankLogoFallbackUrl, getBankLogoUrl } from '../utils/logoResolver'
import { getInstitutionName, getInvestmentValue } from '../config/dashboardConfig'
import { exportBackup, importBackup } from '../utils/backupExport'
import { clearStoredPluggyCredentials, getPluggyCredentialsDraft, removeStoredPluggyItemId, savePluggyCredentials } from '../utils/pluggyCredentials'
import {
  appendManualWalletTransaction,
  isManualImportConnection,
  getStoredManualConnections,
  removeStoredManualImportAccount,
  removeStoredManualImportConnection,
  saveManualImportConnectionFromCsv,
  updateManualImportConnectionFromCsv,
  getStoredManualWalletTransactions,
  initializeManualWalletTransactions,
  isManualWalletConnection,
  saveStoredManualConnections,
  toPhysicalWalletAccount,
} from '../utils/manualConnections'

const getTodayInputDate = () => {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = String(now.getFullYear())
  return `${year}-${month}-${day}`
}
const CALENDAR_LOCALE = 'en-GB'

const toYearMonthDay = (displayDate) => {
  const raw = String(displayDate || '').trim()
  if (!raw) return ''

  const ymdMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (ymdMatch) {
    return raw
  }

  const dmyMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!dmyMatch) return ''

  const [, dayStr, monthStr, yearStr] = dmyMatch
  const day = Number(dayStr)
  const month = Number(monthStr)
  const year = Number(yearStr)

  const parsedDate = new Date(year, month - 1, day)
  const isValid =
    parsedDate.getFullYear() === year &&
    parsedDate.getMonth() === month - 1 &&
    parsedDate.getDate() === day

  if (!isValid) return ''

  return `${yearStr}-${monthStr}-${dayStr}`
}

const formatCalendarDate = (value, withYear = false) => {
  if (!value) return '--'

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return '--'

  const formatOptions = withYear
    ? { day: '2-digit', month: '2-digit', year: 'numeric' }
    : { day: '2-digit', month: '2-digit' }

  return new Intl.DateTimeFormat(CALENDAR_LOCALE, formatOptions).format(parsedDate)
}

const formatCalendarDateTime = (value) => {
  if (!value) return '--'

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return '--'

  return new Intl.DateTimeFormat(CALENDAR_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(parsedDate)
}

const getStoredUserProfile = () => {
  try {
    const rawProfile = localStorage.getItem('wallet_hub_user_profile')
    if (!rawProfile) return { name: '', photo: null }

    const parsed = JSON.parse(rawProfile)
    const normalizedName = String(parsed?.name || '').trim()
    return {
      name: normalizedName.toLowerCase() === 'usuario' || normalizedName.toLowerCase() === 'usuário'
        ? ''
        : normalizedName,
      photo: parsed?.photo || null,
    }
  } catch {
    return { name: '', photo: null }
  }
}

function SettingsPage({
  glassCardClass,
  cardSubtleDividerClass,
  isLightMode,
  primaryTextClass,
  secondaryTextClass,
  language = 'pt',
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
  const [csvImportForm, setCsvImportForm] = useState({ institutionName: '', accountName: '', accountCategory: 'Benefícios' })
  const [physicalWalletForm, setPhysicalWalletForm] = useState({ walletName: '', currentBalance: '', date: getTodayInputDate() })
  const [credentialsError, setCredentialsError] = useState('')
  const [showClientSecret, setShowClientSecret] = useState(false)
  const [copiedField, setCopiedField] = useState('')
  const [expandedManualAccountId, setExpandedManualAccountId] = useState(null)
  const [expandedPluggyAccountId, setExpandedPluggyAccountId] = useState(null)
  const [isManualTransactionFormOpen, setIsManualTransactionFormOpen] = useState(false)
  // removed unused manualTransactionsRefreshKey
  const [manualTransactionError, setManualTransactionError] = useState('')
  const [manualTransactionForm, setManualTransactionForm] = useState({
    description: '',
    amount: '',
    type: 'INCOME',
    date: getTodayInputDate(),
  })
  const [backupImportFeedback, setBackupImportFeedback] = useState('')
  const [backupImportFeedbackType, setBackupImportFeedbackType] = useState('')
  const [manualImportUpdateAccountId, setManualImportUpdateAccountId] = useState('')
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedConnectionIds, setSelectedConnectionIds] = useState([])
  const fileInputRef = useRef(null)
  const manualCsvFileInputRef = useRef(null)
  const manualImportUpdateFileInputRef = useRef(null)
  const profilePhotoInputRef = useRef(null)
  const profileNameInputRef = useRef(null)
  const [userProfile, setUserProfile] = useState(getStoredUserProfile)
  const [profileNameDraft, setProfileNameDraft] = useState(userProfile?.name || '')
  const [profilePhotoDraft, setProfilePhotoDraft] = useState(userProfile?.photo || null)
  const [profilePhotoError, setProfilePhotoError] = useState('')
  const [isEditingProfileName, setIsEditingProfileName] = useState(false)
  const [isViewDataOpen, setIsViewDataOpen] = useState(false)
  const [storedDataPreview, setStoredDataPreview] = useState('')
  const userInitials = useMemo(() => {
    return String(profileNameDraft || userProfile?.name || '')
      .trim()
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [profileNameDraft, userProfile])

  const hasUnsavedProfileChanges = useMemo(() => {
    const normalizedDraftName = String(profileNameDraft || '').trim()
    const normalizedSavedName = String(userProfile?.name || '').trim()
    const normalizedDraftPhoto = profilePhotoDraft || null
    const normalizedSavedPhoto = userProfile?.photo || null

    return normalizedDraftName !== normalizedSavedName || normalizedDraftPhoto !== normalizedSavedPhoto
  }, [profileNameDraft, profilePhotoDraft, userProfile])

  const getStoredDataSnapshot = () => {
    const safeParse = (key) => {
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return null
        return JSON.parse(raw)
      } catch {
        return null
      }
    }

    return {
      generatedAt: new Date().toISOString(),
      data: {
        manualConnections: safeParse('wallet_hub_manual_connections'),
        manualWalletTransactions: safeParse('wallet_hub_manual_wallet_transactions'),
        pluggyCredentials: safeParse('wallet-hub-pluggy-credentials-v1'),
        userProfile: safeParse('wallet_hub_user_profile'),
      },
    }
  }

  useEffect(() => {
    const syncProfile = () => {
      const profile = getStoredUserProfile()
      setUserProfile(profile)
      setProfileNameDraft(profile?.name || '')
      setProfilePhotoDraft(profile?.photo || null)
      setProfilePhotoError('')
    }

    window.addEventListener('storage', syncProfile)
    window.addEventListener('wallet-hub-user-profile-updated', syncProfile)

    return () => {
      window.removeEventListener('storage', syncProfile)
      window.removeEventListener('wallet-hub-user-profile-updated', syncProfile)
    }
  }, [])

  const handleProfilePhotoChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setProfilePhotoError(text?.profilePhotoSizeError || 'File size must be less than 2MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (fileEvent) => {
      setProfilePhotoDraft(fileEvent.target?.result || null)
      setProfilePhotoError('')
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = () => {
    const nextProfile = {
      name: String(profileNameDraft || '').trim(),
      photo: profilePhotoDraft || null,
    }

    localStorage.setItem('wallet_hub_user_profile', JSON.stringify(nextProfile))
    setUserProfile(nextProfile)
    window.dispatchEvent(new Event('wallet-hub-user-profile-updated'))
  }

  const handleViewData = () => {
    const snapshot = getStoredDataSnapshot()
    setStoredDataPreview(JSON.stringify(snapshot, null, 2))
    setSelectedConnectionItemId(null)
    setExpandedManualAccountId(null)
    setExpandedPluggyAccountId(null)
    setIsManualTransactionFormOpen(false)
    setManualTransactionError('')
    setIsViewDataOpen(true)
  }

  const handleCloseViewData = () => {
    setIsViewDataOpen(false)
  }

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
  const isManualImportSelectedConnection = isManualImportConnection(selectedConnection)
  const isManualSelectedConnection = isPhysicalWalletConnection || isManualImportSelectedConnection
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
  }, [expandedManualAccountId, selectedConnectionItemId, selectedConnection, text])

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

  const parsedStoredDataPreview = useMemo(() => {
    if (!storedDataPreview) return null

    try {
      return JSON.parse(storedDataPreview)
    } catch {
      return null
    }
  }, [storedDataPreview])

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
    setCsvImportForm({ institutionName: '', accountName: '', accountCategory: 'Benefícios' })
    setPhysicalWalletForm({ walletName: '', currentBalance: '', date: getTodayInputDate() })
    setCredentialsError('')
    setShowClientSecret(false)
    setCopiedField('')
    setConnectionFlowStep('selection')
    setIsCredentialsModalOpen(true)
  }

  const closeCredentialsModal = () => {
    setIsCredentialsModalOpen(false)
    setCsvImportForm({ institutionName: '', accountName: '', accountCategory: 'Benefícios' })
    setPhysicalWalletForm({ walletName: '', currentBalance: '', date: getTodayInputDate() })
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

  const removeConnectionEntry = (entry) => {
    if (!entry) return

    if (entry?.itemId === 'manual-wallets-group' || entry?.connectionType === 'MANUAL_WALLET') {
      saveStoredManualConnections([])
      setManualConnections([])
      return
    }

    if (isManualImportConnection(entry)) {
      removeStoredManualImportConnection(entry?.itemId || entry?.id)
      return
    }

    removeStoredPluggyItemId(entry?.itemId)
  }

  const resetSelectionMode = () => {
    setIsSelectionMode(false)
    setSelectedConnectionIds([])
  }

  const handleDeleteConnection = async () => {
    if (!selectedConnection) return
    if (!window.confirm(text.connectionsDeleteConfirm || 'Deseja remover esta conexão dos seus item IDs?')) {
      return
    }

    removeConnectionEntry(selectedConnection)
    setSelectedConnectionItemId(null)
    setExpandedManualAccountId(null)
    setExpandedPluggyAccountId(null)
    setIsManualTransactionFormOpen(false)
    setManualTransactionError('')
    await onCredentialsSaved?.()
  }

  const handleDeleteConnectionFromGrid = async (entry) => {
    if (!entry) return
    if (!window.confirm(text.connectionsDeleteConfirm || 'Deseja remover esta conexão dos seus item IDs?')) {
      return
    }

    removeConnectionEntry(entry)
    setSelectedConnectionIds((current) => current.filter((itemId) => itemId !== entry?.itemId))
    await onCredentialsSaved?.()
  }

  const handleToggleConnectionSelection = (itemId) => {
    if (!itemId) return

    setSelectedConnectionIds((current) => {
      if (current.includes(itemId)) {
        return current.filter((value) => value !== itemId)
      }

      return [...current, itemId]
    })
  }

  const handleSelectAllConnections = () => {
    if (selectedConnectionIds.length === connections.length) {
      setSelectedConnectionIds([])
      return
    }

    setSelectedConnectionIds(connections.map((entry) => entry.itemId).filter(Boolean))
  }

  const handleDeleteSelectedConnections = async () => {
    if (selectedConnectionIds.length === 0) return

    if (!window.confirm(text.connectionsDeleteConfirmAll || 'Deseja remover as conexões selecionadas?')) {
      return
    }

    connections
      .filter((entry) => selectedConnectionIds.includes(entry.itemId))
      .forEach((entry) => {
        removeConnectionEntry(entry)
      })

    setSelectedConnectionItemId(null)
    setExpandedManualAccountId(null)
    setExpandedPluggyAccountId(null)
    setIsManualTransactionFormOpen(false)
    setManualTransactionError('')
    resetSelectionMode()
    await onCredentialsSaved?.()
  }

  const handleRemoveData = async () => {
    if (!window.confirm(text.connectionsRemoveDataConfirm || 'Deseja remover todas as conexões e resetar os dados de perfil?')) {
      return
    }

    saveStoredManualConnections([])
    setManualConnections([])
    clearStoredPluggyCredentials()
    setCredentialsForm(getPluggyCredentialsDraft())
    setCredentialsError('')
    setShowClientSecret(false)
    setCopiedField('')
    setSelectedConnectionItemId(null)
    setExpandedManualAccountId(null)
    setExpandedPluggyAccountId(null)
    setIsManualTransactionFormOpen(false)
    setManualTransactionError('')
    resetSelectionMode()

    localStorage.removeItem('wallet_hub_manual_wallet_transactions')
    localStorage.removeItem('wallet_hub_user_profile')
    setUserProfile({ name: '', photo: null })
    setProfileNameDraft('')
    setProfilePhotoDraft(null)
    setProfilePhotoError('')
    window.dispatchEvent(new Event('wallet-hub-user-profile-updated'))

    connections.forEach((entry) => {
      if (isManualImportConnection(entry)) {
        removeStoredManualImportConnection(entry?.itemId || entry?.id)
      }
    })

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

  const handleDeleteManualImportAccount = async (accountId) => {
    if (!accountId) return

    if (!window.confirm(text.connectionsDeleteConfirm || 'Deseja remover esta conexão?')) {
      return
    }

    const removed = removeStoredManualImportAccount(accountId)
    if (!removed) return

    setExpandedPluggyAccountId(null)
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
    const selectedDate = String(physicalWalletForm.date || '').trim()
    const selectedDateYmd = toYearMonthDay(selectedDate)
    const parsedBalance = Number(currentBalanceRaw)

    if (!walletName || !currentBalanceRaw || Number.isNaN(parsedBalance) || !selectedDateYmd) {
      setCredentialsError(text.connectionsPhysicalValidationError || 'Fill Wallet Name and Current Balance.')
      return
    }

    const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}`

    const selectedDateIso = new Date(`${selectedDateYmd}T12:00:00`).toISOString()
    const nowIso = new Date().toISOString()
    const newConnection = {
      id,
      itemId: `manual-wallet-${id}`,
      connectionType: 'MANUAL_WALLET',
      walletName,
      marketingName: walletName,
      balance: parsedBalance,
      currency: 'BRL',
      createdAt: selectedDateIso,
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

    setBackupImportFeedback(text.connectionsImportProcessing || 'Processing backup...')
    setBackupImportFeedbackType('loading')

    const result = await importBackup(file, language)

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

  const triggerManualCsvFileInput = () => {
    manualCsvFileInputRef.current?.click()
  }

  const triggerManualImportUpdateFileInput = (accountId) => {
    setManualImportUpdateAccountId(String(accountId || ''))
    manualImportUpdateFileInputRef.current?.click()
  }

  const handleManualImportUpdateFileSelected = async (event) => {
    const file = event.target?.files?.[0]
    const targetAccountId = String(manualImportUpdateAccountId || '').trim()

    if (!file || !targetAccountId) {
      if (manualImportUpdateFileInputRef.current) {
        manualImportUpdateFileInputRef.current.value = ''
      }
      return
    }

    try {
      const csvContent = await file.text()
      const updated = updateManualImportConnectionFromCsv({
        connectionId: targetAccountId,
        csvContent,
      })

      if (!updated?.success) {
        setCredentialsError(text.connectionsCsvValidationError || 'Fill Institution Name, Account Name and Account Category.')
      } else {
        setCredentialsError('')
        await onCredentialsSaved?.()
      }
    } catch {
      setCredentialsError(text.connectionsCsvFileRequiredError || 'Select a CSV file to continue.')
    }

    setManualImportUpdateAccountId('')
    if (manualImportUpdateFileInputRef.current) {
      manualImportUpdateFileInputRef.current.value = ''
    }
  }

  const handleManualCsvFileSelected = async (event) => {
    const file = event.target?.files?.[0]
    const institutionName = String(csvImportForm.institutionName || '').trim()
    const accountName = String(csvImportForm.accountName || '').trim()
    const accountCategory = String(csvImportForm.accountCategory || '').trim()
    if (!institutionName || !accountName || !accountCategory) {
      setCredentialsError(text.connectionsCsvValidationError || 'Fill Institution Name, Account Name and Account Category.')
      if (manualCsvFileInputRef.current) {
        manualCsvFileInputRef.current.value = ''
      }
      return
    }

    if (!file) {
      setCredentialsError(text.connectionsCsvFileRequiredError || 'Select a CSV file to continue.')
      return
    }

    try {
      const csvContent = await file.text()
      const saved = saveManualImportConnectionFromCsv({
        institutionName,
        accountName,
        accountCategory,
        csvContent,
      })

      if (!saved?.connection) {
        setCredentialsError(text.connectionsCsvValidationError || 'Fill Institution Name, Account Name and Account Category.')
        if (manualCsvFileInputRef.current) {
          manualCsvFileInputRef.current.value = ''
        }
        return
      }

      setCredentialsError('')
      closeCredentialsModal()
      setSelectedConnectionItemId(saved.connection.itemId)
      await onCredentialsSaved?.()
    } catch {
      setCredentialsError(text.connectionsCsvFileRequiredError || 'Select a CSV file to continue.')
    }

    if (manualCsvFileInputRef.current) {
      manualCsvFileInputRef.current.value = ''
    }
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

    const parsedTransactionDate = toYearMonthDay(manualTransactionForm.date)
    if (!parsedTransactionDate) {
      setManualTransactionError(text.connectionsTransactionDateValidation || 'Enter a valid date in DD/MM/YYYY format.')
      return
    }

    const saved = appendManualWalletTransaction({
      connectionId: expandedManualAccountId,
      description,
      amount: parsedAmount,
      type: manualTransactionForm.type,
      date: parsedTransactionDate,
      text,
    })

    if (!saved) {
      setManualTransactionError(text.connectionsManualTransactionSaveError || 'Could not save this transaction.')
      return
    }

    setManualConnections(getStoredManualConnections())
    setManualTransactionError('')
    setManualTransactionForm({ description: '', amount: '', type: 'INCOME', date: getTodayInputDate() })
    setIsManualTransactionFormOpen(false)
    await onCredentialsSaved?.()
  }

  return (
    <section className="w-full space-y-5">
      {isCredentialsModalOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-4">
            <article className={`w-full max-w-2xl ${glassCardClass} p-4 md:p-5`}>
              <div className="mb-3 flex items-center justify-between gap-3">
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
                        <span className={`block text-[14px] font-semibold leading-tight ${primaryTextClass}`}>{text.connectionsAutomatedTitle || 'Automated Connection (Pluggy)'}</span>
                        <span className={`mt-1 block text-[12px] leading-relaxed ${secondaryTextClass}`}>{text.connectionsAutomatedSubtitle || 'Sync automatically using your API keys.'}</span>
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
                        <span className={`block text-[14px] font-semibold leading-tight ${primaryTextClass}`}>{text.connectionsManualTitle || 'Manual Import (CSV)'}</span>
                        <span className={`mt-1 block text-[12px] leading-relaxed ${secondaryTextClass}`}>{text.connectionsManualSubtitle || 'Upload your exported statements.'}</span>
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
                        <span className={`block text-[14px] font-semibold leading-tight ${primaryTextClass}`}>{text.connectionsPhysicalTitle || 'Physical Wallet (Cash)'}</span>
                        <span className={`mt-1 block text-[12px] leading-relaxed ${secondaryTextClass}`}>{text.connectionsPhysicalSubtitle || 'Track physical cash or manual balances.'}</span>
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
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-500/50 bg-rose-500/10 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 md:w-auto md:gap-1.5 md:px-3"
                      >
                        {text.connectionsDisconnectLabel || 'Disconnect Pluggy'}
                      </button>

                      <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setConnectionFlowStep('selection')}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-500/50 bg-zinc-900 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800 md:w-auto md:gap-1.5 md:px-3"
                      >
                        {text.connectionsCancelLabel || 'Cancelar'}
                      </button>
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                      >
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
                        required
                        value={csvImportForm.institutionName}
                        onChange={(event) => {
                          setCsvImportForm((current) => ({ ...current, institutionName: event.target.value }))
                          if (credentialsError) setCredentialsError('')
                        }}
                        placeholder={text.connectionsCsvInstitutionPlaceholder || 'e.g. Inter, Nubank'}
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                      />
                    </label>
                    <label className="block">
                      <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsCsvAccountLabel || 'Account Name'}</span>
                      <input
                        type="text"
                        required
                        value={csvImportForm.accountName}
                        onChange={(event) => {
                          setCsvImportForm((current) => ({ ...current, accountName: event.target.value }))
                          if (credentialsError) setCredentialsError('')
                        }}
                        placeholder={text.connectionsCsvAccountPlaceholder || 'e.g. Main Checking'}
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                      />
                    </label>
                    <div className="block">
                      <span className={`mb-2 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsCsvAccountCategoryLabel || 'Account Category'}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setCsvImportForm((current) => ({ ...current, accountCategory: 'Financeira' }))
                            if (credentialsError) setCredentialsError('')
                          }}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                            csvImportForm.accountCategory === 'Financeira'
                              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                              : isLightMode
                                ? 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
                                : 'border-zinc-700 bg-zinc-900/40 text-zinc-300 hover:border-zinc-600'
                          }`}
                        >
                          {text.connectionsCsvCategoryFinanceira || 'Financeira'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCsvImportForm((current) => ({ ...current, accountCategory: 'Benefícios' }))
                            if (credentialsError) setCredentialsError('')
                          }}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                            csvImportForm.accountCategory === 'Benefícios'
                              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20'
                              : isLightMode
                                ? 'border-zinc-300 bg-white text-zinc-700 hover:border-zinc-400'
                                : 'border-zinc-700 bg-zinc-900/40 text-zinc-300 hover:border-zinc-600'
                          }`}
                        >
                          {text.connectionsCsvCategoryBeneficios || 'Benefícios'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-lg border-2 border-dashed p-8 text-center ${isLightMode ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-700 bg-zinc-900/30'}`}>
                    <Upload className={`mx-auto mb-3 h-12 w-12 ${secondaryTextClass}`} />
                    <p className={`mb-2 font-semibold ${primaryTextClass}`}>{text.connectionsManualDragDrop || 'Drag and drop your CSV file here'}</p>
                    <p className={`mb-4 text-sm ${secondaryTextClass}`}>{text.connectionsManualOrUpload || 'or'}</p>
                    <button
                      type="button"
                      onClick={triggerManualCsvFileInput}
                      className="inline-flex h-9 items-center rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-4 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                    >
                      {text.connectionsManualBrowseFiles || 'Browse files'}
                    </button>
                    <input
                      ref={manualCsvFileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleManualCsvFileSelected}
                      className="hidden"
                    />
                  </div>

                  {credentialsError && <p className="text-sm text-rose-400">{credentialsError}</p>}
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

                    <label className="block">
                      <span className={`mb-1 block text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>{text.connectionsTransactionDateLabel || 'Date'}</span>
                      <input
                        type="date"
                        lang="pt-BR"
                        value={physicalWalletForm.date}
                        onChange={(event) => {
                          setPhysicalWalletForm((current) => ({ ...current, date: event.target.value }))
                          if (credentialsError) setCredentialsError('')
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100'}`}
                      />
                    </label>

                    {credentialsError && <p className="text-sm text-rose-400">{credentialsError}</p>}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setConnectionFlowStep('selection')}
                        className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-500/50 bg-zinc-900 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-800 md:w-auto md:gap-1.5 md:px-3"
                      >
                        {text.connectionsCancelLabel || 'Cancelar'}
                      </button>
                      <button
                        type="submit"
                        className="inline-flex h-9 items-center rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
                      >
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
              {getBankLogoUrl(selectedConnection) ? (
                <img
                  src={getBankLogoUrl(selectedConnection)}
                  alt={getInstitutionName(selectedConnection)}
                  className="h-10 w-10 rounded-lg object-contain"
                  onError={(e) => {
                    const nextLogo = getBankLogoFallbackUrl(selectedConnection, e.currentTarget.src)
                    if (nextLogo) e.currentTarget.src = nextLogo
                  }}
                />
              ) : isPhysicalWalletConnection ? (
                <img
                  src="/physical-wallet.png"
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
                      : getInstitutionName(selectedConnection)}
                  </p>
                  <span className={`inline-flex h-2 w-2 rounded-full motion-safe:animate-pulse ${isManualSelectedConnection ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]'}`} />
                </div>
                <p className={`mt-1 flex items-center gap-1.5 text-[12px]`}>
                  <Clock3 className={`h-[12px] w-[12px] ${secondaryTextClass}`} />
                  <span className={secondaryTextClass}>{formatRelativeSync(selectedConnection)}</span>
                  {!isManualSelectedConnection && (
                    <>
                      <span className={secondaryTextClass}>·</span>
                      <span className={`text-[11px] ${secondaryTextClass}`}>{text.connectionsItemIdLabel || 'Item ID'}: {selectedConnection?.itemId || '--'}</span>
                    </>
                  )}
                  <span className={secondaryTextClass}>·</span>
                  <span className={`font-semibold ${isManualSelectedConnection ? 'text-amber-400/60' : 'text-emerald-400/60'}`}>
                    {isManualSelectedConnection ? (text.connectionsManualLabel || 'Manual') : (text.connectionsSyncLabel || 'Sincronizado')}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDeleteConnection}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/50 bg-rose-500/10 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 md:w-auto md:gap-1.5 md:px-3"
                title={isManualSelectedConnection ? text.connectionsDeleteAllWalletsHint || 'Remove this connection and all wallets' : ''}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{isManualSelectedConnection ? text.connectionsDeleteAllWalletsLabel || 'Remove all' : text.connectionsDelete || 'Excluir'}</span>
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
                          {(isPhysicalWalletConnection || isManualImportSelectedConnection) && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (isPhysicalWalletConnection) {
                                    handleDeleteManualWallet(account.id)
                                    return
                                  }

                                  handleDeleteManualImportAccount(account.id)
                                }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/50 bg-rose-500/10 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 md:w-auto md:gap-1.5 md:px-3"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="hidden md:inline">{text.connectionsDelete || 'Delete'}</span>
                              </button>
                              {isManualImportSelectedConnection && (
                                <button
                                  type="button"
                                  onClick={() => triggerManualImportUpdateFileInput(account.id)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-500/10 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 md:w-auto md:gap-1.5 md:px-3"
                                >
                                  <Upload className="h-3.5 w-3.5" />
                                  <span className="hidden md:inline">{text.connectionsUpdateBalanceLabel || 'Update balance'}</span>
                                </button>
                              )}
                              {isPhysicalWalletConnection && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsManualTransactionFormOpen((current) => !current)
                                    setManualTransactionError('')
                                  }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-500/10 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 md:w-auto md:gap-1.5 md:px-3"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                  <span className="hidden md:inline">{text.connectionsAddTransaction || 'Add transaction'}</span>
                                </button>
                              )}
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
                                  lang="pt-BR"
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
                                className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-500/50 bg-zinc-900 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800 md:w-auto md:gap-1.5 md:px-3"
                              >
                                {text.connectionsCancelLabel || 'Cancel'}
                              </button>
                              <button
                                type="submit"
                                className="inline-flex h-8 items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-500/10 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 md:w-auto md:gap-1.5 md:px-3"
                              >
                                {text.connectionsSaveTransactionLabel || 'Save transaction'}
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="max-h-[300px] overflow-y-auto pr-1 transaction-scrollbar">
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
                                    ? formatCalendarDate(parsedDate)
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
                                    ? formatCalendarDate(parsedDate)
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
                        <div className="max-h-[300px] overflow-y-auto pr-1 transaction-scrollbar">
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
                                  ? formatCalendarDate(parsedDate)
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
                        <div className="max-h-[300px] overflow-y-auto pr-1 transaction-scrollbar">
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
                                  ? formatCalendarDate(parsedDate)
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

      <input
        ref={manualImportUpdateFileInputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleManualImportUpdateFileSelected}
        className="hidden"
      />

      {isViewDataOpen && !selectedConnection && (
        <article className={`${glassCardClass} w-full overflow-hidden p-4 md:p-5`}>
          <button
            type="button"
            onClick={handleCloseViewData}
            className={`mb-5 inline-flex items-center gap-2 text-sm ${secondaryTextClass} ${isLightMode ? 'hover:text-zinc-700' : 'hover:text-zinc-300'}`}
          >
            <ChevronLeft className="h-4 w-4" />
            <span>{text.connectionsBack || text.navConnections}</span>
          </button>

          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${isLightMode ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/40 text-blue-300'}`}>
                <Eye className="h-5 w-5" />
              </span>
              <div>
                <p className={`text-[14px] font-semibold ${primaryTextClass}`}>{text?.settingsViewDataLabel || 'View data'}</p>
                <p className={`mt-1 text-[12px] ${secondaryTextClass}`}>
                  {parsedStoredDataPreview?.generatedAt
                    ? formatCalendarDateTime(parsedStoredDataPreview.generatedAt)
                    : '--'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`rounded-xl border p-4 ${isLightMode ? 'border-zinc-300/60 bg-zinc-50/60' : 'border-zinc-700/60 bg-zinc-900/35'}`}>
              <h4 className={`mb-3 text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
                {text?.settingsStoredDataLabel || 'Stored data'}
              </h4>

              <pre className={`max-h-[480px] overflow-auto whitespace-pre-wrap break-all rounded-lg border p-3 text-[11px] leading-5 ${isLightMode ? 'border-zinc-300/70 bg-white text-zinc-700' : 'border-zinc-700/70 bg-zinc-900/40 text-zinc-200'}`}>
                {storedDataPreview}
              </pre>
            </div>
          </div>
        </article>
      )}

      {!selectedConnection && !isViewDataOpen && (
      <div className="grid w-full grid-cols-1 gap-4 xl:grid-cols-3">
        <article className={`${glassCardClass} w-full overflow-hidden xl:col-span-2`}>
          <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${cardSubtleDividerClass}`}>
            <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
              <UserCircle2 className="h-4 w-4 text-[#1f67ff]" />
              <h3>{text?.settingsUserDataTitle || 'User data'}</h3>
            </div>

            <div className="flex h-8 w-[84px] items-center justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                className={`inline-flex h-8 items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-500/10 px-3 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 ${hasUnsavedProfileChanges ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
              >
                {text?.save || 'Save'}
              </button>
            </div>
          </div>

          <div className="space-y-4 p-4 md:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => profilePhotoInputRef.current?.click()}
                  className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full"
                  title={text?.profileUploadPhoto || 'Upload Photo'}
                >
                  {profilePhotoDraft ? (
                    <img src={profilePhotoDraft} alt={profileNameDraft || userProfile?.name || 'Username'} className="h-12 w-12 rounded-full object-cover" />
                  ) : (
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ${isLightMode ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-800 text-zinc-300'}`}>
                      {userInitials || 'UN'}
                    </span>
                  )}
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                    <Pencil className="h-4 w-4 text-white" />
                  </span>
                </button>

                <div className="group relative">
                  <input
                    ref={profileNameInputRef}
                    type="text"
                    value={profileNameDraft}
                    onChange={(event) => {
                      setProfileNameDraft(event.target.value)
                    }}
                    onFocus={() => setIsEditingProfileName(true)}
                    onBlur={() => {
                      setProfileNameDraft((current) => String(current || '').trim())
                      setIsEditingProfileName(false)
                    }}
                    placeholder={text?.profilePlaceholder || 'Username'}
                    className={`w-[220px] max-w-[55vw] rounded-lg border px-3 py-2 pr-9 text-sm font-medium transition ${isLightMode ? 'border-zinc-300 bg-white text-zinc-900 hover:border-zinc-400 focus:border-[#1f67ff]' : 'border-zinc-700 bg-zinc-900/80 text-zinc-100 hover:border-zinc-600 focus:border-[#1f67ff]'}`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingProfileName(true)
                      profileNameInputRef.current?.focus()
                    }}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100 ${isEditingProfileName ? 'opacity-100' : ''} ${secondaryTextClass}`}
                    aria-label={text?.profileEditName || 'Edit name'}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
                <input
                  ref={profilePhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />
              </div>
            </div>

            <div className="space-y-1">
              <p className={`text-xs ${secondaryTextClass}`}>{text?.profilePhotoHint || 'JPG, PNG up to 2MB'}</p>
              {profilePhotoError && <p className="text-xs text-rose-400">{profilePhotoError}</p>}
            </div>

            <div className={`border-t pt-3 ${cardSubtleDividerClass}`}>
              <button
                type="button"
                disabled
                aria-label={text?.settingsUserInformationLabel || 'User information'}
                className={`inline-flex items-center gap-1 bg-transparent p-0 text-[12px] ${secondaryTextClass} transition-colors ${isLightMode ? 'hover:text-zinc-700' : 'hover:text-zinc-300'} cursor-not-allowed border-0`}
                title={text?.settingsUserInformationLabel || 'User information'}
              >
                <span>{text?.settingsUserInformationLabel || 'User information'}</span>
                <ChevronRight className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        </article>

        <article className={`${glassCardClass} w-full overflow-hidden`}>
          <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${cardSubtleDividerClass}`}>
            <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
              <Cloud className="h-4 w-4 text-[#1f67ff]" />
              <h3>
              {text?.settingsDataActionsTitle || 'Data actions'}
              </h3>
            </div>

            <div className="h-8 w-[84px]" aria-hidden="true" />
          </div>

          <div className="space-y-3 p-4 md:p-5">
            <p className={`text-xs ${secondaryTextClass}`}>
              {text?.settingsDataActionsDescription || 'Manage backup and account data actions.'}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleViewData}
                aria-label={text?.settingsViewDataLabel || 'View data'}
                className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${isLightMode ? 'border-zinc-300 bg-white text-zinc-700 hover:border-[#1f67ff] hover:text-[#1f67ff]' : 'border-zinc-700 bg-zinc-900/40 text-zinc-200 hover:border-[#1f67ff] hover:text-[#93c5fd]'}`}
                title={text?.settingsViewDataLabel || 'View data'}
              >
                <Eye className="h-4 w-4" />
                <span>{text?.settingsViewDataLabel || 'View data'}</span>
              </button>
              <button
                type="button"
                onClick={handleRemoveData}
                aria-label={text.connectionsRemoveDataLabel || 'Remove data'}
                className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${isLightMode ? 'border-zinc-300 bg-white text-zinc-700 hover:border-[#1f67ff] hover:text-[#1f67ff]' : 'border-zinc-700 bg-zinc-900/40 text-zinc-200 hover:border-[#1f67ff] hover:text-[#93c5fd]'}`}
                title={text.connectionsRemoveDataLabel || 'Remove data'}
              >
                <Trash2 className="h-4 w-4" />
                <span>{text.connectionsRemoveDataLabel || 'Remove data'}</span>
              </button>
              <button
                type="button"
                onClick={exportBackup}
                aria-label={text.connectionsExportBackup || 'Export'}
                className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${isLightMode ? 'border-zinc-300 bg-white text-zinc-700 hover:border-[#1f67ff] hover:text-[#1f67ff]' : 'border-zinc-700 bg-zinc-900/40 text-zinc-200 hover:border-[#1f67ff] hover:text-[#93c5fd]'}`}
                title="Download backup of your connections and profile"
              >
                <Download className="h-4 w-4" />
                <span>{text.connectionsExportBackup || 'Export'}</span>
              </button>
              <button
                type="button"
                onClick={triggerFileInput}
                aria-label={text.connectionsImportBackup || 'Import'}
                className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition ${isLightMode ? 'border-zinc-300 bg-white text-zinc-700 hover:border-[#1f67ff] hover:text-[#1f67ff]' : 'border-zinc-700 bg-zinc-900/40 text-zinc-200 hover:border-[#1f67ff] hover:text-[#93c5fd]'}`}
                title="Restore backup from a JSON file"
              >
                <Upload className="h-4 w-4" />
                <span>{text.connectionsImportBackup || 'Import'}</span>
              </button>
            </div>

            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />

            {backupImportFeedback && (
              <div className={`rounded-lg px-4 py-2 text-center text-sm ${backupImportFeedbackType === 'success' ? (isLightMode ? 'bg-green-50 text-green-700' : 'bg-green-950/30 text-green-300') : backupImportFeedbackType === 'error' ? (isLightMode ? 'bg-red-50 text-red-600' : 'bg-red-950/30 text-red-300') : (isLightMode ? 'bg-blue-50 text-blue-600' : 'bg-blue-950/30 text-blue-300')}`}>
                {backupImportFeedback}
              </div>
            )}
          </div>
        </article>
      </div>
      )}

      {!selectedConnection && !isViewDataOpen && (
      <article className={`${glassCardClass} w-full overflow-hidden`}>
        <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 ${cardSubtleDividerClass}`}>
          <div className="flex items-center gap-2">
            <Link2 className="h-[18px] w-[18px] text-[#1f67ff]" />
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${secondaryTextClass}`}>
              {language === 'pt' ? 'Conexoes' : 'Connections'}
            </h3>
            <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              {connections.length} {text.connectionsActiveLabel}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isSelectionMode && (
              <>
                <button
                  type="button"
                  onClick={handleSelectAllConnections}
                  aria-label={text.connectionsSelectAllLabel || 'Select all'}
                  className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-400/50 bg-zinc-900/40 px-3 text-xs font-semibold text-zinc-100 transition hover:bg-zinc-800"
                  disabled={connections.length === 0}
                >
                  {selectedConnectionIds.length === connections.length
                    ? (text.connectionsCancelLabel || 'Cancel')
                    : (text.connectionsSelectAllLabel || 'Select all')}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelectedConnections}
                  aria-label={text.connectionsDeleteSelectedLabel || 'Remove selected'}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/50 bg-rose-500/10 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 md:w-auto md:gap-1.5 md:px-3"
                  disabled={selectedConnectionIds.length === 0}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden md:inline">{text.connectionsDeleteSelectedLabel || 'Remove selected'}</span>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => {
                if (isSelectionMode) {
                  resetSelectionMode()
                  return
                }

                setIsSelectionMode(true)
              }}
              aria-label={text.connectionsSelectionLabel || 'Selection'}
              className={`inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-semibold transition ${isSelectionMode ? 'border-[#1f67ff] bg-[rgba(31,103,255,0.25)] text-[#93c5fd]' : isLightMode ? 'border-zinc-300 bg-white text-zinc-700 hover:border-[#1f67ff] hover:text-[#1f67ff]' : 'border-zinc-700 bg-zinc-900/40 text-zinc-200 hover:border-[#1f67ff] hover:text-[#93c5fd]'}`}
            >
              {isSelectionMode ? (text.connectionsCancelLabel || 'Cancel') : (text.connectionsSelectionLabel || 'Selection')}
            </button>
            <button
              type="button"
              onClick={openCredentialsModal}
              aria-label={text.connectionsNewConnection}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/50 bg-cyan-500/10 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 md:w-auto md:gap-1.5 md:px-3"
            >
              <CirclePlus className="h-4 w-4" />
              <span className="hidden md:inline">{text.connectionsNewConnection}</span>
            </button>
          </div>
        </div>

        <div className="p-4">
          {connections.length === 0 ? (
            <p className={`text-sm ${secondaryTextClass}`}>{text.connectionsNoConnections}</p>
          ) : (
            <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              {connections.map((entry) => {
                const institution = getInstitutionName(entry)
                const logo = getBankLogoUrl(entry)
                const isPhysicalWalletCard = isManualWalletConnection(entry)
                const isManualImportCard = isManualImportConnection(entry)
                const isManualCard = isPhysicalWalletCard || isManualImportCard

                return (
                  <article key={entry.itemId} className={`card-interactive relative w-full rounded-xl border bg-transparent p-4 hover:-translate-y-0.5 ${isLightMode ? 'border-zinc-300/60' : 'border-zinc-700/60'}`}>
                    {isSelectionMode && (
                      <div className="absolute right-2 top-2 z-10 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleConnectionSelection(entry.itemId)}
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-[10px] font-bold ${selectedConnectionIds.includes(entry.itemId) ? 'border-[#1f67ff] bg-[rgba(31,103,255,0.85)] text-white' : isLightMode ? 'border-zinc-300 bg-white text-zinc-700' : 'border-zinc-700 bg-zinc-900 text-zinc-300'}`}
                          aria-label={selectedConnectionIds.includes(entry.itemId) ? 'Unselect connection' : 'Select connection'}
                        >
                          {selectedConnectionIds.includes(entry.itemId) ? '✓' : ''}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteConnectionFromGrid(entry)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-rose-500/50 bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20"
                          aria-label={text.connectionsDelete || 'Remove'}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    <div className="mb-4 flex items-start justify-between">
                      {logo ? (
                        <img
                          src={logo}
                          alt={institution}
                          className="h-10 w-10 rounded-lg object-contain"
                          onError={(e) => {
                            const nextLogo = getBankLogoFallbackUrl(entry, e.currentTarget.src)
                            if (nextLogo) e.currentTarget.src = nextLogo
                          }}
                        />
                      ) : isPhysicalWalletCard ? (
                        <img
                          src="/physical-wallet.png"
                          alt={entry?.walletName || text.connectionsPhysicalTitle || 'Physical Wallet'}
                          className="h-10 w-10 rounded-lg object-contain"
                        />
                      ) : (
                        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${isLightMode ? 'bg-zinc-200 text-zinc-700' : 'bg-zinc-800 text-zinc-300'}`}>
                          {institution.slice(0, 2).toUpperCase()}
                        </span>
                      )}

                      <span className={`inline-flex h-2.5 w-2.5 rounded-full motion-safe:animate-pulse ${isManualCard ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(74,222,128,0.9)]'}`} />
                    </div>

                    <p className={`text-[14px] font-semibold ${primaryTextClass}`}>
                      {isPhysicalWalletCard
                        ? (text.connectionsPhysicalConnectionLabel || 'Physical Wallet')
                        : institution}
                    </p>
                    <p className={`mt-1 flex items-center gap-1.5 text-[12px]`}>
                      <Clock3 className={`h-[12px] w-[12px] ${secondaryTextClass}`} />
                      <span className={secondaryTextClass}>{formatRelativeSync(entry)}</span>
                      <span className={secondaryTextClass}>·</span>
                      <span className={`font-semibold ${isManualCard ? 'text-amber-400/60' : 'text-emerald-400/60'}`}>
                        {isManualCard ? (text.connectionsManualLabel || 'Manual') : (text.connectionsSyncLabel || 'Sincronizado')}
                      </span>
                    </p>

                    <div className={`mt-4 border-t pt-3 ${cardSubtleDividerClass}`}>
                      <button
                        type="button"
                        onClick={() => {
                          if (isSelectionMode) {
                            handleToggleConnectionSelection(entry.itemId)
                            return
                          }

                          setIsViewDataOpen(false)
                          setSelectedConnectionItemId(entry.itemId)
                          setExpandedManualAccountId(null)
                          setExpandedPluggyAccountId(null)
                          setIsManualTransactionFormOpen(false)
                          setManualTransactionError('')
                        }}
                        className={`inline-flex items-center gap-1 text-[12px] ${secondaryTextClass} transition-colors ${isLightMode ? 'hover:text-zinc-700' : 'hover:text-zinc-300'}`}
                      >
                        <span>{isSelectionMode ? (text.connectionsSelectionLabel || 'Selection') : text.connectionsSeeDetails}</span>
                        {!isSelectionMode && <ChevronRight className="h-[18px] w-[18px]" />}
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

export default SettingsPage