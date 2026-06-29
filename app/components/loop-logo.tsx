import { Infinity } from "lucide-react"

export function LoopLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-loop-green">
        <Infinity className="h-5 w-5 text-white" />
      </div>
      <span className="text-lg font-bold tracking-tight text-slate-900">
        LOOP
      </span>
    </div>
  );
}
