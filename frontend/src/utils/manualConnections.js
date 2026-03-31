
const MANUAL_CONNECTIONS_STORAGE_KEY = 'wallet_hub_manual_connections'
const MANUAL_WALLET_TRANSACTIONS_STORAGE_KEY = 'wallet_hub_manual_wallet_transactions'
const MANUAL_WALLET_CONNECTION_TYPES = new Set(['MANUAL_WALLET', 'PHYSICAL_WALLET'])

const parseStoredConnections = () => {
  try {
    const raw = localStorage.getItem(MANUAL_CONNECTIONS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveStoredConnections = (connections) => {
  localStorage.setItem(MANUAL_CONNECTIONS_STORAGE_KEY, JSON.stringify(connections))
}

const parseConnectionBalance = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseTransactionsMap = () => {
  try {
    const raw = localStorage.getItem(MANUAL_WALLET_TRANSACTIONS_STORAGE_KEY)
    if (!raw) return {}

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

const saveTransactionsMap = (map) => {
  localStorage.setItem(MANUAL_WALLET_TRANSACTIONS_STORAGE_KEY, JSON.stringify(map))
}

const buildManualWalletTransaction = ({ connection, description, amount, date, text }) => {
  const createdAt = new Date().toISOString()
  const effectiveDate = date || createdAt

  return {
    id: `${connection.id}-${Date.now()}`,
    accountId: connection.id,
    account: {
      id: connection.id,
      type: 'BANK',
      connectionType: 'MANUAL_WALLET',
      name: connection.walletName,
      marketingName: connection.walletName,
      itemId: connection.itemId,
      logo: '/physical-wallet.png',
    },
    amount,
    description: description || text.connectionsPhysicalAddedTransaction || 'Physical money added',
    category: text.connectionsPhysicalCategory || 'Physical wallet',
    date: effectiveDate,
    paymentDate: effectiveDate,
    createdAt,
  }
}

export const isManualWalletConnection = (entry) =>
  MANUAL_WALLET_CONNECTION_TYPES.has(entry?.connectionType)

export const isManualImportConnection = (entry) => entry?.connectionType === 'MANUAL_IMPORT'

const parseCsvRow = (row) => {
  const result = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < row.length; index += 1) {
    const char = row[index]

    if (char === '"') {
      const escapedQuote = inQuotes && row[index + 1] === '"'
      if (escapedQuote) {
        current += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  result.push(current.trim())
  return result
}

const parseDateIso = (value) => {
  const normalized = String(value || '').trim()
  if (!normalized) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return new Date(`${normalized}T12:00:00`).toISOString()
  }

  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

const parseAmountValue = (value) => {
  const normalized = String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/\.(?=\d{3}(\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '')

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const normalizeManualImportCategory = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (/benef(i|í)cio|benefit/.test(normalized)) return 'Benefits'
  return 'Financial'
}

const toInstitutionSlug = (value) => {
  const normalized = String(value || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || 'manual-institution'
}

const getManualImportInstitutionItemId = (institutionName) => `manual-import-${toInstitutionSlug(institutionName)}`

const buildTransactionFingerprint = (transaction) => {
  const dateValue = String(transaction?.date || transaction?.paymentDate || '').slice(0, 10)
  const descriptionValue = String(transaction?.description || '').trim().toLowerCase()
  const categoryValue = String(transaction?.category || '').trim().toLowerCase()
  const amountValue = Number(transaction?.amount || 0).toFixed(2)

  return `${dateValue}|${descriptionValue}|${amountValue}|${categoryValue}`
}

export const parseManualCSV = (csvContent) => {
  if (typeof csvContent !== 'string') return []

  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = parseCsvRow(lines[0]).map((header) => String(header || '').replace(/^\uFEFF/, '').trim().toLowerCase())
  const dateIndex = headers.indexOf('date')
  const descriptionIndex = headers.indexOf('description')
  const amountIndex = headers.indexOf('amount')
  const categoryIndex = headers.findIndex((header) => header === 'category' || header === 'categoria')

  if ([dateIndex, descriptionIndex, amountIndex, categoryIndex].some((index) => index < 0)) {
    return []
  }

  return lines
    .slice(1)
    .map((line) => {
      const cells = parseCsvRow(line)
      const amount = parseAmountValue(cells[amountIndex])
      const date = parseDateIso(cells[dateIndex])
      const category = String(cells[categoryIndex] || '').trim()

      if (amount === null || !date) return null

      return {
        date,
        description: String(cells[descriptionIndex] || '').trim() || 'Manual import',
        amount,
        category,
        isTransfer: category.trim().toLowerCase() === 'transfer',
      }
    })
    .filter(Boolean)
}

export const getStoredManualConnections = () => {
  return parseStoredConnections().filter((entry) => isManualWalletConnection(entry) && entry?.itemId)
}

export const getStoredManualImportConnections = () => {
  const connections = parseStoredConnections()
  let hasChanges = false

  const normalizedConnections = connections.map((entry) => {
    if (!isManualImportConnection(entry)) return entry

    const expectedItemId = getManualImportInstitutionItemId(entry?.institutionName || entry?.marketingName || entry?.name)
    if (entry?.itemId === expectedItemId) return entry

    hasChanges = true
    return {
      ...entry,
      itemId: expectedItemId,
    }
  })

  if (hasChanges) {
    saveStoredConnections(normalizedConnections)
  }

  return normalizedConnections.filter((entry) => isManualImportConnection(entry) && entry?.itemId)
}

export const saveStoredManualConnections = (connections) => {
  // Get old wallet connections BEFORE making changes
  const oldWalletConnections = parseStoredConnections().filter((entry) => isManualWalletConnection(entry))
  const oldWalletIds = new Set(oldWalletConnections.map((entry) => entry?.id).filter(Boolean))

  const existingNonWalletConnections = parseStoredConnections().filter((entry) => !isManualWalletConnection(entry))
  const walletConnections = Array.isArray(connections)
    ? connections.filter((entry) => isManualWalletConnection(entry) && entry?.itemId)
    : []

  saveStoredConnections([...existingNonWalletConnections, ...walletConnections])

  // Clean up transactions for deleted wallet connections
  const newWalletIds = new Set(walletConnections.map((entry) => entry?.id).filter(Boolean))
  const map = parseTransactionsMap()
  let hasTransactionChanges = false

  oldWalletIds.forEach((walletId) => {
    if (!newWalletIds.has(walletId) && map[walletId]) {
      delete map[walletId]
      hasTransactionChanges = true
    }
  })

  if (hasTransactionChanges) {
    saveTransactionsMap(map)
  }
}

export const toPhysicalWalletAccount = (connection) => ({
  id: connection.id,
  itemId: connection.itemId,
  type: 'BANK',
  walletName: connection.walletName,
  name: connection.walletName,
  marketingName: connection.walletName,
  balance: parseConnectionBalance(connection.balance),
  currencyCode: connection.currency || 'BRL',
  connectionType: 'MANUAL_WALLET',
  createdAt: connection.createdAt,
  updatedAt: connection.updatedAt,
  logo: '/physical-wallet.png',
})

export const toPhysicalWalletTransaction = (connection, text) => {
  const balance = parseConnectionBalance(connection.balance)
  const createdAt = connection.createdAt || new Date().toISOString()

  return buildManualWalletTransaction({
    connection,
    description: text.connectionsPhysicalAddedTransaction || 'Physical money added',
    amount: balance,
    date: createdAt,
    text,
  })
}

export const toManualImportAccount = (connection) => ({
  id: connection.id,
  itemId: connection.itemId,
  type: 'BANK',
  name: connection.accountName,
  marketingName: connection.institutionName,
  institutionName: connection.institutionName,
  accountCategory: connection.accountCategory || 'Benefits',
  category: connection.category || 'Benefits',
  balance: parseConnectionBalance(connection.balance),
  currencyCode: connection.currency || 'BRL',
  connectionType: 'MANUAL_IMPORT',
  createdAt: connection.createdAt,
  updatedAt: connection.updatedAt,
})

export const getStoredManualImportTransactions = (connectionId) => {
  const map = parseTransactionsMap()
  return Array.isArray(map?.[connectionId]) ? map[connectionId] : []
}

export const removeStoredManualImportConnection = (connectionIdentifier) => {
  const connections = parseStoredConnections()
  const matchedConnections = connections.filter((entry) =>
    isManualImportConnection(entry)
      && (entry?.id === connectionIdentifier || entry?.itemId === connectionIdentifier),
  )

  const matchedConnectionIds = new Set(matchedConnections.map((entry) => entry?.id).filter(Boolean))

  const nextConnections = connections.filter((entry) => {
    if (!isManualImportConnection(entry)) return true
    return !matchedConnectionIds.has(entry?.id)
  })

  if (nextConnections.length !== connections.length) {
    saveStoredConnections(nextConnections)
  }

  const map = parseTransactionsMap()
  let hasTransactionChanges = false
  matchedConnectionIds.forEach((connectionId) => {
    if (!map[connectionId]) return
    delete map[connectionId]
    hasTransactionChanges = true
  })

  if (hasTransactionChanges) {
    saveTransactionsMap(map)
  }
}

export const removeStoredManualImportAccount = (connectionId) => {
  if (!connectionId) return false

  const connections = parseStoredConnections()
  const nextConnections = connections.filter((entry) => entry?.id !== connectionId)

  if (nextConnections.length === connections.length) {
    return false
  }

  saveStoredConnections(nextConnections)

  const map = parseTransactionsMap()
  if (map[connectionId]) {
    delete map[connectionId]
    saveTransactionsMap(map)
  }

  return true
}

export const saveManualImportConnectionFromCsv = ({ institutionName, accountName, accountCategory, currentBalance, csvContent }) => {
  const parsedTransactions = parseManualCSV(csvContent)
  if (parsedTransactions.length === 0) {
    return { connection: null, transactions: [] }
  }

  const id = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}`
  const nowIso = new Date().toISOString()
  const normalizedCategory = normalizeManualImportCategory(accountCategory)
  const institution = String(institutionName || '').trim()
  const parsedCurrentBalance = Number(currentBalance)
  const transactionsBalance = Number(parsedTransactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0).toFixed(2))
  const effectiveBalance = Number.isFinite(parsedCurrentBalance) ? parsedCurrentBalance : transactionsBalance

  const connection = {
    id,
    itemId: getManualImportInstitutionItemId(institution),
    connectionType: 'MANUAL_IMPORT',
    institutionName: institution,
    accountName: String(accountName || '').trim(),
    name: String(accountName || '').trim(),
    marketingName: institution,
    category: normalizedCategory,
    accountCategory: normalizedCategory,
    balance: Number(effectiveBalance.toFixed(2)),
    currency: 'BRL',
    type: 'BANK',
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  const account = toManualImportAccount(connection)
  const transactions = parsedTransactions.map((entry, index) => {
    const createdAt = new Date().toISOString()

    return {
      id: `${connection.id}-csv-${index}-${Date.now()}`,
      accountId: connection.id,
      itemId: connection.itemId,
      account,
      amount: Number(entry.amount) || 0,
      description: entry.description,
      category: entry.category || ((Number(entry.amount) || 0) < 0 ? 'Expense' : 'Income'),
      date: entry.date,
      paymentDate: entry.date,
      createdAt,
      isTransfer: Boolean(entry.isTransfer),
    }
  })

  const storedConnections = parseStoredConnections()
  saveStoredConnections([...storedConnections, connection])

  const map = parseTransactionsMap()
  map[connection.id] = transactions
  saveTransactionsMap(map)

  return { connection, transactions }
}

export const updateManualImportConnectionFromCsv = ({ connectionId, csvContent }) => {
  if (!connectionId) {
    return { success: false, netChange: 0, addedTransactions: 0, connection: null }
  }

  const parsedTransactions = parseManualCSV(csvContent)
  if (parsedTransactions.length === 0) {
    return { success: false, netChange: 0, addedTransactions: 0, connection: null }
  }

  const connections = parseStoredConnections()
  const targetConnection = connections.find((entry) => entry?.id === connectionId && isManualImportConnection(entry))
  if (!targetConnection) {
    return { success: false, netChange: 0, addedTransactions: 0, connection: null }
  }

  const map = parseTransactionsMap()
  const currentEntries = Array.isArray(map?.[connectionId]) ? map[connectionId] : []
  const existingFingerprints = new Set(currentEntries.map((entry) => buildTransactionFingerprint(entry)))

  const newEntries = parsedTransactions
    .filter((entry) => !existingFingerprints.has(buildTransactionFingerprint(entry)))
    .map((entry, index) => ({
      id: `${targetConnection.id}-csv-update-${index}-${Date.now()}`,
      accountId: targetConnection.id,
      itemId: targetConnection.itemId,
      account: toManualImportAccount(targetConnection),
      amount: Number(entry.amount) || 0,
      description: entry.description,
      category: entry.category || ((Number(entry.amount) || 0) < 0 ? 'Expense' : 'Income'),
      date: entry.date,
      paymentDate: entry.date,
      createdAt: new Date().toISOString(),
      isTransfer: Boolean(entry.isTransfer),
    }))

  if (newEntries.length === 0) {
    return { success: true, netChange: 0, addedTransactions: 0, connection: targetConnection }
  }

  const netChange = Number(newEntries.reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0).toFixed(2))
  map[connectionId] = [...currentEntries, ...newEntries]
  saveTransactionsMap(map)

  const nowIso = new Date().toISOString()
  const updatedConnections = connections.map((entry) => {
    if (entry?.id !== connectionId) return entry

    return {
      ...entry,
      balance: Number((parseConnectionBalance(entry.balance) + netChange).toFixed(2)),
      updatedAt: nowIso,
    }
  })

  saveStoredConnections(updatedConnections)

  const updatedConnection = updatedConnections.find((entry) => entry?.id === connectionId) || null
  if (updatedConnection) {
    const updatedAccount = toManualImportAccount(updatedConnection)
    map[connectionId] = (map[connectionId] || []).map((entry) => ({
      ...entry,
      account: entry?.accountId === connectionId ? updatedAccount : entry?.account,
    }))
    saveTransactionsMap(map)
  }

  return {
    success: true,
    netChange,
    addedTransactions: newEntries.length,
    connection: updatedConnection,
  }
}

export const getStoredManualWalletTransactions = (connectionId, text, connection) => {
  const map = parseTransactionsMap()
  const rawEntries = Array.isArray(map?.[connectionId]) ? map[connectionId] : []

  if (rawEntries.length > 0) {
    return rawEntries
  }

  if (connection) {
    return [toPhysicalWalletTransaction(connection, text)]
  }

  return []
}

export const initializeManualWalletTransactions = (connection, text) => {
  const map = parseTransactionsMap()
  if (Array.isArray(map?.[connection.id]) && map[connection.id].length > 0) {
    return map[connection.id]
  }

  const initialTransaction = toPhysicalWalletTransaction(connection, text)
  map[connection.id] = [initialTransaction]
  saveTransactionsMap(map)
  return map[connection.id]
}

export const appendManualWalletTransaction = ({ connectionId, description, amount, type, date, text }) => {
  const allConnections = getStoredManualConnections()
  const targetConnection = allConnections.find((entry) => entry?.id === connectionId)
  if (!targetConnection) return null

  const absoluteAmount = Math.abs(Number(amount) || 0)
  if (absoluteAmount <= 0) return null

  const signedAmount = type === 'EXPENSE' ? -absoluteAmount : absoluteAmount
  const normalizedDate = date ? new Date(`${date}T12:00:00`).toISOString() : new Date().toISOString()

  const newTransaction = buildManualWalletTransaction({
    connection: targetConnection,
    description,
    amount: signedAmount,
    date: normalizedDate,
    text,
  })

  const map = parseTransactionsMap()
  const currentEntries = getStoredManualWalletTransactions(connectionId, text, targetConnection)
  map[connectionId] = [...currentEntries, newTransaction]
  saveTransactionsMap(map)

  const nextConnections = allConnections.map((entry) => {
    if (entry?.id !== connectionId) return entry

    return {
      ...entry,
      balance: parseConnectionBalance(entry.balance) + signedAmount,
      updatedAt: new Date().toISOString(),
    }
  })

  saveStoredManualConnections(nextConnections)

  return {
    transaction: newTransaction,
    connection: nextConnections.find((entry) => entry?.id === connectionId) || null,
  }
}
