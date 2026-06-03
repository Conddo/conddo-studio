"use client";

import { Briefcase } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { JobList } from "@/components/app/JobList";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adminApi } from "@/lib/admin";

export default function AllJobsPage() {
  const { data, loading, error, refetch } = useApiQuery(adminApi.dashboard);
  const jobs = data?.jobs ?? [];

  return (
    <StudioShell title="All Jobs" subtitle="Every job on the board, across all staff.">
      <JobList
        jobs={jobs}
        loading={loading}
        error={error}
        onRetry={refetch}
        loadingLabel="Loading the board…"
        emptyIcon={Briefcase}
        emptyTitle="No jobs on the board"
      />
    </StudioShell>
  );
}
