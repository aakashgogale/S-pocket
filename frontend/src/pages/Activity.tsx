import {
  Activity as ActivityIcon,
  DoorOpen,
  Eye,
  Key,
  Trash2,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Threats } from "../components/Threats";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/AppCard";
import { useMyActivityLogs } from "../hooks/use-backend";
import { useSocket } from "../hooks/use-socket";
import type { ActivityLog } from "../types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  return new Date(Number(ts / BigInt(1_000_000))).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type ActionMeta = {
  label: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
};

const ACTION_MAP: Record<string, ActionMeta> = {
  file_upload: {
    label: "File Upload",
    Icon: Upload,
    color: "",
    bg: "",
  },
  file_delete: {
    label: "File Delete",
    Icon: Trash2,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  login: {
    label: "Login",
    Icon: Key,
    color: "",
    bg: "",
  },
  logout: {
    label: "Logout",
    Icon: DoorOpen,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  file_access: {
    label: "File Access",
    Icon: Eye,
    color: "",
    bg: "",
  },
};

const ACTION_STYLES: Record<
  string,
  { color: React.CSSProperties; bg: React.CSSProperties }
> = {
  file_upload: {
    color: { color: "oklch(0.65 0.22 257)" },
    bg: { background: "oklch(0.65 0.22 257 / 0.12)" },
  },
  login: {
    color: { color: "oklch(0.7 0.17 162)" },
    bg: { background: "oklch(0.7 0.17 162 / 0.12)" },
  },
  logout: {
    color: {},
    bg: {},
  },
  file_access: {
    color: { color: "oklch(0.77 0.19 70)" },
    bg: { background: "oklch(0.77 0.19 70 / 0.12)" },
  },
};

function resolveAction(raw: string): ActionMeta {
  const key = raw.toLowerCase().replace(/\s+/g, "_");
  return (
    ACTION_MAP[key] ?? {
      label: raw,
      Icon: ActivityIcon,
      color: "text-muted-foreground",
      bg: "bg-muted",
    }
  );
}

// ─── Row ──────────────────────────────────────────────────────────────────────

function ActivityRow({
  log,
  index,
  isEven,
}: {
  log: ActivityLog;
  index: number;
  isEven: boolean;
}) {
  const meta = resolveAction(log.action);
  const key = log.action.toLowerCase().replace(/\s+/g, "_");
  const styles = ACTION_STYLES[key];
  const { Icon } = meta;

  return (
    <motion.div
      key={log.id}
      initial={{ opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.045, ease: "easeOut" }}
      className={[
        "grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[2.5rem_1fr_160px_140px] items-center gap-3 sm:gap-4",
        "px-4 py-3 rounded-lg border border-transparent",
        "transition-colors duration-150 hover:border-border hover:bg-card/60",
        isEven ? "bg-muted/20" : "bg-transparent",
      ].join(" ")}
      data-ocid={`activity.item.${index + 1}`}
    >
      {/* Icon badge */}
      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${!styles ? meta.bg : ""}`}
        style={styles?.bg}
      >
        <Icon
          size={15}
          className={!styles ? meta.color : ""}
          style={styles?.color}
        />
      </div>

      {/* Action + label */}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {meta.label}
        </p>
        <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
          {log.action}
        </p>
      </div>

      {/* IP — hidden on mobile */}
      <p
        className="hidden sm:block text-xs font-mono text-muted-foreground tabular-nums truncate"
        title={log.ipAddress}
      >
        {log.ipAddress || "—"}
      </p>

      {/* Timestamp */}
      <p className="text-xs font-mono text-muted-foreground tabular-nums text-right">
        {formatDate(log.timestamp)}
      </p>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <div className="space-y-2" data-ocid="activity.loading_state">
      {(["s1", "s2", "s3", "s4", "s5", "s6"] as const).map((id, i) => (
        <div
          key={id}
          className="h-[52px] rounded-lg bg-muted/40 animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

// ─── Table header ─────────────────────────────────────────────────────────────

function TableHeader() {
  return (
    <div className="grid grid-cols-[2.5rem_1fr_auto] sm:grid-cols-[2.5rem_1fr_160px_140px] gap-3 sm:gap-4 px-4 pb-2 border-b border-border mb-1">
      <div />
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
        Action
      </span>
      <span className="hidden sm:block text-xs font-mono text-muted-foreground uppercase tracking-widest">
        IP Address
      </span>
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest text-right">
        Timestamp
      </span>
    </div>
  );
}

// ─── Page content ─────────────────────────────────────────────────────────────

function ActivityContent() {
  const { data: logs = [], isLoading } = useMyActivityLogs();
  const { socket } = useSocket();
  const [liveLogs, setLiveLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    setLiveLogs(logs);
  }, [logs]);

  useEffect(() => {
    if (!socket) return undefined;

    const onActivity = (payload: any) => {
      const incoming: ActivityLog = {
        id: payload?.id || payload?._id || `${Date.now()}`,
        action: payload?.action || "activity",
        userId: { toString: () => String(payload?.user || payload?.userId || "") } as any,
        timestamp:
          BigInt(new Date(payload?.createdAt || Date.now()).getTime()) * BigInt(1_000_000),
        ipAddress: payload?.ipAddress || "N/A",
      };

      setLiveLogs((prev) => {
        if (prev.some((item) => item.id === incoming.id)) return prev;
        return [incoming, ...prev].slice(0, 300);
      });
    };

    socket.on("activity", onActivity);
    return () => {
      socket.off("activity", onActivity);
    };
  }, [socket]);

  // Sort most recent first
  const sorted = [...liveLogs].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <div data-ocid="activity.page">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <p className="text-xs font-mono text-primary uppercase tracking-widest mb-1">
          Audit Trail
        </p>
        <h1 className="text-2xl font-display font-bold text-foreground">
          Activity Log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          A tamper-proof record of every action performed on your account.
        </p>
      </motion.div>

      {/* Stats bar */}
      {!isLoading && sorted.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="flex flex-wrap gap-3 mb-6"
        >
          {Object.entries(ACTION_MAP).map(([mapKey, meta]) => {
            const count = sorted.filter((l) => {
              const k = l.action.toLowerCase().replace(/\s+/g, "_");
              return k === mapKey;
            }).length;
            if (count === 0) return null;
            const { Icon } = meta;
            const styles = ACTION_STYLES[mapKey];
            return (
              <div
                key={mapKey}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono ${!styles ? meta.bg : ""}`}
                style={styles?.bg}
              >
                <Icon
                  size={12}
                  className={!styles ? meta.color : ""}
                  style={styles?.color}
                />
                <span
                  className={!styles ? meta.color : ""}
                  style={styles?.color}
                >
                  {meta.label}
                </span>
                <span className="text-muted-foreground">×{count}</span>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <Card accent data-ocid="activity.list">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ActivityIcon size={16} className="text-primary" />
              All Events
              <span className="ml-1 text-muted-foreground text-sm font-normal">
                ({sorted.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <SkeletonRows />
            ) : sorted.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center py-16"
                data-ocid="activity.empty_state"
              >
                <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <ActivityIcon
                    size={24}
                    className="text-muted-foreground opacity-40"
                  />
                </div>
                <p className="text-foreground font-medium">No activity yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Events will appear here as you use the platform.
                </p>
              </motion.div>
            ) : (
              <div className="space-y-1">
                <TableHeader />
                {sorted.map((log, i) => (
                  <ActivityRow
                    key={log.id}
                    log={log}
                    index={i}
                    isEven={i % 2 === 0}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-6"
      >
        <Threats />
      </motion.div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function Activity() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <ActivityContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
