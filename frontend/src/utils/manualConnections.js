import walletLogo from '../assets/bank-wallet.png'

const MANUAL_CONNECTIONS_STORAGE_KEY = 'wallet_hub_manual_connections'
const MANUAL_WALLET_TRANSACTIONS_STORAGE_KEY = 'wallet_hub_manual_wallet_transactions'

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
      logo: connection.logo || walletLogo,
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
  entry?.connectionType === 'MANUAL_WALLET' || entry?.connectionType === 'PHYSICAL_WALLET'

export const getStoredManualConnections = () => {
  try {
    const raw = localStorage.getItem(MANUAL_CONNECTIONS_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((entry) => isManualWalletConnection(entry) && entry?.itemId)
  } catch {
    return []
  }
}

export const saveStoredManualConnections = (connections) => {
  localStorage.setItem(MANUAL_CONNECTIONS_STORAGE_KEY, JSON.stringify(connections))
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
  logo: connection.logo || walletLogo,
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
