'use client'
// ─────────────────────────────────────────────────────────────
// UsersTabView — user management
// List all users, invite new, change role, revoke access.
// ─────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import {
  inviteUserAction,
  createUserWithPasswordAction,
  updateUserRoleAction,
  toggleUserAccessAction,
} from '../actions/settings.actions'
import type { ManagedUser, UserRole } from '../types'
import { Button } from '@/components/ui/button'
import { AngelHoldingsSheet } from './AngelHoldingsSheet'
import {
  PieChart,
  Mail,
  Key,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react'

interface Props {
  users: ManagedUser[]
}

const ROLES: UserRole[] = ['admin', 'internal', 'angel', 'founder']

const ROLE_STYLES: Record<string, string> = {
  admin:    'text-purple-700 bg-purple-50 border-purple-200',
  internal: 'text-[#1a23bd] bg-blue-50 border-blue-200',
  angel:    'text-amber-700 bg-amber-50 border-amber-200',
  founder:  'text-emerald-700 bg-emerald-50 border-emerald-200',
}

const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
  'placeholder:text-zinc-400 focus:border-[#1a23bd] focus:outline-none ' +
  'focus:ring-2 focus:ring-[#1a23bd]/20'

const selectClass =
  'rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 ' +
  'focus:border-[#1a23bd] focus:outline-none focus:ring-2 focus:ring-[#1a23bd]/20'

function formatDate(d: string | null): string {
  if (!d) return 'Never'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function generateSecureTempPassword(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
  let code = ''
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `TVCAngel-${code}!`
}

// ── Invite & Onboard form ─────────────────────────────────────
function InviteForm() {
  const [mode, setMode] = useState<'invite' | 'password'>('invite')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('angel')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)
  const [createdCredentials, setCreatedCredentials] = useState<{
    email: string
    password: string
    role: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  function handleAction() {
    setResult(null)
    setCreatedCredentials(null)

    startTransition(async () => {
      if (mode === 'invite') {
        const res = await inviteUserAction(email, role)
        setResult(res)
        if (res.success) {
          setEmail('')
          setRole('angel')
        }
      } else {
        const passToUse = password.trim() || generateSecureTempPassword()
        const res = await createUserWithPasswordAction(email, role, passToUse)
        setResult(res)
        if (res.success) {
          setCreatedCredentials({
            email: email.trim(),
            password: passToUse,
            role,
          })
          setEmail('')
          setPassword('')
        }
      }
    })
  }

  function handleCopyCredentials() {
    if (!createdCredentials) return
    const text =
`TVCLabs Portfolio OS — Investor Account Created
Role: ${createdCredentials.role.toUpperCase()}
Email: ${createdCredentials.email}
Temporary Password: ${createdCredentials.password}
Portal URL: ${typeof window !== 'undefined' ? `${window.location.origin}/login` : 'https://portfolio.tvclabs.com/login'}`

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-100 bg-white shadow-sm p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Onboard New User</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {mode === 'invite'
              ? 'Sends an invite magic link via email. Role is assigned at invite time.'
              : 'Directly creates and auto-confirms user credentials for immediate login.'}
          </p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-lg w-fit shrink-0">
          <button
            type="button"
            onClick={() => {
              setMode('invite')
              setResult(null)
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              mode === 'invite'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-zinc-500" />
            <span>Send Email Invite</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('password')
              setResult(null)
              if (!password) setPassword(generateSecureTempPassword())
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              mode === 'password'
                ? 'bg-white text-zinc-900 shadow-2xs'
                : 'text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>Set Password Directly</span>
          </button>
        </div>
      </div>

      {result && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${
          result.success
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {result.success
            ? mode === 'invite'
              ? 'Invite email sent successfully.'
              : 'User account created and confirmed successfully.'
            : result.error}
        </div>
      )}

      {/* Copyable Credentials Banner */}
      {createdCredentials && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                Account Created Successfully
              </p>
            </div>
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={handleCopyCredentials}
              className="gap-1.5 bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-50 text-xs font-semibold"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 text-emerald-600" />
                  Copy Credentials
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white/90 p-3 rounded-lg border border-emerald-100">
            <div>
              <span className="text-[10px] text-zinc-400 font-medium uppercase">Email</span>
              <p className="font-semibold text-zinc-900 truncate">{createdCredentials.email}</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-medium uppercase">Role</span>
              <p className="font-semibold text-amber-800 capitalize">{createdCredentials.role}</p>
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 font-medium uppercase">Initial Password</span>
              <p className="font-mono font-bold text-zinc-900">{createdCredentials.password}</p>
            </div>
          </div>
          <p className="text-[11px] text-emerald-800">
            You can copy and send these credentials directly to the investor. They can log in immediately.
          </p>
        </div>
      )}

      {/* Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className={mode === 'password' ? 'sm:col-span-4' : 'sm:col-span-6'}>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="angel@example.com"
            className={inputClass}
          />
        </div>

        <div className={mode === 'password' ? 'sm:col-span-3' : 'sm:col-span-3'}>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={`${selectClass} w-full`}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {mode === 'password' && (
          <div className="sm:col-span-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                Initial Password
              </label>
              <button
                type="button"
                onClick={() => setPassword(generateSecureTempPassword())}
                className="text-[10px] font-semibold text-[#1a23bd] hover:underline flex items-center gap-1"
                title="Generate random password"
              >
                <Sparkles className="w-3 h-3" />
                Randomize
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. TVCAngel-2026!"
                className={`${inputClass} pr-8 font-mono text-xs`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        <div className={mode === 'password' ? 'sm:col-span-2' : 'sm:col-span-3'}>
          <Button
            onClick={handleAction}
            disabled={isPending || !email || (mode === 'password' && !password && password.length > 0 && password.length < 6)}
            size="sm"
            className="w-full whitespace-nowrap bg-[#1a23bd] hover:bg-[#151ca3] text-white"
          >
            {isPending
              ? 'Processing…'
              : mode === 'invite'
              ? 'Send invite'
              : 'Create user'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── User row ──────────────────────────────────────────────────
function UserRow({
  user,
  onManageHoldings,
}: {
  user: ManagedUser
  onManageHoldings: (user: ManagedUser) => void
}) {
  const [role, setRole] = useState<UserRole | ''>(user.role ?? '')
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roleDirty = role !== (user.role ?? '')

  function handleRoleChange() {
    if (!role) return
    setError(null)
    startTransition(async () => {
      const res = await updateUserRoleAction(user.id, role as UserRole)
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        setError(res.error ?? 'Failed to update role')
      }
    })
  }

  function handleToggleAccess() {
    setError(null)
    startTransition(async () => {
      const res = await toggleUserAccessAction(user.id, !user.is_disabled)
      if (!res.success) setError(res.error ?? 'Failed to update access')
    })
  }

  return (
    <tr className={`group transition-colors ${user.is_disabled ? 'opacity-50' : 'hover:bg-zinc-50/60'}`}>
      <td className="px-5 py-4 whitespace-nowrap">
        <div>
          <p className="text-sm font-medium text-zinc-900">{user.email}</p>
          {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
        </div>
      </td>
      <td className="px-5 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            disabled={user.is_disabled}
            className={`${selectClass} text-xs py-1`}
          >
            <option value="">No role</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
          {user.role && !roleDirty && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium ${ROLE_STYLES[user.role] ?? ''}`}>
              {user.role}
            </span>
          )}
          {roleDirty && (
            <Button
              size="xs"
              onClick={handleRoleChange}
              disabled={isPending}
            >
              {isPending ? '…' : 'Save'}
            </Button>
          )}
          {saved && !roleDirty && (
            <span className="text-xs text-emerald-600 font-medium">✓</span>
          )}
        </div>
      </td>
      <td className="px-5 py-4 text-xs text-zinc-400 whitespace-nowrap">
        {formatDate(user.last_sign_in_at)}
      </td>
      <td className="px-5 py-4 text-xs text-zinc-400 whitespace-nowrap">
        {formatDate(user.created_at)}
      </td>
      <td className="px-5 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          {user.role === 'angel' && (
            <button
              type="button"
              onClick={() => onManageHoldings(user)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100/80 transition-colors cursor-pointer"
            >
              <PieChart className="w-3 h-3 text-amber-600" />
              Holdings
            </button>
          )}
          <button
            onClick={handleToggleAccess}
            disabled={isPending}
            className={`text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer ${
              user.is_disabled
                ? 'text-emerald-600 hover:text-emerald-700'
                : 'text-red-500 hover:text-red-700'
            }`}
          >
            {isPending ? '…' : user.is_disabled ? 'Restore access' : 'Revoke access'}
          </button>
        </div>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export default function UsersTabView({ users }: Props) {
  const [selectedAngelUser, setSelectedAngelUser] = useState<ManagedUser | null>(null)
  const [isHoldingsOpen, setIsHoldingsOpen] = useState(false)

  function handleOpenHoldings(user: ManagedUser) {
    setSelectedAngelUser(user)
    setIsHoldingsOpen(true)
  }

  return (
    <div className="space-y-6">
      <InviteForm />

      <div className="rounded-xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-50">
          <h3 className="text-sm font-semibold text-zinc-900">All users</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {users.length} user{users.length !== 1 ? 's' : ''} in the system
          </p>
        </div>
        {users.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-zinc-400">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-50">
                  {['Email', 'Role', 'Last sign in', 'Joined', ''].map((col) => (
                    <th
                      key={col}
                      className="px-5 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wide whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onManageHoldings={handleOpenHoldings}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Sheet for Angel Holdings */}
      <AngelHoldingsSheet
        user={selectedAngelUser}
        isOpen={isHoldingsOpen}
        onClose={() => {
          setIsHoldingsOpen(false)
          setSelectedAngelUser(null)
        }}
      />
    </div>
  )
}