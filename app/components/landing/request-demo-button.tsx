import Link from "next/link"
import { ArrowRight } from "lucide-react"

type RequestDemoButtonProps = {
  variant?: "primary" | "outline"
  size?: "default" | "sm"
  className?: string
}

export function RequestDemoButton({
  variant = "primary",
  size = "default",
  className = "",
}: RequestDemoButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors"

  const sizes = {
    default: "px-8 py-4 text-sm",
    sm: "px-5 py-2.5 text-sm",
  }

  const variants = {
    primary:
      "bg-loop-green text-white shadow-md shadow-emerald-200/70 hover:bg-loop-green-dark",
    outline:
      "border border-loop-green bg-transparent text-loop-green hover:bg-emerald-50",
  }

  return (
    <Link
      href="/auth/signup"
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      Request Demo
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}
