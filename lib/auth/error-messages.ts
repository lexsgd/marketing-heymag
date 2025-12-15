export const authErrorMessages: Record<string, string> = {
  // Supabase auth error codes
  'Invalid login credentials': 'The email or password you entered is incorrect. Please try again.',
  'Email not confirmed': 'Please verify your email address before signing in. Check your inbox for the verification link.',
  'User already registered': 'An account with this email already exists. Please sign in or use a different email.',
  'Password should be at least 6 characters': 'Your password must be at least 8 characters long.',
  'Invalid email': 'Please enter a valid email address.',
  'Email rate limit exceeded': 'Too many attempts. Please wait a few minutes before trying again.',
  'Network request failed': 'Unable to connect. Please check your internet connection and try again.',
  'User not found': 'No account found with this email address. Please sign up first.',
  'Invalid refresh token': 'Your session has expired. Please sign in again.',
  'weak_password': 'Your password is too weak. Please use a combination of letters, numbers, and special characters.',
  'email_address_invalid': 'Please enter a valid email address format.',
  'email_address_not_authorized': 'This email domain is not authorized. Please contact support.',

  // Custom error messages
  'password_mismatch': 'Passwords do not match. Please ensure both passwords are identical.',
  'missing_required_fields': 'Please fill in all required fields.',
  'invalid_business_name': 'Business name must be at least 2 characters long.',
  'session_expired': 'Your session has expired. Please sign in again.',
  'account_suspended': 'Your account has been suspended. Please contact support for assistance.',
  'too_many_requests': 'Too many login attempts. Please wait 5 minutes before trying again.',

  // OAuth errors
  'OAuth error': 'Authentication failed. Please try again or use a different sign-in method.',
  'OAuth cancelled': 'Sign-in was cancelled. Please try again when ready.',

  // Network and server errors
  'fetch_error': 'Connection failed. Please check your internet and try again.',
  'server_error': 'Something went wrong on our end. Please try again later.',
  '500': 'Server error. Our team has been notified. Please try again later.',
  '429': 'Too many requests. Please slow down and try again in a moment.',
}

export function getAuthErrorMessage(error: string | undefined | null): string {
  if (!error) return 'An unexpected error occurred. Please try again.'

  // Check for exact matches first
  if (authErrorMessages[error]) {
    return authErrorMessages[error]
  }

  // Check for partial matches
  const errorLower = error.toLowerCase()
  for (const [key, message] of Object.entries(authErrorMessages)) {
    if (errorLower.includes(key.toLowerCase())) {
      return message
    }
  }

  // Handle specific patterns
  if (errorLower.includes('password')) {
    return 'There was an issue with your password. Please ensure it meets the requirements.'
  }

  if (errorLower.includes('email')) {
    return 'There was an issue with your email. Please check and try again.'
  }

  if (errorLower.includes('network') || errorLower.includes('fetch')) {
    return 'Connection error. Please check your internet and try again.'
  }

  if (errorLower.includes('timeout')) {
    return 'The request timed out. Please check your connection and try again.'
  }

  // Default fallback
  return 'An error occurred. Please try again or contact support if the issue persists.'
}

export function getFieldErrorMessage(field: string, value: string | undefined): string | null {
  switch (field) {
    case 'email':
      if (!value) return 'Email address is required'
      if (!/\S+@\S+\.\S+/.test(value)) return 'Please enter a valid email address'
      return null

    case 'password':
      if (!value) return 'Password is required'
      if (value.length < 8) return 'Password must be at least 8 characters'
      return null

    case 'confirmPassword':
      if (!value) return 'Please confirm your password'
      return null

    case 'fullName':
      if (!value) return 'Full name is required'
      if (value.length < 2) return 'Name must be at least 2 characters'
      return null

    case 'businessName':
      if (!value) return 'Business name is required'
      if (value.length < 2) return 'Business name must be at least 2 characters'
      return null

    default:
      return null
  }
}
