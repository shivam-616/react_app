import {
  apiFetch,
  clearAuthSession,
  getAccessToken,
  saveAuthSession,
} from "./apiClient";

export type SignupForm = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  username: string;
};

export type AuthResult = {
  ok: boolean;
  message?: string;
};

export const loginUser = async (username: string, password: string) => {
  const response = await apiFetch(
    "/auth/v1/login",
    {
      method: "POST",
      body: JSON.stringify({
        username: username.trim(),
        password,
      }),
    },
    { requireAuth: false, retryOnUnauthorized: false },
  );

  if (!response.ok) {
    return false;
  }

  const session = await response.json();
  await saveAuthSession(session, username.trim());
  return Boolean(session.accessToken && (session.userId || session.user_id));
};

const readFailureMessage = async (response: Response) => {
  const message = await response.text();
  if (message.toLowerCase().includes("already exist")) {
    return "That username already exists. Try signing in instead.";
  }

  return message || "Registration failed";
};

export const registerUser = async (form: SignupForm): Promise<AuthResult> => {
  const phoneNumber = Number(form.phoneNumber.replace(/\D/g, ""));

  if (!form.username.trim() || !form.password || !form.email.trim()) {
    return { ok: false, message: "Username, email, and password are required." };
  }

  if (!phoneNumber) {
    return { ok: false, message: "Enter a valid phone number." };
  }

  const response = await apiFetch(
    "/auth/v1/signup",
    {
      method: "POST",
      body: JSON.stringify({
        username: form.username.trim(),
        password: form.password,
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        email: form.email.trim(),
        phone_number: Number(form.phoneNumber.replace(/\D/g, "")),
      }),
    },
    { requireAuth: false, retryOnUnauthorized: false },
  );

  if (!response.ok) {
    return {
      ok: false,
      message: await readFailureMessage(response),
    };
  }

  const session = await response.json();
  await saveAuthSession(session, form.username.trim());
  const ok = Boolean(session.accessToken && (session.userId || session.user_id));
  return {
    ok,
    message: ok ? undefined : "The backend did not return a complete session.",
  };
};

export const isSessionActive = async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return false;
  }

  const response = await apiFetch("/auth/v1/ping", { method: "GET" });
  if (!response.ok) {
    return false;
  }

  const userId = (await response.text()).trim();
  await saveAuthSession({ userId });
  return true;
};

export const logoutUser = clearAuthSession;

export { getAccessToken };
