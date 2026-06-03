"use client";

import { List } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { JobList } from "@/components/app/JobList";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useStudioEvent } from "@/hooks/useStudioEvent";
import { jobsApi } from "@/lib/jobs";

export default function MyJobsPage() {
  const { data, loading, error, refetch } = useApiQuery(jobsApi.myJobs);
  const jobs = data ?? [];

  // Live: any event that could change "what's on my plate".
  // job.claimed (we just claimed one), job.reassigned (one was handed to/from us),
  // job.approved / job.revision_requested (QA acted on one of ours), and
  // job.sla_extended (a deadline shifted).
  useStudioEvent("job.claimed", refetch);
  useStudioEvent("job.reassigned", refetch);
  useStudioEvent("job.approved", refetch);
  useStudioEvent("job.revision_requested", refetch);
  useStudioEvent("job.sla_extended", refetch);

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
