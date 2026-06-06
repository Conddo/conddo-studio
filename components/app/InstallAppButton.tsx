"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";

// True once the page is running inside the installed app (display-mode:
// standalone is set by Chromium / iOS when launched from the home screen).
function isInstalled(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

/** "Install Studio" CTA. Studio targets internal team members on desktop;
 *  we keep this minimal — show when Chromium has the prompt ready, hide
 *  otherwise. iOS users (rare for Studio) can install via Safari Share →
 *  Add to Home Screen manually if they want.
 *
 *  Returns null when:
 *    - already installed (display-mode: standalone)
 *    - no prompt has fired yet (most platforms / first visit)
 *  …so it never renders a dead button. */
export function InstallAppButton() {
  const [available, setAvailable] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(isInstalled());
    setAvailable(Boolean(window.__conddoInstallPrompt));
    const update = () => {
      setInstalled(isInstalled());
      setAvailable(Boolean(window.__conddoInstallPrompt));
    };
    window.addEventListener("conddo:install-available", update);
    return () => window.removeEventListener("conddo:install-available", update);
  }, []);

  if (installed || !available) return null;

  async function install() {
    const evt = window.__conddoInstallPrompt;
    if (!evt) return;
    try {
      await evt.prompt();
      await evt.userChoice;
    } catch {
      /* user dismissed; nothing to do */
    } finally {
      window.__conddoInstallPrompt = null;
      setAvailable(false);
    }
  }

  return (
    <button
      type="button"
      onClick={install}
      title="Install Studio as a desktop app"
      className="inline-flex items-center gap-2 rounded-md border border-neutral-border bg-neutral-surface px-3 py-1.5 text-[12px] font-medium text-content-secondary transition-colors hover:bg-neutral-surface2 hover:text-ink"
    >
      <Download size={14} />
      Install Studio
    </button>
  );
}
