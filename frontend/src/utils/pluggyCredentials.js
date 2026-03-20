const PLUGGY_STORAGE_KEY = 'wallet-hub-pluggy-credentials-v1'

const normalizeItemIds = (value) => {
  if (!value) return []

  return value
    .split(/[\n,]/)
    .map((itemId) => itemId.trim())
    .filter(Boolean)
}

const getRawStoredCredentials = () => {
  try {
    const raw = localStorage.getItem(PLUGGY_STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    const clientId = typeof parsed?.clientId === 'string' ? parsed.clientId.trim() : ''
    const clientSecret = typeof parsed?.clientSecret === 'string' ? parsed.clientSecret.trim() : ''
    const itemIds = Array.isArray(parsed?.itemIds)
      ? parsed.itemIds.map((itemId) => String(itemId).trim()).filter(Boolean)
      : []

    if (!clientId || !clientSecret) return null
    return { clientId, clientSecret, itemIds }
  } catch {
    return null
  }
}

export const getStoredPluggyCredentials = () => {
  const credentials = getRawStoredCredentials()
  if (!credentials || credentials.itemIds.length === 0) return null
  return credentials
}

export const savePluggyCredentials = ({ clientId, clientSecret, itemIdsRaw }) => {
  const normalizedClientId = String(clientId || '').trim()
  const normalizedClientSecret = String(clientSecret || '').trim()
  const normalizedItemIds = normalizeItemIds(String(itemIdsRaw || ''))

  if (!normalizedClientId || !normalizedClientSecret || normalizedItemIds.length === 0) {
    throw new Error('Missing Pluggy credentials')
  }

  const payload = {
    clientId: normalizedClientId,
    clientSecret: normalizedClientSecret,
    itemIds: normalizedItemIds,
  }

  localStorage.setItem(PLUGGY_STORAGE_KEY, JSON.stringify(payload))
  return payload
}

export const getPluggyRequestHeaders = () => {
  const credentials = getStoredPluggyCredentials()
  if (!credentials) return {}

  return {
    'x-pluggy-client-id': credentials.clientId,
    'x-pluggy-client-secret': credentials.clientSecret,
    'x-pluggy-item-ids': credentials.itemIds.join(','),
  }
}

export const getPluggyCredentialsDraft = () => {
  const credentials = getRawStoredCredentials()
  if (!credentials) {
    return {
      clientId: '',
      clientSecret: '',
      itemIdsRaw: '',
    }
  }

  return {
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    itemIdsRaw: credentials.itemIds.join(', '),
  }
}

export const removeStoredPluggyItemId = (itemIdToRemove) => {
  const credentials = getRawStoredCredentials()
  if (!credentials) return null

  const normalizedTarget = String(itemIdToRemove || '').trim()
  if (!normalizedTarget) return credentials

  const nextItemIds = credentials.itemIds.filter((itemId) => itemId !== normalizedTarget)

  localStorage.setItem(
    PLUGGY_STORAGE_KEY,
    JSON.stringify({
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
      itemIds: nextItemIds,
    }),
  )

  return {
    ...credentials,
    itemIds: nextItemIds,
  }
}

export const clearStoredPluggyCredentials = () => {
  localStorage.removeItem(PLUGGY_STORAGE_KEY)
}
