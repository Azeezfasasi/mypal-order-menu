// The FCM token this browser last registered, kept so logout can remove
// exactly this device (DELETE /notifications/tokens?token=…).

const STORAGE_KEY = "mypal_push_token";

export const rememberPushToken = (token: string) => {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Storage unavailable (private mode) — logout falls back to the in-memory token
  }
};

export const getRememberedPushToken = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

export const forgetPushToken = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
};
