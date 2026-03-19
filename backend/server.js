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

const sendPrettyJson = (res, statusCode, payload) => {
  res.status(statusCode);
  res.type('application/json');
  res.send(JSON.stringify(payload, null, 2));
};

const getArrayResults = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
};

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toDisplayDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const getTransactionAmount = (transaction) => {
  const candidate =
    transaction?.amount ??
    transaction?.value ??
    transaction?.paymentData?.amount ??
    transaction?.paymentAmount ??
    0;

  const parsed = Number(candidate);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getTransactionDate = (transaction) => {
  const rawDate =
    transaction?.date ||
    transaction?.paymentDate ||
    transaction?.createdAt ||
    transaction?.created_at ||
    transaction?.competencyDate ||
    null;

  if (!rawDate) return null;

  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const fetchTransactionsForItem = async (itemId, knownAccounts = []) => {
  const accounts = knownAccounts.length > 0 ? knownAccounts : getArrayResults(await pluggyClient.fetchAccounts(itemId));

  const transactionPages = await Promise.allSettled(
    accounts.map((account) => pluggyClient.fetchTransactions(account.id))
  );

  const mergedTransactions = [];

  transactionPages.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      mergedTransactions.push(...getArrayResults(result.value));
      return;
    }

    const account = accounts[index];
    console.warn(
      `Failed to fetch transactions for account ${account?.id || 'unknown'} (${account?.name || 'unnamed'}) in item ${itemId}:`,
      result.reason?.message || result.reason
    );
  });

  return mergedTransactions;
};

const buildMonthlyBalanceEvolution = ({ currentTotal, transactions, accountTypeById }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const dayCount = today.getDate();

  const dailyImpacts = new Map();

  transactions.forEach((transaction) => {
    const transactionDate = getTransactionDate(transaction);
    if (!transactionDate) return;

    if (
      transactionDate.getFullYear() !== year ||
      transactionDate.getMonth() !== month ||
      transactionDate.getDate() > dayCount
    ) {
      return;
    }

    const accountId = transaction?.accountId || transaction?.account?.id || null;
    const accountType = accountTypeById.get(accountId) || transaction?.account?.type || 'BANK';
    const amount = getTransactionAmount(transaction);

    // For CREDIT accounts, used amount behaves as inverse of account balance variation.
    const impact = accountType === 'CREDIT' ? -amount : amount;
    const dateKey = toIsoDate(transactionDate);

    dailyImpacts.set(dateKey, (dailyImpacts.get(dateKey) || 0) + impact);
  });

  const monthImpactTotal = Array.from(dailyImpacts.values()).reduce((sum, value) => sum + value, 0);
  const openingTotal = currentTotal - monthImpactTotal;

  let runningImpact = 0;

  const points = Array.from({ length: dayCount }, (_, index) => {
    const day = index + 1;
    const currentDate = new Date(year, month, day);
    const dateKey = toIsoDate(currentDate);

    runningImpact += dailyImpacts.get(dateKey) || 0;
    const computedValue = openingTotal + runningImpact;
    const value = day === dayCount ? currentTotal : computedValue;

    return {
      day: String(day).padStart(2, '0'),
      fullDate: toDisplayDate(currentDate),
      value: Number(value.toFixed(2)),
    };
  });

  return points;
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

  // The current SDK version does not expose listItems();
  // use configured IDs directly to avoid unauthorized /items probing.
  console.warn('listItems() is unavailable in this SDK version, using configured item IDs.');

  const configuredIds = getConfiguredItemIds();
  if (configuredIds.length > 0) {
    return configuredIds;
  }

  throw new Error('No item IDs configured. Set PLUGGY_DASHBOARD_ITEM_IDS in backend/.env.');
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
      return sendPrettyJson(res, 400, {
        credentials: credentialsInfo,
        error: 'No item IDs configured in PLUGGY_DASHBOARD_ITEM_IDS',
      });
    }

    try {
      const firstItemId = itemIds[0];
      const testAccounts = await pluggyClient.fetchAccounts(firstItemId);
      return sendPrettyJson(res, 200, {
        credentials: credentialsInfo,
        pluggyConnected: true,
        testResult: `✓ Successfully fetched accounts for item ${firstItemId.substring(0, 8)}...`,
        accountsFound: getArrayResults(testAccounts).length,
      });
    } catch (fetchError) {
      return sendPrettyJson(res, 401, {
        credentials: credentialsInfo,
        pluggyConnected: false,
        error: 'Failed to authenticate with Pluggy API',
        attemptedItemId: itemIds[0].substring(0, 8) + '...',
        details: fetchError.message,
      });
    }
  } catch (error) {
    sendPrettyJson(res, 500, { error: 'Debug endpoint failed', details: error.message });
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
    const mergedTransactions = await fetchTransactionsForItem(itemId);

    return res.json({
      total: mergedTransactions.length,
      results: mergedTransactions,
    });
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

app.get('/api/debug/monthly-evolution', async (req, res) => {
  try {
    const itemIds = [...new Set(await fetchConnectedItemIds())];

    const debugPerItem = await Promise.all(
      itemIds.map(async (itemId) => {
        try {
          const accounts = getArrayResults(await pluggyClient.fetchAccounts(itemId));
          let transactions = [];
          let transactionError = null;

          try {
            transactions = await fetchTransactionsForItem(itemId, accounts);
          } catch (err) {
            transactionError = err.message || String(err);
          }

          const parsed = transactions.map((txn) => ({
            rawDate: txn.date || txn.paymentDate || txn.createdAt || 'MISSING',
            parsedDate: getTransactionDate(txn)?.toISOString() || 'PARSE_ERROR',
            rawAmount: txn.amount || txn.value || 'MISSING',
            parsedAmount: getTransactionAmount(txn),
            accountId: txn.accountId || txn.account?.id || 'MISSING',
            accountType: accounts.find((a) => a.id === (txn.accountId || txn.account?.id))?.type || 'UNKNOWN',
          }));

          const thisMonthOnly = transactions.filter((txn) => {
            const txnDate = getTransactionDate(txn);
            if (!txnDate) return false;

            const today = new Date();
            return (
              txnDate.getFullYear() === today.getFullYear() &&
              txnDate.getMonth() === today.getMonth() &&
              txnDate.getDate() <= today.getDate()
            );
          });

          return {
            itemId,
            accountCount: accounts.length,
            accountNames: accounts.map((a) => ({ id: a.id, name: a.name, type: a.type })),
            totalTransactionCount: transactions.length,
            thisMonthTransactionCount: thisMonthOnly.length,
            transactionError,
            sampleParsedTransactions: parsed.slice(0, 5),
          };
        } catch (itemError) {
          return {
            itemId,
            error: itemError.message,
          };
        }
      })
    );

    const allAccounts = [];
    const allTransactions = [];
    let currentTotal = 0;

    for (const itemId of itemIds) {
      const accounts = getArrayResults(await pluggyClient.fetchAccounts(itemId));
      allAccounts.push(...accounts.map((a) => ({ ...a, itemId })));
      currentTotal += accounts
        .filter((a) => a.type === 'BANK')
        .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
      currentTotal += accounts
        .filter((a) => a.type === 'CREDIT')
        .reduce((sum, a) => sum + Math.abs(Number(a.balance) || 0), 0);

      const txns = await fetchTransactionsForItem(itemId, accounts);
      allTransactions.push(...txns.map((t) => ({ ...t, itemId })));
    }

    const accountTypeById = new Map(
      allAccounts
        .filter((account) => account?.id)
        .map((account) => [account.id, account.type])
    );

    const evolution = buildMonthlyBalanceEvolution({
      currentTotal,
      transactions: allTransactions,
      accountTypeById,
    });

    sendPrettyJson(res, 200, {
      perItemDebug: debugPerItem,
      consolidatedDebug: {
        accountCount: allAccounts.length,
        totalTransactionCount: allTransactions.length,
        computedCurrentTotal: currentTotal,
        balanceEvolutionPointCount: evolution.length,
        first3EvolutionPoints: evolution.slice(0, 3),
        last3EvolutionPoints: evolution.slice(-3),
      },
    });
  } catch (error) {
    sendPrettyJson(res, 500, {
      error: 'Debug endpoint failed',
      details: error.message,
    });
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

        const accounts = getArrayResults(accountsResponse);
        let transactions = [];

        try {
          transactions = await fetchTransactionsForItem(itemId, accounts);
        } catch (transactionError) {
          console.warn(`Failed to fetch transactions for item ${itemId}:`, transactionError?.message || transactionError);
        }

        return {
          itemId,
          accounts,
          investments: getArrayResults(investmentsResponse),
          transactions,
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

    const allTransactions = perItemPayload.flatMap((entry) =>
      entry.transactions.map((transaction) => ({ ...transaction, itemId: entry.itemId }))
    );

    const accountTypeById = new Map(
      allAccounts
        .filter((account) => account?.id)
        .map((account) => [account.id, account.type])
    );

    const currentTotal =
      bankAccounts.reduce((sum, account) => sum + (Number(account.balance) || 0), 0) +
      creditCards.reduce((sum, account) => sum + Math.abs(Number(account.balance) || 0), 0);

    const balanceEvolution = buildMonthlyBalanceEvolution({
      currentTotal,
      transactions: allTransactions,
      accountTypeById,
    });

    res.json({
      bankAccounts,
      creditCards,
      investments,
      transactions: allTransactions,
      balanceEvolution,
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