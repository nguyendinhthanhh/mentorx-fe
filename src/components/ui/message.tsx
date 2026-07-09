import * as React from "react"
import { cn } from "@/utils/cn"

export const MessageContext = React.createContext<{ align: "start" | "end" }>({ align: "start" })

export interface MessageProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "start" | "end"
}

export const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, align = "start", children, ...props }, ref) => {
    return (
      <MessageContext.Provider value={{ align }}>
        <div
          ref={ref}
          className={cn(
            "flex w-full gap-3 mb-4",
            align === "end" ? "flex-row-reverse" : "flex-row",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </MessageContext.Provider>
    )
  }
)
Message.displayName = "Message"

export const MessageAvatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { align } = React.useContext(MessageContext)
    return (
      <div
        ref={ref}
        className={cn("shrink-0 mt-auto", className)}
        {...props}
      />
    )
  }
)
MessageAvatar.displayName = "MessageAvatar"

export const MessageContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { align } = React.useContext(MessageContext)
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col gap-1 relative min-w-0 w-full max-w-[80%] sm:max-w-[70%]",
          align === "end" ? "items-end" : "items-start",
          className
        )}
        {...props}
      />
    )
  }
)
MessageContent.displayName = "MessageContent"

export const MessageFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { align } = React.useContext(MessageContext)
    return (
      <div
        ref={ref}
        className={cn(
          "text-[11px] text-[#66729d] absolute -bottom-5 flex whitespace-nowrap",
          align === "end" ? "right-1 text-right" : "left-1 text-left",
          className
        )}
        {...props}
      />
    )
  }
)
MessageFooter.displayName = "MessageFooter"
