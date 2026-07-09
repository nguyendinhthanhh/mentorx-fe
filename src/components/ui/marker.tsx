import * as React from "react"
import { cn } from "@/utils/cn"

export const Marker = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex w-full items-center justify-center my-4", className)}
        {...props}
      />
    )
  }
)
Marker.displayName = "Marker"

export const MarkerContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "text-xs font-medium text-slate-500 rounded-full px-4 py-1.5 bg-slate-50 border border-slate-200",
          className
        )}
        {...props}
      />
    )
  }
)
MarkerContent.displayName = "MarkerContent"
