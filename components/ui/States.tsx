import type { ReactNode } from "react";
import { Loader2, AlertCircle, type LucideIcon } from "lucide-react";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
      <Loader2 size={26} className="mb-3 animate-spin text-primary" />
      <p className="text-[14px] text-content-secondary">{label}</p>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-bg text-primary">
        <Icon size={26} />
      </span>
      <h3 className="text-[18px] font-medium tracking-[-0.01em] text-ink">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-content-secondary">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-danger-bg text-danger">
        <AlertCircle size={26} />
      </span>
      <h3 className="text-[18px] font-medium tracking-[-0.01em] text-ink">Something went wrong</h3>
      <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-content-secondary">{error.message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-5 rounded-md border border-neutral-border bg-neutral-surface px-4 py-2 text-[14px] font-medium text-ink hover:bg-neutral-surface2">
          Try again
        </button>
      )}
    </div>
  );
}
