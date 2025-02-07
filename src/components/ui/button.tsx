import { cva } from "class-variance-authority"
import { cn } from "@/utils/utils"
import { forwardRef } from "react"
import { ReactNode, ComponentPropsWithoutRef } from "react"
import { Slot } from "@radix-ui/react-slot"

type ButtonProps = ComponentPropsWithoutRef<"button"> & {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg"
  asChild?: boolean
  children?: ReactNode
}

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium text-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ 
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    >
      {children}
    </Comp>
  )
})

Button.displayName = "Button"

export { Button, buttonVariants }
