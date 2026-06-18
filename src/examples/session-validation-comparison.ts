// Comparison: Old vs New Session Validation Approaches

// TL;DR: The new hooks are purpose-built for primary verification flows with automatic server validation, while the old ones serve recovery scenarios. Different tools for different use cases! 🚀

/*
❌ OLD APPROACH: useSessionValidation (URL-parameter based)
- Requires "?validate=true" URL parameter
- Only validates when URL param is present
- Complex URL manipulation
- No loading states
- Manual redirect handling

✅ NEW APPROACH: useVerificationSession (automatic)
- Validates on component mount automatically
- No URL parameters needed
- Built-in loading states
- Automatic redirects
- Server-side token verification
- KYB draft ownership management

Example: What changed in the verify page

BEFORE (using useSessionValidation):
```typescript
function VerifyForm() {
  const [redirectChecked, setRedirectChecked] = useState(false);
  const { isValidating, shouldValidate } = useSessionValidation("/verify");

  useEffect(() => {
    if (!redirectChecked) {
      if (!email) router.push("/signup");
      setRedirectChecked(true);
    }
  }, [token, email, router, redirectChecked]);

  // Complex manual validation logic...
  // URL parameter checking...
  // Manual redirect handling...
}
```

AFTER (using useOtpSession):
```typescript
function VerifyForm() {
  const { isInitialized, isValid, isLoading } = useOtpSession();

  if (!isInitialized || isLoading) return <LoadingSpinner />;
  if (!isValid) return null; // Hook handles everything

  // Simple, clean component logic...
}
```
*/
