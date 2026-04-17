import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "../../lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

interface AlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  message: string;
  dismissible?: boolean;
  className?: string;
  "data-ocid"?: string;
}

const variantConfig: Record<
  AlertVariant,
  { icon: React.ReactNode; classes: string }
> = {
  info: {
    icon: <Info size={16} />,
    classes: "bg-primary/10 border-primary/30 text-primary",
  },
  success: {
    icon: <CheckCircle size={16} />,
    classes: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    classes: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  },
  error: {
    icon: <XCircle size={16} />,
    classes: "bg-red-500/10 border-red-500/30 text-red-400",
  },
};

export function AlertBanner({
  variant = "info",
  title,
  message,
  dismissible = false,
  className,
  "data-ocid": dataOcid,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const config = variantConfig[variant];

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "flex items-start gap-3 px-4 py-3 rounded border text-sm",
            config.classes,
            className,
          )}
          data-ocid={dataOcid}
          role="alert"
        >
          <span className="mt-0.5 shrink-0">{config.icon}</span>
          <div className="flex-1 min-w-0">
            {title && <p className="font-semibold mb-0.5">{title}</p>}
            <p className="leading-relaxed">{message}</p>
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={() => setDismissed(true)}
              data-ocid={`${dataOcid ?? "alert_banner"}.close_button`}
              className="shrink-0 opacity-60 hover:opacity-100 transition-smooth"
              aria-label="Dismiss alert"
            >
              <X size={14} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
