// Debug script to run in browser console on production
// Copy and paste this in browser console to debug auth issues

console.log("=== Auth Debug Information ===");

// Check cookies
const cookies = document.cookie.split(";").reduce((acc, cookie) => {
  const [key, value] = cookie.trim().split("=");
  acc[key] = value;
  return acc;
}, {});

console.log("Cookies:", {
  token: cookies.token ? "present" : "missing",
  tokenType: cookies.tokenType || "missing",
  allCookies: cookies,
});

// Check localStorage
try {
  const authStorage = localStorage.getItem("auth-storage");
  console.log(
    "LocalStorage auth-storage:",
    authStorage ? JSON.parse(authStorage) : "missing",
  );
} catch (e) {
  console.error("Error reading localStorage:", e);
}

// Check if user is on the base route
console.log("Current URL:", window.location.href);
console.log("Pathname:", window.location.pathname);

// Check if there are any network requests failing
console.log("Check Network tab for any failed requests to auth endpoints");

// Instructions
console.log(`
=== Instructions ===
1. Check if cookies.token and cookies.tokenType are both present
2. Check if localStorage has auth-storage with proper data
3. If cookies are missing but localStorage has data, there's a sync issue
4. If both are missing, user needs to login again
5. Look for any console errors related to auth store hydration
`);
