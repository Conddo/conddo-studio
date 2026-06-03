"use client";

import { Briefcase } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { JobList } from "@/components/app/JobList";
import { useApiQuery } from "@/hooks/useApiQuery";
import { jobsApi } from "@/lib/jobs";

export default function AvailableJobsPage() {
  const { data, loading, error, refetch } = useApiQuery(jobsApi.available);
  const jobs = data ?? [];

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
