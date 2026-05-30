import { apiFetch, getUserId } from "./apiClient";

export interface ExpenseEntry {
  userID?: string;
  merchant: string;
  currency: string;
  external_id?: string;
  externalId?: string;
  amount: number | string;
  category: string;
  timestamp?: string;
  date?: string;
  created_at?: string;
}

export interface CategoryInsight {
  category: string;
  totalSpent: number;
}

export type AddExpenseInput = {
  merchant: string;
  amount: number;
  category: string;
  currency?: string;
};

const normalizeExpense = (entry: ExpenseEntry): ExpenseEntry => ({
  ...entry,
  amount: Number(entry.amount) || 0,
  external_id: entry.external_id || entry.externalId || `${entry.merchant}-${entry.timestamp}`,
  timestamp: entry.timestamp || entry.date || entry.created_at || new Date().toISOString(),
});

export const fetchUserExpenses = async (): Promise<ExpenseEntry[]> => {
  const response = await apiFetch(
    "/expense/v1/getExpense?page=0&size=50&sortBy=createdAt&sortDir=desc",
    { method: "GET" },
    { requireUserId: true },
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data) ? data.map(normalizeExpense) : [];
};

export const fetchCategoryInsights = async (): Promise<CategoryInsight[]> => {
  const response = await apiFetch(
    "/expense/v1/insight/category",
    { method: "GET" },
    { requireUserId: true },
  );

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  return Array.isArray(data)
    ? data.map((item) => ({
        category: item.category,
        totalSpent: Number(item.totalSpent) || 0,
      }))
    : [];
};

export const addExpense = async (expenseData: AddExpenseInput): Promise<boolean> => {
  const userId = await getUserId();
  if (!userId) {
    return false;
  }

  const payload = {
    userID: userId,
    merchant: expenseData.merchant.trim(),
    currency: expenseData.currency || "INR",
    external_id: `manual-${Date.now()}`,
    amount: expenseData.amount,
    category: expenseData.category,
    timestamp: Date.now(),
  };

  const response = await apiFetch(
    "/expense/v1/addExpense",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { requireUserId: true },
  );

  if (!response.ok) {
    return false;
  }

  const result = await response.json();
  return result === true;
};

export const submitSmsForExtraction = async (sms: string): Promise<boolean> => {
  const response = await apiFetch(
    "/api/sms",
    {
      method: "POST",
      body: JSON.stringify({ sms }),
    },
    { requireUserId: true },
  );

  return response.ok;
};
export const updateExpense = async (expenseData: ExpenseEntry): Promise<boolean> => {
  const userId = await getUserId();
  if (!userId) {
    return false;
  }

  // Convert the existing timestamp back to milliseconds for the backend 'Long' type
  const timeInMillis = new Date(
    expenseData.timestamp || expenseData.created_at || Date.now()
  ).getTime();

  const payload = {
    userID: userId,
    merchant: expenseData.merchant.trim(),
    currency: expenseData.currency || "INR",
    external_id: expenseData.external_id || expenseData.externalId,
    amount: Number(expenseData.amount),
    category: expenseData.category,
    timestamp: timeInMillis,
  };

  const response = await apiFetch(
    "/expense/v1/updateExpense",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    { requireUserId: true },
  );

  if (!response.ok) {
    return false;
  }

  const result = await response.json();
  return result === true;
};