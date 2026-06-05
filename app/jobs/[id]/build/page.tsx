"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Loader2,
  Code2,
  Rocket,
  ClipboardCheck,
  CheckCircle2,
} from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/States";
import { useApiQuery } from "@/hooks/useApiQuery";
import { jobsApi } from "@/lib/jobs";
import { assetsApi } from "@/lib/assets";
import { StudioApiError } from "@/lib/api";
import type { JobDetail } from "@/types";

// Public docs URL for the website integration spec — what the developer
// reads to wire up the tenant's data.
const INTEGRATION_DOCS_URL = "https://docs.conddo.io/website-integration";

function Step({
  index,
  title,
  body,
  icon: Icon,
}: {
  index: number;
  title: string;
  body: React.ReactNode;
  icon: typeof Download;
}) {
  return (
    <li className="relative flex gap-4 rounded-2xl border border-neutral-border bg-neutral-surface p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-bg text-primary-light">
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-content-muted">Step {index}</p>
        <h3 className="mt-0.5 text-[15px] font-medium text-ink">{title}</h3>
        <div className="mt-2 text-[14px] leading-relaxed text-content-secondary">{body}</div>
      </div>
    </li>
  );
}

function Workflow({ job }: { job: JobDetail }) {
  const [bundling, setBundling] = useState(false);
  const [bundleError, setBundleError] = useState<string | null>(null);
  const tenantSlug = (job.brief?.tenantSlug as string | undefined) ?? null;

  async function downloadBundle() {
    setBundling(true);
    setBundleError(null);
    try {
      await assetsApi.downloadBundle(job.id);
    } catch (err) {
      setBundleError(err instanceof StudioApiError ? err.message : "Couldn't build the bundle.");
    } finally {
      setBundling(false);
    }
  }

  const canDownload = ["ASSIGNED", "IN_PROGRESS", "REVISION"].includes(job.status);
  const canSubmit = ["IN_PROGRESS", "REVISION"].includes(job.status);

  return (
    <div className="space-y-6">
      {/* Header — links back to the job, restates the build model */}
      <div className="rounded-2xl border border-neutral-border bg-neutral-surface p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-content-muted">{job.jobNumber}</p>
        <h2 className="mt-0.5 text-[18px] font-medium text-ink">{job.title}</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-content-secondary">
          The website is built <strong className="text-ink">locally on your machine</strong>, deployed to its
          target host (Vercel for Launcher tenants, 9stacks for Growth), then submitted here for QA. There is
          no in-app builder — this page is a guide.
        </p>
      </div>

      <ol className="space-y-3">
        <Step
          index={1}
          icon={Download}
          title="Download the bundle"
          body={
            <>
              <p>
                The bundle ZIP contains the business brief, all uploaded files (logo, photos, copy), and a
                manifest of the tenant's setup. Everything you need to build offline.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={downloadBundle}
                  disabled={!canDownload || bundling}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
                >
                  {bundling ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {bundling ? "Building bundle…" : "Download bundle"}
                </button>
                {!canDownload && (
                  <span className="text-[12px] text-content-muted">
                    Claim and start the job first.
                  </span>
                )}
              </div>
              {bundleError && (
                <p className="mt-2 rounded-md border border-danger/20 bg-danger-bg px-3 py-2 text-[12px] text-danger">
                  {bundleError}
                </p>
              )}
            </>
          }
        />
        <Step
          index={2}
          icon={Code2}
          title="Wire up the data"
          body={
            <>
              <p>
                Read live tenant data from the public API using the tenant's site key (the masked
                <code className="mx-1 rounded bg-neutral-surface2 px-1 py-0.5 font-mono text-[12px]">X-Conddo-Site-Key</code>
                shown on their Conddo dashboard → Website → Developer integration). Endpoints + auth flow:
              </p>
              <a
                href={INTEGRATION_DOCS_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-primary-light hover:underline"
              >
                Open integration docs <ExternalLink size={13} />
              </a>
              {tenantSlug && (
                <p className="mt-2 font-mono text-[12px] text-content-muted">
                  Base path for this tenant: <span className="text-content-secondary">/api/v1/public/{tenantSlug}/…</span>
                </p>
              )}
            </>
          }
        />
        <Step
          index={3}
          icon={Rocket}
          title="Deploy"
          body={
            <p>
              Push the build to its hosting target (Launcher → Vercel under
              <code className="mx-1 rounded bg-neutral-surface2 px-1 py-0.5 font-mono text-[12px]">tenant.conddo.io</code>
              , Growth → 9stacks under
              <code className="mx-1 rounded bg-neutral-surface2 px-1 py-0.5 font-mono text-[12px]">tenant.com.ng</code>
              ). Grab the live URL once it's deployed.
            </p>
          }
        />
        <Step
          index={4}
          icon={ClipboardCheck}
          title="Submit for QA"
          body={
            <>
              <p>
                Paste the deployed URL on the job detail and submit. A reviewer will check it against the
                standard and either approve or send back revisions.
              </p>
              <div className="mt-3">
                <Link
                  href={`/jobs/${job.id}`}
                  className="inline-flex items-center gap-2 rounded-md border border-neutral-strong px-4 py-2 text-[14px] font-medium text-ink transition-colors hover:bg-neutral-surface2"
                >
                  <CheckCircle2 size={16} />
                  {canSubmit ? "Open submit form on the job" : "Back to job"}
                </Link>
              </div>
            </>
          }
        />
      </ol>
    </div>
  );
}

/** Workflow guide for the local-build-and-submit flow. There is no in-app
 *  builder by design — devs work on their own machines, then deliver via a
 *  deployed URL. This page documents what to do, where to grab the bundle,
 *  and where to submit; the actual job state changes happen on the job
 *  detail page. */
export default function JobBuildPage({ params }: { params: { id: string } }) {
  const { data, loading, error, refetch } = useApiQuery(() => jobsApi.get(params.id), [params.id]);

  return (
    <StudioShell title="Build & deliver" subtitle="Local build workflow">
      <Link
        href={`/jobs/${params.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-content-secondary hover:text-ink"
      >
        <ArrowLeft size={15} /> Back to job
      </Link>
      {loading ? (
        <LoadingState label="Loading job…" />
      ) : error ? (
        <ErrorState error={error} onRetry={refetch} />
      ) : !data ? (
        <EmptyState icon={ClipboardCheck} title="Job not found" />
      ) : (
        <Workflow job={data} />
      )}
    </StudioShell>
  );
}
