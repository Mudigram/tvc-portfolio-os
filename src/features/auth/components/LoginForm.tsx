'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signInWithMagicLink, signInWithPasswordAction } from '@/features/auth/services/auth.actions'

type AuthMode = 'magic_link' | 'password'
type FormState = 'idle' | 'loading' | 'sent' | 'error'

const URL_ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'The sign-in link was invalid or expired. Request a new one below.',
  link_expired: 'That sign-in link has expired. Request a new one below.',
  auth_failed: 'Sign-in failed. Request a new link below.',
  no_claims: 'Your account has no role assigned. Contact your TVCLabs administrator.',
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  const [mode, setMode] = useState<AuthMode>('magic_link')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>(
    urlError ? (URL_ERROR_MESSAGES[urlError] ?? 'Something went wrong.') : ''
  )

  async function handleMagicLinkSubmit(e: React.FormEvent) {
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

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) return

    setState('loading')
    setErrorMessage('')

    const result = await signInWithPasswordAction(email, password)

    if (result.success && result.redirectUrl) {
      window.location.href = result.redirectUrl
    } else {
      setErrorMessage(result.error ?? 'Invalid email or password.')
      setState('error')
    }
  }

  // -------------------------------------------------------------------------
  // Sent state — waiting for magic link click
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

  return (
    <div className="space-y-6">
      {/* Auth mode tab toggle */}
      <div className="flex bg-zinc-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => {
            setMode('magic_link')
            setErrorMessage('')
          }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            mode === 'magic_link'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Magic Link
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('password')
            setErrorMessage('')
          }}
          className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
            mode === 'password'
              ? 'bg-white text-zinc-900 shadow-sm'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          Password (Test)
        </button>
      </div>

      {mode === 'magic_link' ? (
        <form onSubmit={handleMagicLinkSubmit} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="email-magic"
              className="block text-xs font-medium text-zinc-500 tracking-wide uppercase"
            >
              Email
            </label>
            <input
              id="email-magic"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={state === 'loading'}
              className="
                w-full h-10 px-3 text-sm text-zinc-900 bg-white border border-zinc-200
                rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-2
                focus:ring-zinc-900 focus:border-transparent disabled:opacity-50
                disabled:cursor-not-allowed transition-shadow
              "
            />
          </div>

          {errorMessage && (
            <p role="alert" className="text-xs text-red-600 leading-relaxed">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={state === 'loading' || !email.trim()}
            className="
              w-full h-10 px-4 text-sm font-medium text-white bg-zinc-900 rounded-md
              hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900
              focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors
            "
          >
            {state === 'loading' ? 'Sending…' : 'Send sign-in link'}
          </button>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label
              htmlFor="email-pwd"
              className="block text-xs font-medium text-zinc-500 tracking-wide uppercase"
            >
              Email
            </label>
            <input
              id="email-pwd"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={state === 'loading'}
              className="
                w-full h-10 px-3 text-sm text-zinc-900 bg-white border border-zinc-200
                rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-2
                focus:ring-zinc-900 focus:border-transparent disabled:opacity-50
                disabled:cursor-not-allowed transition-shadow
              "
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-500 tracking-wide uppercase"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={state === 'loading'}
              className="
                w-full h-10 px-3 text-sm text-zinc-900 bg-white border border-zinc-200
                rounded-md placeholder:text-zinc-400 focus:outline-none focus:ring-2
                focus:ring-zinc-900 focus:border-transparent disabled:opacity-50
                disabled:cursor-not-allowed transition-shadow
              "
            />
          </div>

          {errorMessage && (
            <p role="alert" className="text-xs text-red-600 leading-relaxed">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={state === 'loading' || !email.trim() || !password}
            className="
              w-full h-10 px-4 text-sm font-medium text-white bg-zinc-900 rounded-md
              hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-900
              focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors
            "
          >
            {state === 'loading' ? 'Signing in…' : 'Sign in with Password'}
          </button>
        </form>
      )}

      <p className="text-xs text-zinc-400 leading-relaxed">
        Access is by invitation only. If you do not have an account, contact
        your TVCLabs administrator.
      </p>
    </div>
  )
}
