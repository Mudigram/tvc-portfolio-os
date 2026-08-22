/**
 * The roles in Portfolio OS.
 *
 * Roles are assigned via `app_metadata.role` in Supabase Auth,
 * and enforced at the database layer through RLS policies that
 * call the `get_user_role()` helper function.
 *
 * - admin     Superset of internal access. Exclusive access to Governance Gap Visibility.
 * - internal  Full access to platform operations & editing.
 * - angel     Read-only. Scoped to companies where they have exposure via angel_exposures.
 * - founder   Write access to their own company's monthly updates and DDR uploads only.
 */
export type UserRole = 'admin' | 'internal' | 'angel' | 'founder'
