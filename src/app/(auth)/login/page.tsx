import { redirect } from 'next/navigation'
import { getClaims, getRoleRedirect } from '@/features/auth/services/auth.server'
import { LoginForm } from '@/features/auth/components/LoginForm'

export const metadata = {
  title: 'Sign in — TVCLabs Portfolio OS',
}

export default async function LoginPage() {
  // If the user is already authenticated, redirect them to their dashboard
  const claims = await getClaims()
  if (claims) {
    const destination = getRoleRedirect(claims.role)
    redirect(destination)
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left — branding panel */}
      <div className="hidden lg:flex flex-col justify-between bg-zinc-950 px-14 py-16">
        <div>
          <span className="text-xs font-medium tracking-[0.2em] text-zinc-500 uppercase">
            TVCLabs
          </span>
        </div>

        <div className="space-y-6">
          <p className="text-[2.5rem] font-light leading-[1.15] text-white tracking-tight max-w-sm">
            From first cheque
            <br />
            to exit.
          </p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
            One view across every company where TVCLabs, TD, TechnoVision
            Communications, or Angels@TVCLabs have economic exposure.
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-zinc-600">Portfolio Operating System</p>
          <p className="text-xs text-zinc-700">v1 · Restricted access</p>
        </div>
      </div>

      {/* Right — login form */}
      <div className="flex flex-col justify-center px-8 sm:px-16 lg:px-20 py-16">
        {/* Mobile wordmark */}
        <div className="mb-12 lg:hidden">
          <span className="text-xs font-medium tracking-[0.2em] text-zinc-400 uppercase">
            TVCLabs Portfolio OS
          </span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-10 space-y-1">
            <h1 className="text-xl font-medium text-zinc-900 tracking-tight">
              Sign in
            </h1>
            <p className="text-sm text-zinc-500">
              Use the email address associated with your account.
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
