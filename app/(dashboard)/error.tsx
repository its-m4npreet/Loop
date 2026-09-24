"use client"

import { useEffect } from "react"
import Link from "next/link"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        gap: "16px",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          color: "#0f172a",
          margin: 0,
        }}
      >
        Something went wrong
      </h1>
      <p style={{ color: "#64748b", maxWidth: 420, margin: 0 }}>
        We couldn&apos;t load this page. Try again, or head back to your
        dashboard.
      </p>
      {error.digest ? (
        <p style={{ color: "#94a3b8", fontSize: "0.8rem", margin: 0 }}>
          Error ID: {error.digest}
        </p>
      ) : null}
      <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "#22c55e",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          style={{
            padding: "10px 20px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            color: "#0f172a",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
