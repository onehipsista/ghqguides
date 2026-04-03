import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/SeverityBadge";
import type { DesignIssue } from "@/types/design-issue";

interface MistakeCardProps {
  issue: DesignIssue;
  blurred?: boolean;
  onSelect: (issue: DesignIssue) => void;
}

export function MistakeCard({ issue, blurred, onSelect }: MistakeCardProps) {
  if (blurred) {
    return (
      <Card className="relative overflow-hidden border-border/60 shadow-[0_1px_3px_rgba(12,34,43,0.07),0_4px_14px_rgba(12,34,43,0.05)]">
        <CardContent className="p-5">
          <div className="select-none blur-[4px] opacity-60">
            <div className="mb-3 flex items-center justify-between">
              <SeverityBadge severity={issue.severity} className="uppercase tracking-wide" />
              <span className="text-xs text-muted-foreground">{issue.category}</span>
            </div>
            <h3 className="mb-2 font-display text-base font-semibold text-foreground">
              {issue.title}
            </h3>
            <p className="line-clamp-3 text-sm text-muted-foreground">{issue.body}</p>
          </div>
          <div className="absolute inset-0 flex items-end justify-center bg-gradient-to-b from-transparent via-background/25 to-background/70 p-4 backdrop-blur-[1px]">
            <div className="rounded-lg border border-border/80 bg-background/90 px-3 py-2 text-center shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Unlock all issues</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className="group cursor-pointer border-border/50 transition-all hover:border-primary/30 hover:shadow-md"
      onClick={() => onSelect(issue)}
    >
      <CardContent className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <SeverityBadge severity={issue.severity} className="uppercase tracking-wide" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{issue.category}</span>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-[2px] border border-border/60 text-muted-foreground/60 transition-colors group-hover:border-brand-green/50 group-hover:text-brand-green">
              <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>
        <h3 className="mb-2 font-display text-base font-semibold text-foreground group-hover:text-primary">
          {issue.title}
        </h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {issue.body}
        </p>
      </CardContent>
    </Card>
  );
}
