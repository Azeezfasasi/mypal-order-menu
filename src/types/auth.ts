export interface SignInCredentials {
  emailOrUsername: string;
  password: string;
  rememberMe?: boolean;
}

export interface ResetPasswordCredentials {
  email: string;
}

export interface AuthError {
  message: string;
  field?: string;
}
