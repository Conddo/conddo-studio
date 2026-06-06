import type { MetadataRoute } from "next";

// PWA manifest for Conddo Studio (internal ops). Next.js serves this at
// /manifest.webmanifest and auto-injects <link rel="manifest">. Combined
// with the iOS meta tags in layout.tsx and the minimal service worker at
// /sw.js, this is what makes "Install app" appear in the address bar on
// Chrome/Edge.
//
// Studio targets the internal team (devs, QA, leads, ops) — most are on
// desktop, so we don't ship the iOS Add-to-Home-Screen hint UI that
// conddo-app uses. iOS users can still install via Safari's Share menu
// manually if they want a mobile shortcut.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Conddo Studio — Internal Operations",
    short_name: "Studio",
    description:
      "Internal operations platform — jobs, builds, and QA for the Conddo.io production team.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F8F8F6",
    theme_color: "#7C5CBF",
    lang: "en",
    categories: ["business", "productivity"],
    icons: [
      { src: "/conddo_icon.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/conddo_icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/conddo_icon.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
