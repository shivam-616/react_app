import * as SecureStore from "expo-secure-store";

const API_BASE_URL = "http://10.54.108.215:8000/auth/v1";

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
   // FIX: Look for data.token instead of data.refreshToken to match the Java DTO
    if (data.accessToken && data.token) {
      await SecureStore.setItemAsync("accessToken", data.accessToken);
      
      // We can still save it locally under the name "refreshToken" for clarity
      await SecureStore.setItemAsync("refreshToken", data.token); 
      
      // Save the username to be used in X-User-Id headers
      await SecureStore.setItemAsync("username", username);
      return true;
    }

    // If the tokens are missing for some reason, log the actual response to debug
    console.warn("Backend did not return tokens:", data);
    return false;

  } catch (error) {
    console.error("Login Error:", error);
    throw error;
  }
};

// UPDATED: Now requires explicit fields so we can format the payload perfectly for Spring Boot
export const registerUser = async (firstName, lastName, email, phoneNumber, password, username) => {
  try {
    // We map the arguments to perfectly match the Java UserInfoDto class
    const springBootPayload = {
      username: username,    // Use the explicit username from the form
      password: password,
      email: email,
      firstName: firstName,  
      lastName: lastName,
      phoneNumber: phoneNumber
    };

    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(springBootPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend Error:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Registration Error:", error);
    throw error;
  }
};

export const logoutUser = async () => {
  await SecureStore.deleteItemAsync("accessToken");
  await SecureStore.deleteItemAsync("refreshToken");
  await SecureStore.deleteItemAsync("username");
};

export const getAccessToken = async () => {
  return await SecureStore.getItemAsync("accessToken");
};