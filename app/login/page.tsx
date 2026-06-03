"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { login } from "@/lib/account";
import { clearTokens } from "@/lib/auth";

const inputCls =
  "h-11 w-full rounded-md border border-neutral-strong bg-neutral-surface px-3.5 text-[15px] text-ink placeholder:text-content-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";
const labelCls = "mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-content-secondary";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Anyone landing here is starting a fresh session. Wipe any stale tokens
  // so the next request can't pre-flight with a dead Bearer (which Spring
  // would reject even on /auth/login).
  useEffect(() => { clearTokens(); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-[15px] font-bold text-white">C</span>
          <span className="text-[18px] font-semibold tracking-[-0.01em] text-ink">Conddo Studio</span>
        </div>

        <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-7">
          <header className="mb-6 text-center">
            <h1 className="text-[22px] leading-tight tracking-[-0.01em] text-ink">Sign in</h1>
            <p className="mt-1.5 text-[14px] text-content-secondary">Studio team access only.</p>
          </header>

          {error && (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-danger/20 bg-danger-bg px-4 py-3 text-[14px] text-danger">
              <AlertCircle size={18} className="shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className={labelCls}>Email</label>
              <input className={inputCls} type="email" placeholder="you@conddo.io" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <div className="relative">
                <input className={`${inputCls} pr-11`} type={show ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Hide" : "Show"} className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-secondary">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-[15px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
