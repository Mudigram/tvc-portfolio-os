export function AngelEmptyState() {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-8">
        <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-6">
          <span className="text-zinc-400 text-lg">◎</span>
        </div>
        <p className="text-sm font-medium text-zinc-900 mb-2">
          No portfolio positions yet
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
          Your investments will appear here once TVCLabs links your positions
          to your account. Contact your TVCLabs administrator if you believe
          this is an error.
        </p>
      </div>
    )
  }