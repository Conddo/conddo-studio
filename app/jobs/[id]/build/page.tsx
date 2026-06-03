"use client";

import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";
import { StudioShell } from "@/components/app/StudioShell";
import { EmptyState } from "@/components/ui/States";

// The full in-app website builder (section library, live preview, AI assistant —
// Studio architecture §8/§16) is a later epic. For now the website is built in the
// external Studio tool and its URL is submitted for QA from the job detail.
export default function JobBuildPage({ params }: { params: { id: string } }) {
  return (
    <StudioShell title="Builder" subtitle="Website build workspace">
      <Link href={`/jobs/${params.id}`} className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-content-secondary hover:text-ink">
        <ArrowLeft size={15} /> Back to job
      </Link>
      <EmptyState
        icon={Wrench}
        title="Builder is coming soon"
        description="The in-app website builder (sections, live preview, AI copy) is being built. For now, build the site in the Studio tool and submit its URL for QA from the job detail."
      />
    </StudioShell>
  );
}
