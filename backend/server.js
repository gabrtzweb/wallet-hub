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

// ROTA CORRIGIDA: Agora ela aceita o ID do item na URL
app.get('/api/accounts/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    // O método correto para ver saldo e contas é fetchAccounts
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

    const perItemPayload = await Promise.all(
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

    const allAccounts = perItemPayload.flatMap((entry) =>
      entry.accounts.map((account) => ({ ...account, itemId: entry.itemId }))
    );

    const bankAccounts = allAccounts.filter((account) => account.type !== 'CREDIT_CARD');
    const creditCards = allAccounts.filter((account) => account.type === 'CREDIT_CARD');

    const investments = perItemPayload.flatMap((entry) =>
      entry.investments.map((investment) => ({ ...investment, itemId: entry.itemId }))
    );

    res.json({
      bankAccounts,
      creditCards,
      investments,
    });
  } catch (error) {
    console.error('Pluggy Dashboard Error:', error);
    res.status(500).json({ error: 'Failed to fetch consolidated dashboard data from Pluggy' });
  }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});