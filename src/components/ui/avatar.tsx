import * as React from "react"
import { cn } from "@/utils/cn"

const AvatarContext = React.createContext<{ loaded: boolean, setLoaded: (v: boolean) => void }>({
  loaded: false,
  setLoaded: () => {},
})

export const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const [loaded, setLoaded] = React.useState(false)
    return (
      <AvatarContext.Provider value={{ loaded, setLoaded }}>
        <div
          ref={ref}
          className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
          {...props}
        />
      </AvatarContext.Provider>
    )
  }
)
Avatar.displayName = "Avatar"

export const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, ...props }, ref) => {
    const { loaded, setLoaded } = React.useContext(AvatarContext)
    return (
      <img
        ref={ref}
        className={cn("aspect-square h-full w-full object-cover", loaded ? "block" : "hidden", className)}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(false)}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = "AvatarImage"

export const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { loaded } = React.useContext(AvatarContext)
    if (loaded) return null
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700",
          className
        )}
        {...props}
      />
    )
  }
)
AvatarFallback.displayName = "AvatarFallback"
