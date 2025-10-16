import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { type ButtonHTMLAttributes, forwardRef } from "react"

interface OrigamiButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "clay" | "neon" | "destructive" | "outline"
  size?: "sm" | "md" | "lg" | "default"
}

const OrigamiButton = forwardRef<HTMLButtonElement, OrigamiButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    // Map origami variants to Button variants and custom classes
    const variantClasses = {
      primary: "origami-button",
      secondary: "origami-card",
      clay: "clay-tablet hover:scale-105",
      neon: "origami-button neon-glow",
      destructive: "",
      outline: "",
    }

    // Map size variants
    const sizeMap = {
      sm: "sm" as const,
      md: "default" as const,
      lg: "lg" as const,
      default: "default" as const,
    }

    // Determine which Button variant to use
    const buttonVariant = variant === "destructive" || variant === "outline" ? variant : "default"

    return (
      <Button
        variant={buttonVariant}
        size={sizeMap[size]}
        className={cn(variantClasses[variant], className)}
        ref={ref}
        {...props}
      >
        {children}
      </Button>
    )
  },
)

OrigamiButton.displayName = "OrigamiButton"

export { OrigamiButton }
