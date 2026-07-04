import { Infinity } from "lucide-react"

type LoopLogoProps = {
  variant?: "default" | "landing"
}

export function LoopLogo({ variant = "default" }: LoopLogoProps) {
  if (variant === "landing") {
    return (
      <div className="flex items-center gap-2">
        <Infinity className="h-7 w-7 text-loop-green" strokeWidth={2.5} />
        <span className="text-lg font-bold tracking-tight text-slate-900">
          LOOP
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-loop-green">
        <Infinity className="h-5 w-5 text-white" />
      </div>
      <span className="text-lg font-bold tracking-tight text-slate-900">
        LOOP
      </span>
    </div>
  )
}
