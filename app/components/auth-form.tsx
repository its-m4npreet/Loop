"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Mail, LockKeyhole, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";

const btnTap = { scale: 0.97 };


type AuthMode = "signin" | "signup";


export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function resendVerification() {
    setResending(true);
    setError("");
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend. Please try again.");
      }
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    if (mode === "signup" && !name) {
      setError("Full name is required");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }

        if (!data.emailVerified) {
          setVerificationSent(true);
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(
          mode === "signup"
            ? "Account created but sign in failed. Please try signing in."
            : "Invalid email or password"
        );
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (verificationSent) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg shadow-slate-200/60">
        <div className="flex flex-col items-center text-center">
          <CheckCircle className="mb-4" size={48} color="#22c55e" />
          <h2 className="text-xl font-semibold text-slate-900">Verify your email</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            We&apos;ve sent a verification link to <strong>{email}</strong>. Check
            your inbox (and spam folder) and click the link to activate your
            account, then sign in.
          </p>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          {!resent ? (
            <button
              type="button"
              onClick={resendVerification}
              disabled={resending}
              className="mt-4 text-sm font-semibold text-loop-green hover:text-loop-green-dark disabled:opacity-60"
            >
              {resending ? "Resending..." : "Resend verification email"}
            </button>
          ) : (
            <p className="mt-4 text-sm font-semibold text-loop-green">
              A new verification email has been sent.
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setVerificationSent(false);
              setMode("signin");
            }}
            className="mt-3 text-sm font-medium text-slate-500 hover:text-slate-700"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg shadow-slate-200/60">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to your workspace or create one in under a minute.
        </p>
      </div>

      <motion.button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        whileTap={btnTap}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
      >
        <FcGoogle size={20} />
        Continue with Google
      </motion.button>

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          or
        </span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="mb-6 flex rounded-lg bg-slate-100 p-1">
        <motion.button
          type="button"
          onClick={() => { setMode("signin"); setError(""); }}
          whileTap={btnTap}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
            mode === "signin"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Sign in
        </motion.button>
        <motion.button
          type="button"
          onClick={() => { setMode("signup"); setError(""); }}
          whileTap={btnTap}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
            mode === "signup"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Sign up
        </motion.button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {mode === "signup" && (
            <motion.div
              key="name-field"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <label
                htmlFor="full-name"
                className="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Full name
              </label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="full-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-loop-green focus:ring-2 focus:ring-loop-green/20"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-semibold text-slate-800"
          >
            Work email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3.5 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-loop-green focus:ring-2 focus:ring-loop-green/20"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-slate-800"
            >
              Password
            </label>
            {mode === "signin" && (
              <Link
                href="/auth/forgot-password"
                className="text-xs font-medium text-loop-green hover:text-loop-green-dark"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={mode === "signup" ? "Create a strong password" : "Enter your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-loop-green focus:ring-2 focus:ring-loop-green/20"
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </motion.button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={loading ? undefined : btnTap}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-loop-green py-2.5 text-sm font-semibold text-white transition-colors hover:bg-loop-green-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {mode === "signup" ? "Create account" : "Sign in"}
        </motion.button>
      </form>
    </div>
  );
}
