/**
 * Auth Error Handler - Converts API errors to user-friendly messages
 * This utility helps provide consistent, helpful error messaging across auth pages
 */

export interface AuthErrorInfo {
  title: string;
  message: string;
  suggestion?: string;
  details?: string;
  isRecoverable: boolean; // Can user try again or need other action
}

export const interpretAuthError = (
  error: unknown,
  context: "login" | "signup"
): AuthErrorInfo => {
  let status: number | undefined;
  let errorMessage = "An error occurred";

  // Extract status and message from error
  if (error && typeof error === "object") {
    const errObj = error as Record<string, unknown>;
    status = errObj.status as number | undefined;

    // Try to extract message from various possible locations
    if (errObj.response && typeof errObj.response === "object") {
      const resObj = errObj.response as Record<string, unknown>;
      status = status || (resObj.status as number | undefined);
      if (resObj.data && typeof resObj.data === "object") {
        const dataObj = resObj.data as Record<string, unknown>;
        errorMessage = (dataObj.message as string) || errorMessage;
      }
    } else if (errObj.data && typeof errObj.data === "string") {
      try {
        const jsonData = JSON.parse(errObj.data);
        errorMessage = jsonData.message || errorMessage;
      } catch {
        errorMessage = errObj.data as string;
      }
    } else if (errObj.message) {
      errorMessage = errObj.message as string;
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const messageLower = errorMessage.toLowerCase();

  // SIGNUP SPECIFIC ERRORS
  if (context === "signup") {
    // Email already exists
    if (
      status === 409 ||
      messageLower.includes("already exists") ||
      messageLower.includes("email already") ||
      messageLower.includes("duplicate")
    ) {
      return {
        title: "Email Already Registered",
        message: "This email is already associated with an account.",
        suggestion: "Try logging in instead, or use a different email address.",
        isRecoverable: true,
      };
    }

    // 400 Bad Request
    if (status === 400) {
      if (messageLower.includes("password")) {
        return {
          title: "Password Requirements",
          message:
            "Your password doesn't meet the requirements. It must contain uppercase, lowercase, number, and special character.",
          suggestion: "Check the password requirements shown below the field.",
          isRecoverable: true,
        };
      }

      if (messageLower.includes("email")) {
        return {
          title: "Invalid Email",
          message: "The email address format is not valid.",
          suggestion: "Please check your email and try again.",
          isRecoverable: true,
        };
      }

      return {
        title: "Invalid Information",
        message: "One or more fields have invalid information.",
        suggestion: "Please review the form and correct any errors.",
        isRecoverable: true,
      };
    }

    // 500 Server Error
    if (status === 500 || status === 502 || status === 503) {
      return {
        title: "Service Temporarily Unavailable",
        message: "Our servers are currently having issues. Please try again in a moment.",
        suggestion: "This is a temporary issue on our end, not a problem with your information.",
        isRecoverable: true,
      };
    }

    // Network/Connection errors
    if (!status) {
      if (
        messageLower.includes("network") ||
        messageLower.includes("timeout") ||
        messageLower.includes("offline")
      ) {
        return {
          title: "Connection Error",
          message:
            "Unable to reach our servers. Check your internet connection.",
          suggestion: "Please verify your internet connection and try again.",
          isRecoverable: true,
        };
      }
    }
  }

  // LOGIN SPECIFIC ERRORS
  if (context === "login") {
    // 405 Method Not Allowed - likely API endpoint configuration issue
    if (status === 405) {
      return {
        title: "Configuration Error",
        message: "The login endpoint is not properly configured on the server.",
        suggestion: "This is a server configuration issue. Please contact support with error code 405.",
        details: "HTTP 405 - Method Not Allowed. The API endpoint may not be configured correctly.",
        isRecoverable: false,
      };
    }

    // Invalid credentials
    if (
      status === 401 ||
      messageLower.includes("invalid") ||
      messageLower.includes("incorrect") ||
      messageLower.includes("wrong")
    ) {
      return {
        title: "Invalid Credentials",
        message: "The email or password you entered is incorrect.",
        suggestion: "Please check your email and password, or use 'Forgot password' to reset it.",
        isRecoverable: true,
      };
    }

    // Too many attempts
    if (
      status === 429 ||
      messageLower.includes("too many") ||
      messageLower.includes("rate limit") ||
      messageLower.includes("throttle")
    ) {
      return {
        title: "Too Many Login Attempts",
        message: "Your account has been temporarily locked due to multiple failed login attempts.",
        suggestion: "Please try again in a few minutes or use 'Forgot password' to reset your credentials.",
        isRecoverable: true,
      };
    }

    // User not found
    if (status === 404 || messageLower.includes("not found")) {
      return {
        title: "Account Not Found",
        message: "No account exists with this email address.",
        suggestion: "Please check the email address or create a new account.",
        isRecoverable: true,
      };
    }

    // Business not initialized (403)
    if (status === 403 && messageLower.includes("not initialized")) {
      return {
        title: "Business Profile Setup Required",
        message: "Your business profile needs to be set up to complete the login.",
        suggestion: "You'll be guided through the setup process.",
        details: "Business not initialized",
        isRecoverable: false,
      };
    }

    // 500 Server Error
    if (status === 500 || status === 502 || status === 503) {
      return {
        title: "Service Temporarily Unavailable",
        message: "Our servers are currently having issues. Please try again in a moment.",
        suggestion: "This is a temporary issue on our end, not related to your account.",
        isRecoverable: true,
      };
    }

    // Network/Connection errors
    if (!status) {
      if (
        messageLower.includes("network") ||
        messageLower.includes("timeout") ||
        messageLower.includes("offline")
      ) {
        return {
          title: "Connection Error",
          message: "Unable to reach our servers. Check your internet connection.",
          suggestion: "Please verify your internet connection and try again.",
          isRecoverable: true,
        };
      }
    }
  }

  // GENERIC ERROR FALLBACK
  if (status === 500 || status === 502 || status === 503) {
    return {
      title: "Server Error",
      message: "Our servers are having issues. Please try again later.",
      isRecoverable: true,
    };
  }

  return {
    title:
      context === "login"
        ? "Login Failed"
        : "Signup Failed",
    message: errorMessage || "An unexpected error occurred. Please try again.",
    suggestion: "If this problem persists, please contact support.",
    isRecoverable: true,
  };
};
