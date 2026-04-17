import { cn } from "../../lib/utils";
import type { RiskLevel } from "../../types";

type BadgeVariant =
  | "default"
  | "primary"
  | "muted"
  | "success"
  | "warning"
  | "danger";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-muted text-foreground border-border",
  primary: "bg-primary/15 text-primary border-primary/30",
  muted: "bg-muted text-muted-foreground border-border",
  success: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  danger: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium border uppercase tracking-wider",
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

const riskVariantMap: Record<RiskLevel, BadgeVariant> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

interface RiskBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  risk: RiskLevel;
}

export function RiskBadge({ risk, className, ...props }: RiskBadgeProps) {
  return (
    <Badge variant={riskVariantMap[risk]} className={className} {...props}>
      {risk}
    </Badge>
  );
}
