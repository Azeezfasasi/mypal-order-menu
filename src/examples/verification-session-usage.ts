// // Example showing different ways to use verification session hooks
// // This file demonstrates the API patterns - don't use hooks at top level!

// import {
//   useKybSession,
//   useVerificationSession,
// } from "@/hooks/useVerificationSession";
// import { TokenType } from "@/stores/auth-store";

// // ✅ RECOMMENDED: Use convenience wrappers for common flows
// function KybVerificationFlow() {
//   const { isInitialized, isValid, isLoading } = useKybSession();
//   // ... rest of component
// }

// // ✅ ALTERNATIVE: Direct use of generic hook (for custom flows)
// function CustomVerificationFlow() {
//   const { isInitialized, isValid, isLoading } = useVerificationSession({
//     requiredTokenType: TokenType.KYB,
//     invalidSessionMessage:
//       "Please sign in to continue with business verification",
//     expiredSessionMessage: "Your session has expired. Please sign in again.",
//     initializeKybOwnership: true,
//     sessionStorageKey: "kyb_session_id",
//   });
//   // ... rest of component
// }

// // ❌ AVOID: Verbose configuration in component (use convenience wrapper instead)
// function VerboseKybFlow() {
//   const { isInitialized, isValid, isLoading } = useVerificationSession({
//     requiredTokenType: TokenType.KYB,
//     invalidSessionMessage:
//       "Please sign in to continue with business verification",
//     expiredSessionMessage: "Your session has expired. Please sign in again.",
//     initializeKybOwnership: true,
//     sessionStorageKey: "kyb_session_id",
//     loginRedirectPath: "/login", // default anyway
//   });
//   // ... rest of component
// }
