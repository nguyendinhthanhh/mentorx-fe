import * as React from "react"
import { cn } from "@/utils/cn"

const BubbleContext = React.createContext<{ variant: "default" | "muted" }>({ variant: "default" })

export interface BubbleProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "muted"
  align?: "start" | "end"
}

export const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(
  ({ className, variant = "default", align = "start", children, ...props }, ref) => {
    return (
      <BubbleContext.Provider value={{ variant }}>
        <div
          ref={ref}
          className={cn(
            "flex flex-col gap-1 w-full max-w-sm",
            align === "end" ? "self-end items-end" : "self-start items-start",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </BubbleContext.Provider>
    )
  }
)
Bubble.displayName = "Bubble"

export const BubbleContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { variant } = React.useContext(BubbleContext)
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl px-4 py-2 text-[15px] w-fit",
          variant === "default" 
            ? "bg-blue-600 text-white" 
            : "bg-slate-100 text-slate-900 border border-slate-200",
          className
        )}
        {...props}
      />
    )
  }
)
BubbleContent.displayName = "BubbleContent"

export const BubbleGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col gap-2 w-full", className)}
        {...props}
      />
    )
  }
)
BubbleGroup.displayName = "BubbleGroup"

export const BubbleReactions = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-1.5 mt-1 text-xs", className)}
        {...props}
      />
    )
  }
)
BubbleReactions.displayName = "BubbleReactions"
