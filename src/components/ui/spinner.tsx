import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SpinnerProps extends React.SVGProps<SVGSVGElement> {
  size?: "xs" | "sm" | "default" | "lg"
}

const sizeMap = {
  xs: "size-3",
  sm: "size-3.5",
  default: "size-4",
  lg: "size-5",
}

export function Spinner({ className, size = "default", ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin text-current shrink-0", sizeMap[size], className)}
      {...props}
    />
  )
}
