/**
 * Export backup utility for Wallet Hub
 * Exports localStorage data to a JSON file for backup and recovery purposes
 */

const STORAGE_KEYS = {
  MANUAL_CONNECTIONS: 'wallet_hub_manual_connections',
  MANUAL_WALLET_TRANSACTIONS: 'wallet_hub_manual_wallet_transactions',
  PLUGGY_CREDENTIALS: 'wallet-hub-pluggy-credentials-v1',
}

/**
 * Retrieves all backup data from localStorage
 * @returns {Object} Combined backup data object
 */
const getBackupData = () => {
  const backupData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    data: {
      manualConnections: null,
      manualWalletTransactions: null,
      pluggyCredentials: null,
    },
  }

  // Retrieve manual connections
  try {
    const manualConnections = localStorage.getItem(STORAGE_KEYS.MANUAL_CONNECTIONS)
    if (manualConnections) {
      backupData.data.manualConnections = JSON.parse(manualConnections)
    }
  } catch (error) {
    console.error('Error retrieving manual connections:', error)
  }

  // Retrieve manual wallet transactions
  try {
    const transactions = localStorage.getItem(STORAGE_KEYS.MANUAL_WALLET_TRANSACTIONS)
    if (transactions) {
      backupData.data.manualWalletTransactions = JSON.parse(transactions)
    }
  } catch (error) {
    console.error('Error retrieving manual wallet transactions:', error)
  }

  // Retrieve Pluggy credentials (note: this is sensitive data)
  try {
    const credentials = localStorage.getItem(STORAGE_KEYS.PLUGGY_CREDENTIALS)
    if (credentials) {
      backupData.data.pluggyCredentials = JSON.parse(credentials)
    }
  } catch (error) {
    console.error('Error retrieving Pluggy credentials:', error)
  }

  return backupData
}

/**
 * Exports backup data as a JSON file that downloads to the user's device
 */
export const exportBackup = () => {
  try {
    // Get all backup data
    const backupData = getBackupData()

    // Convert to formatted JSON string
    const jsonString = JSON.stringify(backupData, null, 2)

    // Create a Blob from the JSON string
    const blob = new Blob([jsonString], { type: 'application/json' })

    // Generate a temporary download link
    const downloadLink = URL.createObjectURL(blob)

    // Create an anchor element
    const anchor = document.createElement('a')
    anchor.href = downloadLink
    anchor.download = `wallet-hub-backup-${new Date().toISOString().split('T')[0]}.json`

    // Trigger the download
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)

    // Clean up the temporary URL object
    URL.revokeObjectURL(downloadLink)

    return true
  } catch (error) {
    console.error('Error exporting backup:', error)
    return false
  }
}

/**
 * Imports backup data from a JSON file and restores it to localStorage
 * @param {File} file - The JSON backup file to import
 * @returns {Promise<{ success: boolean; message: string }>}
 */
import { COPY } from '../config/dashboardConfig'

export const importBackup = (file, language = 'pt') => {
  return new Promise((resolve) => {
    if (!file) {
      resolve({ success: false, message: 'No file selected' })
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const fileContent = event.target?.result
        if (typeof fileContent !== 'string') {
          resolve({ success: false, message: 'Invalid file format' })
          return
        }

        // Parse the JSON string
        const parsedData = JSON.parse(fileContent)

        // Validate the structure
        if (!parsedData || typeof parsedData !== 'object' || !parsedData.data) {
          resolve({ success: false, message: 'Invalid backup file format. Missing data structure.' })
          return
        }

        const { data } = parsedData

        // Restore manual connections
        if (data.manualConnections) {
          try {
            localStorage.setItem(STORAGE_KEYS.MANUAL_CONNECTIONS, JSON.stringify(data.manualConnections))
          } catch (error) {
            console.error('Error saving manual connections:', error)
          }
        }

        // Restore manual wallet transactions
        if (data.manualWalletTransactions) {
          try {
            localStorage.setItem(STORAGE_KEYS.MANUAL_WALLET_TRANSACTIONS, JSON.stringify(data.manualWalletTransactions))
          } catch (error) {
            console.error('Error saving manual wallet transactions:', error)
          }
        }

        // Restore Pluggy credentials
        if (data.pluggyCredentials) {
          try {
            localStorage.setItem(STORAGE_KEYS.PLUGGY_CREDENTIALS, JSON.stringify(data.pluggyCredentials))
          } catch (error) {
            console.error('Error saving Pluggy credentials:', error)
          }
        }

        // Use the language param to select the correct translation
        const lang = COPY[language] ? language : 'pt'
        resolve({ success: true, message: COPY[lang].connectionsImportSuccess || 'Backup imported successfully. Reloading...' })
      } catch (error) {
        console.error('Error parsing backup file:', error)
        resolve({ success: false, message: `Error parsing backup file: ${error.message}` })
      }
    }

    reader.onerror = () => {
      resolve({ success: false, message: 'Error reading file' })
    }

    reader.readAsText(file)
  })
}
