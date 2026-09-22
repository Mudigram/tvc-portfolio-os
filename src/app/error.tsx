'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ShieldAlert, RotateCcw, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Optionally log error to an error reporting service
    console.error('Unhandled runtime error:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="max-w-lg w-full p-6 text-center space-y-6 shadow-lg border-border">
        <CardContent className="pt-2 space-y-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <ShieldAlert className="w-7 h-7 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              Application Exception Encountered
            </h1>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              An unexpected operational fault occurred while rendering this view. Your session and data records remain secure.
            </p>
            {error.digest && (
              <p className="text-[10px] font-mono text-muted-foreground/70">
                Digest: {error.digest}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => reset()}
              size="sm"
              className="w-full sm:w-auto gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full sm:w-auto gap-1.5"
            >
              <Link href="/dashboard">
                <LayoutDashboard className="w-4 h-4" />
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
