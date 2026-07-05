/**
 * The three roles in Portfolio OS.
 *
 * Roles are assigned via `app_metadata.role` in Supabase Auth,
 * and enforced at the database layer through RLS policies that
 * call the `get_user_role()` helper function.
 *
 * - internal  Full access. TVCLabs team members.
 * - angel     Read-only. Scoped to companies where they have exposure
 *             via the angel_exposures join table.
 * - founder   Write access to their own company's monthly updates
 *             and DDR uploads only.
 */
export type UserRole = 'internal' | 'angel' | 'founder'
