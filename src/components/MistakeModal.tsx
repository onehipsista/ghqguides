import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SeverityBadge } from "@/components/SeverityBadge";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import type { DesignIssue } from "@/types/design-issue";
import { guideAccessPriceLabel } from "@/lib/app-config";

interface MistakeModalProps {
  issue: DesignIssue | null;
  open: boolean;
  onClose: () => void;
  hasAccess?: boolean;
  onUpgrade?: () => void;
  isUpgrading?: boolean;
}

export function MistakeModal({
  issue,
  open,
  onClose,
  hasAccess = false,
  onUpgrade,
  isUpgrading = false,
}: MistakeModalProps) {
  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-3">
            <SeverityBadge severity={issue.severity} />
            <span className="text-xs text-muted-foreground">{issue.category}</span>
          </div>
          <DialogTitle className="font-display text-xl">{issue.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h4 className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-brand-green">
              Issue
            </h4>
            <p className="text-sm leading-relaxed text-foreground">{issue.body}</p>
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-1.5 text-sm font-semibold uppercase tracking-wide text-brand-green">
              How to Fix
            </h4>
            {hasAccess ? (
              <p className="text-sm leading-relaxed text-foreground">{issue.how_to_fix}</p>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-4">
                <p className="select-none text-sm leading-relaxed text-foreground opacity-70 blur-[4px]">
                  {issue.how_to_fix}
                </p>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-b from-background/30 via-background/80 to-background px-4 text-center backdrop-blur-sm">
                  <Lock className="h-5 w-5 text-brand-green" />
                  <p className="text-sm font-medium text-foreground">
                    Unlock all "How to Fix" solutions
                  </p>
                  <Button size="sm" className="mt-1 w-full max-w-xs" onClick={onUpgrade} disabled={isUpgrading}>
                    Get Access — {guideAccessPriceLabel}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
