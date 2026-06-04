"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, Briefcase, List, BarChart3, CheckCircle2, Activity,
  Users, LogOut, Menu, Tag, BookOpen, Building2, UserCog, type LucideIcon,
} from "lucide-react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { meQuery, logout } from "@/lib/account";
import { getAccessToken } from "@/lib/auth";
import { refreshAccessToken } from "@/lib/api";
import { roleLabel, initialsOf } from "@/lib/format";
import { NotificationsBell } from "@/components/app/NotificationsBell";
import { studioEvents } from "@/lib/sse";
import type { Role, Staff } from "@/types";

type NavItem = { label: string; href: string; icon: LucideIcon };

const WORKER: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: Home },
  { label: "Available Jobs", href: "/jobs", icon: Briefcase },
  { label: "My Jobs", href: "/jobs/my-jobs", icon: List },
  { label: "Performance", href: "/performance", icon: BarChart3 },
];
const QA: NavItem[] = [
  { label: "QA Queue", href: "/qa", icon: CheckCircle2 },
];
// LEAD nav — covers ops + Studio admin items both TEAM_LEAD and ADMIN can see.
const LEAD: NavItem[] = [
  { label: "Operations", href: "/admin", icon: Activity },
  { label: "All Jobs", href: "/admin/jobs", icon: Briefcase },
  { label: "QA Queue", href: "/qa", icon: CheckCircle2 },
  { label: "Staff", href: "/admin/staff", icon: Users },
  { label: "Job Types", href: "/admin/job-types", icon: Tag },
  { label: "Design Standards", href: "/admin/design-standards", icon: BookOpen },
];
// ADMIN-only extras — Platform Admin (§23) is cross-tenant management;
// blast radius too wide for TEAM_LEAD.
const ADMIN_EXTRAS: NavItem[] = [
  { label: "Platform Tenants", href: "/admin/platform/tenants", icon: Building2 },
  { label: "Platform Users", href: "/admin/platform/users", icon: UserCog },
];

const navFor = (role?: Role): NavItem[] => {
  if (role === "QA_REVIEWER") return QA;
  if (role === "ADMIN") return [...LEAD, ...ADMIN_EXTRAS];
  if (role === "TEAM_LEAD") return LEAD;
  return WORKER; // DEVELOPER / DESIGNER / WRITER
};

function SidebarBody({ pathname, staff, onNavigate, onLogout }: {
  pathname: string; staff: Staff | null; onNavigate?: () => void; onLogout: () => void;
}) {
  const nav = navFor(staff?.role);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[13px] font-bold text-white">C</span>
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Conddo Studio</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] transition-colors ${
                active ? "bg-primary-bg font-medium text-primary-light" : "text-content-secondary hover:bg-neutral-surface2 hover:text-ink"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-border px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-bg font-mono text-[12px] font-medium text-primary-light">
            {initialsOf(staff?.name ?? staff?.email ?? "?")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-ink">{staff?.name ?? "—"}</p>
            <p className="text-[11px] text-content-muted">{staff ? roleLabel(staff.role) : ""}</p>
          </div>
          <button onClick={onLogout} aria-label="Sign out" title="Sign out"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-content-secondary hover:bg-neutral-surface2 hover:text-ink">
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function StudioShell({ title, subtitle, actions, children }: {
  title: string; subtitle?: string; actions?: ReactNode; children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const { data: staff } = useApiQuery<Staff>(meQuery);

  useEffect(() => {
    let active = true;
    (async () => {
      if (getAccessToken()) {
        if (active) setAuthed(true);
        return;
      }
      const recovered = await refreshAccessToken();
      if (!active) return;
      if (recovered) setAuthed(true);
      else {
        setAuthed(false);
        router.replace("/login");
      }
    })();
    return () => { active = false; };
  }, [router]);

  // Open one Studio SSE stream per browser tab as soon as we know we're
  // authed; close it when the shell unmounts (i.e. on full app teardown).
  // Logout disconnects explicitly so events stop the moment the token dies.
  useEffect(() => {
    if (authed !== true) return;
    studioEvents.connect();
    return () => { studioEvents.disconnect(); };
  }, [authed]);

  async function handleLogout() {
    studioEvents.disconnect();
    await logout();
    router.replace("/login");
  }

  if (authed !== true) return <div className="min-h-screen bg-neutral-bg" />;

  return (
    <div className="min-h-screen bg-neutral-bg">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-neutral-border bg-neutral-surface lg:block">
        <SidebarBody pathname={pathname} staff={staff} onLogout={handleLogout} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-neutral-border bg-neutral-surface">
            <SidebarBody pathname={pathname} staff={staff} onNavigate={() => setOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-neutral-border bg-neutral-bg/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setOpen(true)} aria-label="Open menu" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-content-secondary hover:bg-neutral-surface2 lg:hidden">
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-semibold tracking-[-0.01em] text-ink">{title}</h1>
              {subtitle && <p className="truncate text-[13px] text-content-secondary">{subtitle}</p>}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <NotificationsBell />
            {actions}
          </div>
        </header>
        <main className="px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
