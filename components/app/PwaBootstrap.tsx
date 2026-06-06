"use client";

import { useEffect } from "react";

// Chrome / Edge / Android fire this on pages that meet the install criteria
// (manifest + SW + HTTPS + a use-heuristic). We intercept it, stash it on
// a global, and let any <InstallAppButton> fire prompt() when the user clicks.
declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
  interface Window {
    /** Set by PwaBootstrap when beforeinstallprompt fires.
     *  Reset to null after prompt() resolves or appinstalled fires. */
    __conddoInstallPrompt: BeforeInstallPromptEvent | null;
  }
  interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
    prompt(): Promise<void>;
  }
}

/** Mounted once in the root layout. Registers the service worker (which
 *  unlocks "Install app" on Chromium-based browsers) and stores the
 *  install-prompt event globally so any button can fire it. */
export function PwaBootstrap() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ("serviceWorker" in navigator) {
      window.addEventListener(
        "load",
        () => {
          navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
            /* swallow — Studio works fine without the SW, install just won't fire */
          });
        },
        { once: true },
      );
    }

    const onPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      window.__conddoInstallPrompt = e;
      window.dispatchEvent(new CustomEvent("conddo:install-available"));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    const onInstalled = () => {
      window.__conddoInstallPrompt = null;
      window.dispatchEvent(new CustomEvent("conddo:install-available"));
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return null;
}
