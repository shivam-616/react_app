import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://10.54.108.215:8000/expense/v1";

export interface AddDTO {
  userID: string;
  merchant: string;
  currency: string;
  external_id: string; // Matches @JsonProperty("external_id")
  amount: number;
  category: string;
  timestamp: string; // Matches @JsonProperty("timestamp")
}

/**
 * Fetches expenses for the authenticated user.
 */
export const fetchUserExpenses = async (): Promise<AddDTO[]> => {
  try {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    const storedUsername = await SecureStore.getItemAsync("username");
    
    const userId = storedUsername || "guest"; 

    if (!accessToken) {
      return [];
    }

    const response = await fetch(`${API_BASE_URL}/getExpense`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-User-Id": userId,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
    return [];
  } catch (error) {
    return [];
  }
};

/**
 * Adds a new expense to the database.
 */
export const addExpense = async (expenseData: {
  merchant: string;
  amount: number;
  category: string;
  currency?: string;
}): Promise<boolean> => {
  try {
    const accessToken = await SecureStore.getItemAsync("accessToken");
    const storedUsername = await SecureStore.getItemAsync("username");
    
    if (!accessToken || !storedUsername) {
      return false;
    }

    const payload = {
      userID: storedUsername,
      merchant: expenseData.merchant,
      currency: expenseData.currency || "USD",
      external_id: Math.random().toString(36).substring(2, 15), // Generate a random ID
      amount: expenseData.amount,
      category: expenseData.category,
      timestamp: new Date().toISOString(), // Backend expects Timestamp
    };

    const response = await fetch(`${API_BASE_URL}/addExpense`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "X-User-Id": storedUsername,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    return result === true;
  } catch (error) {
    console.error("Add Expense Error:", error);
    return false;
  }
};
