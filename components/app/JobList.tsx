import Link from "next/link";
import { Briefcase, type LucideIcon } from "lucide-react";
import type { JobCard } from "@/types";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/States";
import { StatusBadge, JobTypePill, SlaBadge } from "@/components/ui/Badges";

export function JobList({
  jobs,
  loading,
  error,
  onRetry,
  loadingLabel = "Loading jobs…",
  emptyIcon = Briefcase,
  emptyTitle = "No jobs here",
  emptyDescription,
  hrefFor = (id) => `/jobs/${id}`,
}: {
  jobs: JobCard[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  loadingLabel?: string;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  hrefFor?: (id: string) => string;
}) {
  if (loading && jobs.length === 0) return <LoadingState label={loadingLabel} />;
  if (error) return <ErrorState error={error} onRetry={onRetry} />;
  if (jobs.length === 0) return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {jobs.map((job) => (
        <Link
          key={job.id}
          href={hrefFor(job.id)}
          className="group rounded-xl border border-neutral-border bg-neutral-surface p-4 transition-colors hover:border-primary/50 hover:bg-neutral-surface2"
        >
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <span className="font-mono text-[12px] text-content-muted">{job.jobNumber}</span>
            <StatusBadge status={job.status} />
          </div>
          <h3 className="mb-1 line-clamp-2 text-[14px] font-medium leading-snug text-ink">{job.title}</h3>
          <div className="mb-3"><JobTypePill type={job.jobType} /></div>
          <div className="flex items-center justify-between border-t border-neutral-border pt-3">
            <SlaBadge tone={job.slaTone} deadline={job.slaDeadline} />
            <span className="text-[12px] text-primary-light opacity-0 transition-opacity group-hover:opacity-100">Open →</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
