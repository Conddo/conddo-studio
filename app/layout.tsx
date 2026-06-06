import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { PwaBootstrap } from "@/components/app/PwaBootstrap";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "Conddo Studio",
  description: "Internal operations platform — jobs, builds, and QA for the Conddo.io production team.",
  icons: { icon: "/conddo_icon.png", apple: "/conddo_icon.png" },
  // iOS Safari ignores manifest.display — needs these to launch as a
  // standalone app from the Home Screen.
  appleWebApp: { capable: true, title: "Studio", statusBarStyle: "default" },
  applicationName: "Conddo Studio",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#7C5CBF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${GeistMono.variable}`}>
      <body className="bg-neutral-bg font-sans text-ink antialiased">
        {children}
        {/* Registers the SW + tracks beforeinstallprompt so the sidebar's
            Install button can fire prompt() when supported. */}
        <PwaBootstrap />
      </body>
    </html>
  );
}
