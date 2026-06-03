"use client";

import Link from "next/link";
import { List, Briefcase } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { JobList } from "@/components/app/JobList";
import { useApiQuery } from "@/hooks/useApiQuery";
import { meQuery } from "@/lib/account";
import { jobsApi } from "@/lib/jobs";
import type { Staff } from "@/types";

export default function DashboardPage() {
  const { data: staff } = useApiQuery<Staff>(meQuery);
  const mine = useApiQuery(jobsApi.myJobs);
  const available = useApiQuery(jobsApi.available);
  const myJobs = mine.data ?? [];
  const firstName = staff?.name?.trim().split(/\s+/)[0] ?? "";

  const stats = [
    { label: "My active jobs", value: myJobs.length, href: "/jobs/my-jobs", icon: List },
    { label: "Available to claim", value: (available.data ?? []).length, href: "/jobs", icon: Briefcase },
  ];

  return (
    <StudioShell title={firstName ? `Welcome, ${firstName}` : "Dashboard"} subtitle="Your jobs at a glance.">
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-xl border border-neutral-border bg-neutral-surface p-5 transition-colors hover:border-primary/50">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[13px] text-content-secondary">{s.label}</p>
              <s.icon size={18} className="text-content-muted" />
            </div>
            <p className="font-mono text-[28px] font-semibold leading-none text-ink">{s.value}</p>
          </Link>
        ))}
      </div>

      <h2 className="mb-4 text-[15px] font-medium text-ink">My active jobs</h2>
      <JobList
        jobs={myJobs}
        loading={mine.loading}
        error={mine.error}
        onRetry={mine.refetch}
        loadingLabel="Loading your jobs…"
        emptyIcon={List}
        emptyTitle="No active jobs"
        emptyDescription="Claim a job from Available Jobs to get started."
      />
    </StudioShell>
  );
}
