"use client";

import { Briefcase } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { JobList } from "@/components/app/JobList";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useStudioEvent } from "@/hooks/useStudioEvent";
import { adminApi } from "@/lib/admin";

export default function AllJobsPage() {
  const { data, loading, error, refetch } = useApiQuery(adminApi.dashboard);
  const jobs = data?.jobs ?? [];

  // Same live-refetch rules as the operations dashboard — every transition
  // could appear in this all-jobs list.
  useStudioEvent("job.created", refetch);
  useStudioEvent("job.claimed", refetch);
  useStudioEvent("job.started", refetch);
  useStudioEvent("job.submitted", refetch);
  useStudioEvent("job.approved", refetch);
  useStudioEvent("job.revision_requested", refetch);
  useStudioEvent("job.reassigned", refetch);
  useStudioEvent("job.escalated", refetch);
  useStudioEvent("job.sla_extended", refetch);

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
