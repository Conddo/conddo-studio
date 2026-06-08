"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Copy, Check, X } from "lucide-react";

/** Plaintext key reveal — shown immediately after register or rotate. The
 *  modal is intentionally hard to dismiss accidentally: the OK button stays
 *  disabled until the user has clicked Copy OR ~5s has passed. After close,
 *  the plaintext is gone from anywhere the user can recover it. */
export function ApiKeyResultModal({
  apiKey,
  title,
  description,
  open,
  onClose,
}: {
  apiKey: string;
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [delayed, setDelayed] = useState(false);

  // Auto-enable Confirm after 5s even if the user forgets to copy — they may
  // be reading the key off-screen into a password manager.
  useEffect(() => {
    if (!open) return;
    setCopied(false);
    setDelayed(false);
    const t = setTimeout(() => setDelayed(true), 5000);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
    } catch {
      // Fallback: select the input so the user can copy manually.
      const el = document.getElementById("api-key-result-input") as HTMLInputElement | null;
      el?.select();
    }
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      {/* Backdrop — click-to-close DISABLED to prevent accidental dismissal
          before the user has copied the key. The X / Confirm buttons are the
          only ways out. */}
      <div className="absolute inset-0 bg-black/70" />
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-border bg-neutral-surface p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[17px] font-medium text-ink">{title}</h2>
            <p className="mt-0.5 text-[13px] text-content-secondary">{description}</p>
          </div>
        </div>

        {/* Warning */}
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning-bg px-3 py-2.5 text-[13px] text-warning">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <p>
            <span className="font-medium text-ink">Copy this key now — you won't see it again.</span>{" "}
            We store only a one-way hash and the last 4 characters. If you lose this value, you'll need to rotate the key.
          </p>
        </div>

        {/* Key */}
        <label className="mb-1.5 block text-[12px] font-medium uppercase tracking-[0.06em] text-content-secondary">
          Site API Key
        </label>
        <div className="flex items-center gap-2">
          <input
            id="api-key-result-input"
            readOnly
            value={apiKey}
            className="h-11 flex-1 rounded-md border border-neutral-strong bg-neutral-bg px-3 font-mono text-[12px] text-ink"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-11 items-center gap-1.5 rounded-md border border-neutral-strong px-3 text-[13px] font-medium text-content-secondary transition-colors hover:bg-neutral-surface2 hover:text-ink"
            title="Copy to clipboard"
          >
            {copied ? <Check size={15} className="text-success" /> : <Copy size={15} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <p className="mt-3 text-[12px] text-content-muted">
          Share via 1Password or your team's secret manager — never paste this in Slack DMs, email, or Git.
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={!copied && !delayed}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white hover:bg-primary-hover disabled:opacity-50"
            title={copied || delayed ? undefined : "Copy the key first, or wait a few seconds"}
          >
            I've saved the key
          </button>
          {/* Escape hatch — small × icon, doesn't draw the eye. The disabled-
              until-copied state is on the main button only. */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Dismiss"
            className="rounded-md p-2 text-content-muted hover:text-ink"
            title="Dismiss without saving"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
