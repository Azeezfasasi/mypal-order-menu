export function isTokenExpired(token: string): boolean {
  try {
    const [, payload] = token.split(".");
    const decodedPayload = JSON.parse(atob(payload));
    const expirationTime = decodedPayload.exp * 1000; // Convert to milliseconds
    return Date.now() >= expirationTime;
  } catch {
    return true; // If token can't be decoded, consider it expired
  }
}
