// ─────────────────────────────────────────────────────────────
// TvcEntitiesTabView — read-only reference view
// Shows the three fixed TVCLabs holders so you don't need
// to open Supabase to look up their UUIDs or details.
// ─────────────────────────────────────────────────────────────

import type { TvcEntity } from '../types'

interface Props {
  entities: TvcEntity[]
}

export default function TvcEntitiesTabView({ entities }: Props) {
  return (
    <div className="space-y-6 max-w-2xl">

      <div className="rounded-xl border border-zinc-100 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-zinc-50">
          <h3 className="text-sm font-semibold text-zinc-900">TVCLabs entities</h3>
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            These are the three fixed internal holders with economic exposure.
            They are identified by <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">is_tvclabs_entity = true</code> in the holders table.
            New TVCLabs entities cannot be created from the UI — contact your DB administrator.
          </p>
        </div>

        {entities.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-zinc-400">No TVC entities found.</p>
            <p className="text-xs text-zinc-400 mt-1">
              Ensure the three holders are seeded with <code className="text-xs bg-zinc-100 px-1 py-0.5 rounded">is_tvclabs_entity = true</code>.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {entities.map((entity) => (
              <div key={entity.id} className="px-6 py-5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-zinc-900">{entity.name}</p>
                  <p className="text-xs text-zinc-400">{entity.holder_type}</p>
                  {entity.email && (
                    <p className="text-xs text-zinc-400">{entity.email}</p>
                  )}
                </div>
                <div className="text-right space-y-1 shrink-0">
                  <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wide">
                    Holder ID
                  </p>
                  <code className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-100 px-2 py-1 rounded font-mono block">
                    {entity.id}
                  </code>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-100 bg-amber-50/40 px-5 py-4">
        <p className="text-xs text-amber-700 leading-relaxed">
          <strong>Note:</strong> These IDs are referenced throughout the platform to calculate TVC-specific
          deployed capital and ownership positions. If you need to add a new TVCLabs entity,
          insert a row in the <code className="text-xs bg-amber-100 px-1 py-0.5 rounded">holders</code> table
          with <code className="text-xs bg-amber-100 px-1 py-0.5 rounded">is_tvclabs_entity = true</code> and
          update the <code className="text-xs bg-amber-100 px-1 py-0.5 rounded">TVCLABS_HOLDER_IDS</code> constant
          in <code className="text-xs bg-amber-100 px-1 py-0.5 rounded">src/features/exposure/types.ts</code>.
        </p>
      </div>

    </div>
  )
}