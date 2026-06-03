"use client";

import { List } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { JobList } from "@/components/app/JobList";
import { useApiQuery } from "@/hooks/useApiQuery";
import { jobsApi } from "@/lib/jobs";

export default function MyJobsPage() {
  const { data, loading, error, refetch } = useApiQuery(jobsApi.myJobs);
  const jobs = data ?? [];

  return (
    <StudioShell title="My Jobs" subtitle="Jobs you've claimed — build, then submit for QA.">
      <JobList
        jobs={jobs}
        loading={loading}
        error={error}
        onRetry={refetch}
        loadingLabel="Loading your jobs…"
        emptyIcon={List}
        emptyTitle="You have no active jobs"
        emptyDescription="Claim a job from Available Jobs to get started."
      />
    </StudioShell>
  );
}
