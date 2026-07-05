'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signInWithMagicLink } from '@/features/auth/services/auth.actions'

type FormState = 'idle' | 'loading' | 'sent' | 'error'

const URL_ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'The sign-in link was invalid or expired. Request a new one below.',
  link_expired:
    'That sign-in link has expired. Request a new one below.',
  auth_failed: 'Sign-in failed. Request a new link below.',
  no_claims:
    'Your account has no role assigned. Contact your TVCLabs administrator.',
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [email, setEmail] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>(
    urlError ? (URL_ERROR_MESSAGES[urlError] ?? 'Something went wrong.') : ''
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setState('loading')
    setErrorMessage('')

    const result = await signInWithMagicLink(email, window.location.origin)

    if (result.success) {
      setState('sent')
    } else {
      setErrorMessage(result.error ?? 'Something went wrong.')
      setState('error')
    }
  }

  // -------------------------------------------------------------------------
  // Sent state — waiting for the user to click the email link
  // -------------------------------------------------------------------------
  if (state === 'sent') {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-900">Check your email</p>
          <p className="text-sm text-zinc-500 leading-relaxed">
            A sign-in link was sent to{' '}
            <span className="text-zinc-700 font-medium">{email}</span>. Click
            the link to continue — it expires in 60 minutes.
          </p>
        </div>
        <p className="text-xs text-zinc-400">
          No email?{' '}
          <button
            type="button"
            onClick={() => {
              setState('idle')
              setErrorMessage('')
            }}
            className="underline underline-offset-2 text-zinc-500 hover:text-zinc-700 transition-colors"
          >
            Try again
          </button>
        </p>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Idle / loading / error state — the form
  // -------------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-xs font-medium text-zinc-500 tracking-wide uppercase"
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          disabled={state === 'loading'}
          className="
            w-full
            h-10
            px-3
            text-sm
            text-zinc-900
            bg-white
            border border-zinc-200
            rounded-md
            placeholder:text-zinc-400
            focus:outline-none
            focus:ring-2
            focus:ring-zinc-900
            focus:border-transparent
            disabled:opacity-50
            disabled:cursor-not-allowed
            transition-shadow
          "
        />
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="text-xs text-red-600 leading-relaxed"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'loading' || !email.trim()}
        className="
          w-full
          h-10
          px-4
          text-sm
          font-medium
          text-white
          bg-zinc-900
          rounded-md
          hover:bg-zinc-800
          focus:outline-none
          focus:ring-2
          focus:ring-zinc-900
          focus:ring-offset-2
          disabled:opacity-40
          disabled:cursor-not-allowed
          transition-colors
        "
      >
        {state === 'loading' ? 'Sending…' : 'Send sign-in link'}
      </button>

      <p className="text-xs text-zinc-400 leading-relaxed">
        Access is by invitation only. If you do not have an account, contact
        your TVCLabs administrator.
      </p>
    </form>
  )
}
