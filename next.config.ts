import type { NextConfig } from "next";

function securityHeaders(): Array<{ key: string; value: string }> {
  const isDev = process.env.NODE_ENV !== "production";

  const scriptSrc = isDev
    ? "'self' 'unsafe-eval' 'unsafe-inline'"
    : "'self'";

  const csp = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.googleusercontent.com https://*.gstatic.com",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  return [
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
    },
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "Content-Security-Policy", value: csp },
  ];
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders(),
      },
    ];
  },
};

export default nextConfig;
