"use client";

import { Briefcase } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { JobList } from "@/components/app/JobList";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useStudioEvent } from "@/hooks/useStudioEvent";
import { jobsApi } from "@/lib/jobs";

export default function AvailableJobsPage() {
  const { data, loading, error, refetch } = useApiQuery(jobsApi.available);
  const jobs = data ?? [];

  // Live: new job enters the pool, or someone else claims one out from under us.
  useStudioEvent("job.created", refetch);
  useStudioEvent("job.claimed", refetch);

  return (
    <StudioShell title="Available Jobs" subtitle="Open jobs matching your skills — claim one to start.">
      <JobList
        jobs={jobs}
        loading={loading}
        error={error}
        onRetry={refetch}
        loadingLabel="Loading available jobs…"
        emptyIcon={Briefcase}
        emptyTitle="No jobs available right now"
        emptyDescription="New jobs appear here as businesses sign up. Check back shortly."
      />
    </StudioShell>
  );
}
