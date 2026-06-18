/**
 * Debug script to diagnose business context extraction issues
 * Run in browser console or as part of your app initialization
 */

import { useAuthStore } from "@/stores/auth-store";

export function debugBusinessContext() {
  console.log("🔍 === BUSINESS CONTEXT DEBUG ===");
  
  const state = useAuthStore.getState();
  
  console.log("1️⃣ AUTH STORE STATE:");
  console.log({
    hasToken: !!state.token,
    tokenLength: state.token?.length,
    tokenType: state.tokenType,
    hasBusiness: !!state.business,
  });

  console.log("\n2️⃣ BUSINESS OBJECT:");
  if (state.business) {
    console.log({
      id: state.business.id,
      email: state.business.email,
      business_name: state.business.business_name,
      business_type: state.business.business_type,
      category: state.business.category,
      is_verified: state.business.is_verified,
      hasCategory: !!state.business.category?.id,
    });
  } else {
    console.warn("❌ NO BUSINESS OBJECT IN STORE");
  }

  console.log("\n3️⃣ TOKEN VERIFICATION:");
  if (state.token) {
    try {
      // Decode JWT (if it's a JWT token)
      const parts = state.token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log("JWT Payload:", payload);
        console.log({
          hasSub: !!payload.sub,
          hasBusinessId: !!payload.business_id,
          hasBusinesses: !!payload.businesses,
          keys: Object.keys(payload),
        });
      }
    } catch (e) {
      console.error("Token is not a valid JWT or cannot be decoded:", e);
    }
  }

  console.log("\n4️⃣ CATEGORY INFO:");
  if (state.business?.category) {
    console.log({
      categoryId: state.business.category.id,
      categoryName: state.business.category.name,
    });
  } else {
    console.warn("❌ NO CATEGORY ASSIGNED TO BUSINESS");
    console.log("   → This is likely why /filters/business/available returns 'Business not found'");
    console.log("   → The backend cannot derive available filters without knowing the category");
  }

  console.log("\n5️⃣ API HEADERS THAT WILL BE SENT:");
  console.log({
    "Authorization": state.token ? `Bearer ${state.token.substring(0, 20)}...` : "NOT SET",
    "X-API-Key": process.env.NEXT_PUBLIC_API_KEY ? "SET" : "NOT SET",
    "Content-Type": "application/json",
  });

  console.log("\n6️⃣ DIAGNOSIS:");
  const issues = [];
  
  if (!state.token) {
    issues.push("❌ No authentication token found");
  }
  if (!state.business) {
    issues.push("❌ No business object found");
  } else if (!state.business.category) {
    issues.push("⚠️  Business has no category assigned - this causes 'Business not found'");
  } else if (!state.business.category.id) {
    issues.push("⚠️  Business category missing ID");
  }
  if (!process.env.NEXT_PUBLIC_API_KEY) {
    issues.push("❌ API Key not configured");
  }

  if (issues.length === 0) {
    console.log("✅ All checks passed - business context looks good");
  } else {
    console.warn("Issues found:");
    issues.forEach((issue) => console.warn(issue));
  }

  return {
    hasToken: !!state.token,
    hasBusiness: !!state.business,
    hasCategory: !!state.business?.category?.id,
    businessId: state.business?.id,
    categoryId: state.business?.category?.id,
    categoryName: state.business?.category?.name,
    issues,
  };
}

// Export for use in components
export function useBusinessContextDebug() {
  return {
    debug: debugBusinessContext,
  };
}
