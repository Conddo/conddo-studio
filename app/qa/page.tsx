"use client";

import { CheckCircle2 } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { JobList } from "@/components/app/JobList";
import { useApiQuery } from "@/hooks/useApiQuery";
import { useStudioEvent } from "@/hooks/useStudioEvent";
import { qaApi } from "@/lib/qa";

export default function QaQueuePage() {
  const { data, loading, error, refetch } = useApiQuery(qaApi.queue);
  const jobs = data ?? [];

  // Live: developers submit → queue grows; a reviewer claims/approves/returns → queue shrinks.
  useStudioEvent("job.submitted", refetch);
  useStudioEvent("job.approved", refetch);
  useStudioEvent("job.revision_requested", refetch);

  return (
    <StudioShell title="QA Queue" subtitle="Submitted jobs awaiting review.">
      <JobList
        jobs={jobs}
        loading={loading}
        error={error}
        onRetry={refetch}
        loadingLabel="Loading the queue…"
        emptyIcon={CheckCircle2}
        emptyTitle="Queue is clear"
        emptyDescription="No jobs awaiting review right now. Submissions appear here as developers finish."
        hrefFor={(id) => `/qa/${id}`}
      />
    </StudioShell>
  );
}
