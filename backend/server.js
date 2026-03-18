require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { PluggyClient } = require('pluggy-sdk');

const pluggyClient = new PluggyClient({
  clientId: process.env.PLUGGY_CLIENT_ID,
  clientSecret: process.env.PLUGGY_CLIENT_SECRET,
});

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const FALLBACK_ITEM_IDS = [
  '115ae3ff-be4b-4330-8278-7de1d99e3a7b',
  '481ff23b-9bf0-4618-8c94-f046a27fbbc9',
];

const getArrayResults = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const getConfiguredItemIds = () => {
  const envItemIds = process.env.PLUGGY_DASHBOARD_ITEM_IDS;
  if (!envItemIds) return [];

  return envItemIds
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};

const fetchConnectedItemIds = async () => {
  if (typeof pluggyClient.listItems === 'function') {
    const itemsPage = await pluggyClient.listItems();
    return getArrayResults(itemsPage).map((item) => item.id).filter(Boolean);
  }

  try {
    if (typeof pluggyClient.createGetRequest === 'function') {
      const itemsPage = await pluggyClient.createGetRequest('items');
      return getArrayResults(itemsPage).map((item) => item.id).filter(Boolean);
    }
  } catch (error) {
    console.warn('GET /items is not available, falling back to configured item IDs.');
  }

  const configuredIds = getConfiguredItemIds();
  if (configuredIds.length > 0) {
    return configuredIds;
  }

  return FALLBACK_ITEM_IDS;
};

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'Backend is running securely' });
});

// Debug endpoint to verify Pluggy credentials and list available items
app.get('/api/debug/pluggy', async (req, res) => {
  try {
    const credentialsInfo = {
      clientId: process.env.PLUGGY_CLIENT_ID ? `${process.env.PLUGGY_CLIENT_ID.substring(0, 8)}...` : '✗ Missing',
      clientSecret: process.env.PLUGGY_CLIENT_SECRET ? `${process.env.PLUGGY_CLIENT_SECRET.substring(0, 8)}...` : '✗ Missing',
      configuredItemIds: getConfiguredItemIds(),
    };

    // Try to fetch accounts for the first configured item to test credentials
    const itemIds = getConfiguredItemIds();
    if (itemIds.length === 0) {
      return res.status(400).json({
        credentials: credentialsInfo,
        error: 'No item IDs configured in PLUGGY_DASHBOARD_ITEM_IDS',
      });
    }

    try {
      const firstItemId = itemIds[0];
      const testAccounts = await pluggyClient.fetchAccounts(firstItemId);
      return res.json({
        credentials: credentialsInfo,
        pluggyConnected: true,
        testResult: `✓ Successfully fetched accounts for item ${firstItemId.substring(0, 8)}...`,
        accountsFound: getArrayResults(testAccounts).length,
      });
    } catch (fetchError) {
      return res.status(401).json({
        credentials: credentialsInfo,
        pluggyConnected: false,
        error: 'Failed to authenticate with Pluggy API',
        attemptedItemId: itemIds[0].substring(0, 8) + '...',
        details: fetchError.message,
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Debug endpoint failed', details: error.message });
  }
});

// Now it accepts the item ID in the URL
app.get('/api/accounts/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    // The correct method to view balance and accounts is fetchAccounts.
    const accounts = await pluggyClient.fetchAccounts(itemId);
    res.json(accounts);
  } catch (error) {
    console.error('Pluggy API Error:', error);
    res.status(500).json({ error: 'Failed to fetch data from Pluggy' });
  }
});

app.get('/api/transactions/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    try {
      // Keeps the requested SDK call pattern for compatibility with your requirement.
      const transactions = await pluggyClient.fetchTransactions(itemId);
      return res.json(transactions);
    } catch (directFetchError) {
      // Fallback: fetch transactions per account from the item.
      const accountsResponse = await pluggyClient.fetchAccounts(itemId);
      const accounts = Array.isArray(accountsResponse?.results) ? accountsResponse.results : [];

      const transactionPages = await Promise.all(
        accounts.map((account) => pluggyClient.fetchTransactions(account.id))
      );

      const mergedTransactions = transactionPages.flatMap((page) =>
        Array.isArray(page?.results) ? page.results : []
      );

      return res.json({
        total: mergedTransactions.length,
        results: mergedTransactions,
      });
    }
  } catch (error) {
    console.error('Pluggy Transactions Error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions from Pluggy' });
  }
});

app.get('/api/investments/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const investments = await pluggyClient.fetchInvestments(itemId);
    res.json(investments);
  } catch (error) {
    console.error('Pluggy Investments Error:', error);
    res.status(500).json({ error: 'Failed to fetch investments from Pluggy' });
  }
});

app.get('/api/dashboard-data', async (req, res) => {
  try {
    const itemIds = [...new Set(await fetchConnectedItemIds())];

    const perItemResults = await Promise.allSettled(
      itemIds.map(async (itemId) => {
        const [accountsResponse, investmentsResponse] = await Promise.all([
          pluggyClient.fetchAccounts(itemId),
          pluggyClient.fetchInvestments(itemId),
        ]);

        return {
          itemId,
          accounts: getArrayResults(accountsResponse),
          investments: getArrayResults(investmentsResponse),
        };
      })
    );

    const perItemPayload = [];
    const failedItems = [];

    perItemResults.forEach((result, index) => {
      const itemId = itemIds[index];

      if (result.status === 'fulfilled') {
        perItemPayload.push(result.value);
        return;
      }

      const reason = result.reason;
      failedItems.push({
        itemId,
        message: reason?.message || 'Unknown Pluggy error',
      });
    });

    if (perItemPayload.length === 0) {
      const firstFailure = failedItems[0];
      const failureMessage = firstFailure?.message ? ` (${firstFailure.message})` : '';

      return res.status(502).json({
        error: `Failed to fetch dashboard data from Pluggy for all configured items${failureMessage}`,
        failedItems,
      });
    }

    const allAccounts = perItemPayload.flatMap((entry) =>
      entry.accounts.map((account) => ({ ...account, itemId: entry.itemId }))
    );

    const bankAccounts = allAccounts.filter((account) => account.type === 'BANK');
    const creditCards = allAccounts.filter((account) => account.type === 'CREDIT');

    const investments = perItemPayload.flatMap((entry) =>
      entry.investments.map((investment) => ({ ...investment, itemId: entry.itemId }))
    );

    res.json({
      bankAccounts,
      creditCards,
      investments,
      failedItems,
    });
  } catch (error) {
    console.error('Pluggy Dashboard Error:', error);
    res.status(500).json({ error: 'Failed to fetch consolidated dashboard data from Pluggy' });
  }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});