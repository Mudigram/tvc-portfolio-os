import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] whitespace-nowrap transition-all focus-visible:border-blue-300 focus-visible:ring-[3px] focus-visible:ring-blue-200 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 aria-invalid:border-red-300 aria-invalid:ring-red-100 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-blue-100 text-blue-700 [a]:hover:bg-blue-200",
        secondary: "bg-muted text-muted-foreground [a]:hover:bg-muted/80",
        destructive: "bg-red-100 text-red-700 [a]:hover:bg-red-200",
        outline: "border-border bg-card text-foreground [a]:hover:bg-muted",
        ghost: "bg-muted/50 text-muted-foreground hover:text-foreground",
        link: "text-blue-700 underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
