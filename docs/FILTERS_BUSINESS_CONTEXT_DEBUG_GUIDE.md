# Business Context Extraction - Debug Guide

## Error: "Business not found" on `/filters/business/available`

### Root Cause Analysis

The API endpoint `/v1/filters/business/available` returns `400 Bad Request` with message "Business not found" because:

1. **Missing Category Assignment** (Most Common):
   - The backend derives available filters from your business's category
   - If your business profile has NO category, the backend cannot determine which filters are available
   - Solution: Assign a category to your business profile

2. **Authentication Context Issue** (Less Common):
   - The bearer token may not contain proper business context
   - The auth interceptor isn't properly injecting the token
   - Solution: Log out and back in to refresh the session

3. **Token Expiration/Invalidity**:
   - The token in your auth store may have expired
   - Solution: Clear auth state and re-authenticate

---

## How to Debug

### Step 1: Check Business Profile (Primary)

1. Go to your business settings/profile page
2. Verify that your business has a **category assigned**
3. Look for fields like:
   - Business Category
   - Industry/Type
   - Or any "Category" dropdown

**If no category is assigned:**

- Assign a category from the dropdown
- Save changes
- The filters should now load

### Step 2: Use Console Debugging (Developer)

Paste this in your browser console:

```javascript
// Import the debug function (or run this code in component context)
import { useAuthStore } from "@/stores/auth-store";

const auth = useAuthStore.getState();

console.log("Business:", auth.business);
console.log("Has Category:", !!auth.business?.category?.id);
console.log("Category ID:", auth.business?.category?.id);
console.log("Category Name:", auth.business?.category?.name);
console.log("Token exists:", !!auth.token);
```

**Expected output if working:**

```
Business: { id: "123", business_name: "My Business", category: { id: "cat-456", name: "Fine Dining" }, ... }
Has Category: true
Category ID: cat-456
Category Name: Fine Dining
Token exists: true
```

**Red flags:**

- `Has Category: false` → Business category not assigned
- `Token exists: false` → Not authenticated
- `Business: null` → Auth state corrupted

### Step 3: Check Auth Token

Decode your JWT token (if it's JWT):

```javascript
const token = useAuthStore.getState().token;
const parts = token.split(".");
const payload = JSON.parse(atob(parts[1]));
console.log("Token payload:", payload);
```

Look for these fields:

- `business_id` or `sub` (business identifier)
- `businesses` (list of linked businesses)
- Verify businessId matches `auth.business.id`

### Step 4: Monitor API Requests

In browser DevTools Network tab:

1. Filter for requests to `filters/business/available`
2. Check the request headers:
   - ✅ Should have: `Authorization: Bearer <token>`
   - ✅ Should have: `X-API-Key: <your-api-key>`
   - ✅ Should have: `Content-Type: application/json`
3. Check response:
   - ❌ If 400: Error is in business context
   - ❌ If 401: Authentication token invalid
   - ✅ If 200: Success (check data structure)

---

## Solutions by Scenario

### Scenario A: "Business not found" + No Category in Profile

**Fix:**

1. Navigate to business settings
2. Find the "Category" or "Business Type" field
3. Select a category (e.g., "Fine Dining", "Nightlife", etc.)
4. Save changes
5. Reload the page or clear browser cache
6. Try again

### Scenario B: "Business not found" + Category IS Assigned

**Possible causes:**

1. Token doesn't have business context
2. Auth interceptor not working properly
3. Session expired

**Fix:**

1. Open browser DevTools
2. Go to Application → Storage → (LocalStorage or SessionStorage)
3. Look for auth-related keys (token, business, etc.)
4. Clear them all
5. Log out from the UI
6. Close and reopen the browser tab
7. Log back in
8. Try again

### Scenario C: Still Getting Error After All Steps

**Advanced debugging:**

1. Check the authentication store in `src/stores/auth-store.ts`:
   - Verify `setSession()` is being called with complete business object
   - Verify category is included in the business object

2. Check the interceptor in `src/services/api/interceptors.ts`:
   - Verify token is being properly injected
   - Verify `useAuthStore.getState()` is reading the token correctly

3. Backend log check (Ask backend developer):
   - Ask them to check backend logs for any authentication or business resolution errors
   - Provide them with your business ID and they can verify it has a category

---

## Code Changes Made

### Enhanced filters-api.ts

Added business context debugging:

- `debugBusinessContext()` function to verify business and category exist
- Better error messages for 400 "Business not found" errors
- Specific guidance on whether category is missing or token is invalid

### Enhanced attraction-management.tsx

Improved error messages:

- Shows actual error from API for debugging
- Added refresh button to retry
- More detailed explanation of possible causes

---

## What the Backend Developer Told You

> "This is now categorized. You will have to fetch each category and the attractions under them."

This means:

1. ✅ Your API correctly returns categorized filters
2. ✅ You need the business's category to determine which filters are available
3. ✅ The `/filters/business/available` endpoint uses the authenticated business's category
4. ❌ If no category is in the auth context, it returns "Business not found"

**Key takeaway:** Always ensure business category is:

- Assigned in the profile
- Included in the auth store
- Sent (implicitly via token) to the API

---

## Testing the Fix

Once you've assigned a category:

```
GET /v1/filters/business/available
Headers:
  Authorization: Bearer [your-token]
  X-API-Key: [your-api-key]

Expected Response (200):
{
  "status": "success",
  "data": [
    {
      "id": "ambiance-filters",
      "name": "Ambiance",
      "options": [
        { "id": "romantic", "label": "Romantic" },
        { "id": "casual", "label": "Casual" },
        ...
      ]
    },
    ...
  ]
}
```

If you're still getting 400, the issue is in the business context or authentication layer, not the component code.

---

## Summary Checklist

- [ ] Business profile has a category assigned
- [ ] Auth store contains the business with category
- [ ] Token is valid and not expired
- [ ] Bearer token is being sent in Authorization header
- [ ] API Key is configured in environment
- [ ] Browser cache cleared
- [ ] User logged out and back in

If all ✅, the filters should load successfully.
