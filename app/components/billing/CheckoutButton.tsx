"use client"

import { useState } from "react"

type Props = {
  plan: "PRO" | "BUSINESS"
  label: string
  className?: string
  variant?: "primary" | "outline"
}

type RazorpayInstance = {
  open: () => void
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance
  }
}

let razorpayScriptPromise: Promise<void> | null = null

function loadRazorpayScript(): Promise<void> {
  if (razorpayScriptPromise) return razorpayScriptPromise

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById("razorpay-checkout-js")
    if (existing) {
      existing.addEventListener("load", () => resolve())
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay checkout"))
      )
      return
    }
    const script = document.createElement("script")
    script.id = "razorpay-checkout-js"
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout"))
    document.body.appendChild(script)
  })

  return razorpayScriptPromise
}

export default function CheckoutButton({
  plan,
  label,
  className,
  variant = "primary",
}: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStart() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setBusy(false)
        return
      }
      const { subscriptionId, keyId } = data as {
        subscriptionId: string
        keyId: string
      }
      await loadRazorpayScript()
      if (!window.Razorpay) {
        setError("Could not load the payment page. Please try again.")
        setBusy(false)
        return
      }
      const rzp = new window.Razorpay({
        key: keyId,
        subscription_id: subscriptionId,
        handler: () => {
          window.location.href = "/settings/billing?checkout=success"
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      })
      rzp.open()
      setBusy(false)
    } catch {
      setError("Could not start checkout. Please try again.")
      setBusy(false)
    }
  }

  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60"
  const styles =
    variant === "primary"
      ? "bg-loop-green text-white hover:bg-loop-green-dark"
      : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"

  return (
    <span className={className}>
      <button
        type="button"
        onClick={handleStart}
        disabled={busy}
        className={`${base} ${styles} w-full sm:w-auto`}
      >
        {busy ? "Redirecting…" : label}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </span>
  )
}