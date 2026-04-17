import { motion } from "motion/react";
import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: string; up?: boolean };
  accent?: boolean;
  className?: string;
  "data-ocid"?: string;
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  accent = false,
  className,
  "data-ocid": dataOcid,
}: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "bg-card border border-border rounded p-5 transition-smooth",
        accent && "border-l-2 border-l-primary pl-[18px]",
        className,
      )}
      data-ocid={dataOcid}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            {label}
          </span>
          <span className="text-2xl font-display font-bold text-foreground tabular-nums">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend.up ? "text-emerald-400" : "text-red-400",
              )}
            >
              {trend.up ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>
        {icon && (
          <div className="w-9 h-9 rounded bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}
