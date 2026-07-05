'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/features/auth/services/auth.client'

interface SignOutButtonProps {
  className?: string
  children?: React.ReactNode // Support incoming icon wrappers or layout text
}

export function SignOutButton({ className, children }: SignOutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSignOut() {
    if (loading) return
    setLoading(true)
    try {
      await signOut()
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Sign out error:', err)
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <span className="opacity-70">Signing out…</span>
      ) : (
        // If structural children exist (like an icon), render them. Otherwise default text string.
        children || <span>Sign out</span>
      )}
    </button>
  )
}