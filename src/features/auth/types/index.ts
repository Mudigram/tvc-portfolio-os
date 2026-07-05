import type { UserRole } from '@/types/roles'

/**
 * The minimal set of claims we need from the JWT to make
 * routing and access-control decisions. Anything beyond this
 * should come from the database, not the token.
 */
export interface AuthClaims {
  userId: string
  email: string
  role: UserRole
}

export interface SignInResult {
  success: boolean
  error?: string
}

export interface SignOutResult {
  success: boolean
  error?: string
}
