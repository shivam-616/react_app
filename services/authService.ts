import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://10.0.2.2:8000/auth/v1";

export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    // Assuming JwtResponseDTO structure: { accessToken: string, refreshToken: string }
    if (data.accessToken && data.refreshToken) {
      await SecureStore.setItemAsync("accessToken", data.accessToken);
      await SecureStore.setItemAsync("refreshToken", data.refreshToken);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

export const registerUser = async (payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("Registration Error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
};

export const getAccessToken = async () => {
  return await SecureStore.getItemAsync("accessToken");
};
