'use client'
// ─────────────────────────────────────────────────────────────
// UsersTabView — user management
// List all users, invite new, change role, revoke access.
// ─────────────────────────────────────────────────────────────

import { useState, useTransition } from 'react'
import {
  inviteUserAction,
  updateUserRoleAction,
  toggleUserAccessAction,
} from '../actions/settings.actions'
import type { ManagedUser, UserRole } from '../types'

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

// ── Invite form ───────────────────────────────────────────────
function InviteForm() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('angel')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null)

  function handleInvite() {
    setResult(null)
    startTransition(async () => {
      const res = await inviteUserAction(email, role)
      setResult(res)
      if (res.success) {
        setEmail('')
        setRole('angel')
      }
    })
  }

  return (
    <div className="rounded-xl border border-zinc-100 bg-white shadow-sm p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Invite new user</h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Sends a magic link to the email address. Role is set at invite time.
        </p>
      </div>

      {result && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${
          result.success
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {result.success ? 'Invite sent successfully.' : result.error}
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wide block mb-1.5">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={selectClass}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleInvite}
          disabled={isPending || !email}
          className="rounded-lg bg-[#1a23bd] px-4 py-2 text-sm font-medium text-white hover:bg-[#1520a8] disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {isPending ? 'Sending…' : 'Send invite'}
        </button>
      </div>
    </div>
  )
}

// ── User row ──────────────────────────────────────────────────
function UserRow({ user }: { user: ManagedUser }) {
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
            <button
              onClick={handleRoleChange}
              disabled={isPending}
              className="rounded-lg bg-[#1a23bd] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#1520a8] disabled:opacity-50 transition-colors"
            >
              {isPending ? '…' : 'Save'}
            </button>
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
      <td className="px-5 py-4 whitespace-nowrap">
        <button
          onClick={handleToggleAccess}
          disabled={isPending}
          className={`text-xs font-medium transition-colors disabled:opacity-50 ${
            user.is_disabled
              ? 'text-emerald-600 hover:text-emerald-700'
              : 'text-red-500 hover:text-red-700'
          }`}
        >
          {isPending ? '…' : user.is_disabled ? 'Restore access' : 'Revoke access'}
        </button>
      </td>
    </tr>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

export default function UsersTabView({ users }: Props) {
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
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}