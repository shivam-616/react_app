import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_ID_KEY = "userId";
const USERNAME_KEY = "username";

const defaultGatewayUrl =
  Platform.OS === "android" ? "http://10.54.108.215:8000" : "http://localhost:8000";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_SERVER_BASE_URL || defaultGatewayUrl;

export type AuthSessionResponse = {
  accessToken?: string;
  token?: string;
  refreshToken?: string;
  userId?: string;
  user_id?: string;
};

type ApiFetchConfig = {
  requireAuth?: boolean;
  requireUserId?: boolean;
  retryOnUnauthorized?: boolean;
};

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export const getAccessToken = () => SecureStore.getItemAsync(ACCESS_TOKEN_KEY);

export const getRefreshToken = () => SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

export const getUserId = () => SecureStore.getItemAsync(USER_ID_KEY);

export const getUsername = () => SecureStore.getItemAsync(USERNAME_KEY);

export const saveAuthSession = async (
  session: AuthSessionResponse,
  username?: string,
) => {
  const userId = session.userId || session.user_id;
  const refreshToken = session.refreshToken || session.token;

  if (session.accessToken) {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken);
  }

  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }

  if (userId) {
    await SecureStore.setItemAsync(USER_ID_KEY, userId);
  }

  if (username) {
    await SecureStore.setItemAsync(USERNAME_KEY, username);
  }
};

export const clearAuthSession = async () => {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(USER_ID_KEY),
    SecureStore.deleteItemAsync(USERNAME_KEY),
  ]);
};

const buildHeaders = async ({
  requireAuth = true,
  requireUserId = false,
}: ApiFetchConfig) => {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  };

  if (requireAuth) {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      throw new ApiError("Please sign in again.", 401);
    }
    headers.Authorization = `Bearer ${accessToken}`;
  }

  if (requireUserId) {
    const userId = await getUserId();
    if (!userId) {
      throw new ApiError("Your session is missing a user id. Please sign in again.", 401);
    }
    headers["X-User-Id"] = userId;
  }

  return headers;
};

const refreshAccessToken = async () => {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) {
    return false;
  }

  const response = await fetch(`${API_BASE_URL}/auth/v1/refreshToken`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    body: JSON.stringify({ token: refreshToken }),
  });

  if (!response.ok) {
    await clearAuthSession();
    return false;
  }

  const session = (await response.json()) as AuthSessionResponse;
  await saveAuthSession(session);
  return Boolean(session.accessToken);
};

export const apiFetch = async (
  path: string,
  options: RequestInit = {},
  config: ApiFetchConfig = {},
) => {
  const resolvedConfig = {
    requireAuth: true,
    requireUserId: false,
    retryOnUnauthorized: true,
    ...config,
  };

  const headers = await buildHeaders(resolvedConfig);
  const request = () =>
    fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

  let response = await request();

  if (
    response.status === 401 &&
    resolvedConfig.requireAuth &&
    resolvedConfig.retryOnUnauthorized
  ) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      const retryHeaders = await buildHeaders(resolvedConfig);
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: {
          ...retryHeaders,
          ...(options.headers || {}),
        },
      });
    }
  }

  return response;
};
