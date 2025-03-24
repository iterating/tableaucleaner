import * as React from "react"
import { cn } from "@/utils/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex w-full min-h-[120px] rounded-md border border-input bg-background px-4 py-3 text-sm ring-offset-background",
        "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        "font-mono resize-y transition-colors duration-200 shadow-sm", 
        className
      )}
      ref={ref}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"

export { Textarea }
