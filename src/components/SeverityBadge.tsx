import { cn } from "@/lib/utils";
import type { Severity } from "@/types/design-issue";

const config: Record<Severity, { label: string; dotClass: string; bgClass: string }> = {
  minor: {
    label: "Minor",
    dotClass: "bg-severity-minor",
    bgClass: "bg-severity-minor/10 text-severity-minor",
  },
  moderate: {
    label: "Moderate",
    dotClass: "bg-severity-moderate",
    bgClass: "bg-severity-moderate/10 text-severity-moderate",
  },
  major: {
    label: "Major",
    dotClass: "bg-severity-major",
    bgClass: "bg-severity-major/10 text-severity-major",
  },
};

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const c = config[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        c.bgClass,
        className
      )}
    >
      <span className={cn("h-2 w-2 rounded-full", c.dotClass)} />
      {c.label}
    </span>
  );
}
