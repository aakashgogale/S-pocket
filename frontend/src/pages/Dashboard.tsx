import { AlertTriangle, Clock, Files, Shield, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useMemo, useRef } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { AlertBanner } from "../components/ui/AlertBanner";
import { RiskBadge } from "../components/ui/AppBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/AppCard";
import {
  useCallerProfile,
  useMyActivityLogs,
  useMyFiles,
} from "../hooks/use-backend";
import type { RiskLevel } from "../types";

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  return new Date(Number(ts / BigInt(1_000_000))).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function computeRiskScore(files: Array<{ riskLevel: RiskLevel }>): {
  score: number;
  label: "LOW" | "MEDIUM" | "HIGH";
} {
  if (files.length === 0) return { score: 0, label: "LOW" };
  const weights: Record<RiskLevel, number> = { low: 0, medium: 50, high: 100 };
  const avg =
    files.reduce((sum, f) => sum + weights[f.riskLevel], 0) / files.length;
  const score = Math.round(avg);
  const label = score < 30 ? "LOW" : score < 65 ? "MEDIUM" : "HIGH";
  return { score, label };
}

// ── Risk Score Widget ───────────────────────────────────────────────────────

interface RiskScoreWidgetProps {
  score: number;
  label: "LOW" | "MEDIUM" | "HIGH";
  loading: boolean;
}

const riskColors: Record<
  "LOW" | "MEDIUM" | "HIGH",
  {
    ring: string;
    textStyle: React.CSSProperties;
    bgStyle: React.CSSProperties;
    textClass: string;
    bgClass: string;
  }
> = {
  LOW: {
    ring: "oklch(0.65 0.22 257)",
    textStyle: {},
    bgStyle: {},
    textClass: "text-primary",
    bgClass: "bg-primary/10",
  },
  MEDIUM: {
    ring: "oklch(0.77 0.19 70)",
    textStyle: { color: "oklch(0.77 0.19 70)" },
    bgStyle: { background: "oklch(0.77 0.19 70 / 0.1)" },
    textClass: "",
    bgClass: "",
  },
  HIGH: {
    ring: "oklch(0.6 0.25 25)",
    textStyle: { color: "oklch(0.6 0.25 25)" },
    bgStyle: { background: "oklch(0.6 0.25 25 / 0.1)" },
    textClass: "",
    bgClass: "",
  },
};

function RiskScoreWidget({ score, label, loading }: RiskScoreWidgetProps) {
  const colors = riskColors[label];
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (score / 100) * circumference;

  return (
    <Card data-ocid="dashboard.risk_score.card" className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Risk Score</CardTitle>
          <div
            className={`w-8 h-8 rounded ${colors.bgClass} flex items-center justify-center`}
            style={colors.bgStyle}
          >
            <Shield
              size={15}
              className={colors.textClass}
              style={colors.textStyle}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div
            className="flex items-center justify-center py-8"
            data-ocid="dashboard.risk_score.loading_state"
          >
            <div className="w-24 h-24 rounded-full bg-muted/50 animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            {/* Circular gauge */}
            <div className="relative w-28 h-28">
              <svg
                className="w-28 h-28 -rotate-90"
                viewBox="0 0 100 100"
                aria-hidden="true"
              >
                {/* Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="oklch(var(--border))"
                  strokeWidth="8"
                />
                {/* Progress */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={colors.ring}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
                />
              </svg>
              {/* Score number */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-2xl font-display font-bold tabular-nums ${colors.textClass}`}
                  style={colors.textStyle}
                >
                  {score}
                </span>
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                  /100
                </span>
              </div>
            </div>

            {/* Risk label badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded border text-xs font-mono font-semibold uppercase tracking-widest ${colors.bgClass} ${colors.textClass} border-current/20`}
              style={{ ...colors.bgStyle, ...colors.textStyle }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: colors.ring }}
              />
              {label} RISK
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Computed from your file risk distribution
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Recent Files Widget ─────────────────────────────────────────────────────

interface RecentFile {
  id: string;
  filename: string;
  uploadDate: bigint;
  riskLevel: RiskLevel;
}

function RecentFilesWidget({
  files,
  loading,
}: {
  files: RecentFile[];
  loading: boolean;
}) {
  return (
    <Card accent data-ocid="dashboard.recent_files.card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Recent Files</CardTitle>
          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
            <Files size={15} className="text-primary" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3" data-ocid="dashboard.files.loading_state">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div
            className="text-center py-8 text-muted-foreground text-sm"
            data-ocid="dashboard.files.empty_state"
          >
            <Files size={28} className="mx-auto mb-2 opacity-30" />
            <p>No files uploaded yet.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {files.map((file, i) => (
              <div
                key={file.id}
                className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                data-ocid={`dashboard.files.item.${i + 1}`}
              >
                <div className="w-7 h-7 rounded bg-muted/50 flex items-center justify-center shrink-0">
                  <Files size={13} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate font-medium leading-tight">
                    {file.filename}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {formatDate(file.uploadDate)}
                  </p>
                </div>
                <RiskBadge risk={file.riskLevel} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Last Login Widget ───────────────────────────────────────────────────────

function LastLoginWidget({ loginTime }: { loginTime: Date }) {
  const formatted = loginTime.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const elapsed = Math.floor((Date.now() - loginTime.getTime()) / 1000);
  const elapsedStr =
    elapsed < 60
      ? `${elapsed}s ago`
      : elapsed < 3600
        ? `${Math.floor(elapsed / 60)}m ago`
        : `${Math.floor(elapsed / 3600)}h ago`;

  return (
    <Card data-ocid="dashboard.last_login.card" className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Last Login</CardTitle>
          <div
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ background: "oklch(0.72 0.19 162 / 0.1)" }}
          >
            <Clock size={15} style={{ color: "oklch(0.72 0.19 162)" }} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 py-2">
          {/* Session active indicator */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: "oklch(0.72 0.19 162)" }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ background: "oklch(0.72 0.19 162)" }}
              />
            </span>
            <span
              className="text-xs font-mono uppercase tracking-widest"
              style={{ color: "oklch(0.72 0.19 162)" }}
            >
              Session Active
            </span>
          </div>

          {/* Timestamp */}
          <div className="bg-muted/50 rounded p-3 border border-border">
            <p className="text-sm font-mono text-foreground leading-relaxed">
              {formatted}
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span>This session</span>
            <span className="text-foreground">{elapsedStr}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Alerts Widget ───────────────────────────────────────────────────────────

function AlertsWidget({
  highRiskCount,
  totalFiles,
  loading,
}: {
  highRiskCount: number;
  totalFiles: number;
  loading: boolean;
}) {
  const alertLevel =
    highRiskCount === 0 ? "clear" : highRiskCount < 3 ? "warning" : "critical";

  const alertConfig = {
    clear: {
      icon: <ShieldCheck size={15} style={{ color: "oklch(0.72 0.19 162)" }} />,
      bgStyle: { background: "oklch(0.72 0.19 162 / 0.1)" },
      colorStyle: { color: "oklch(0.72 0.19 162)" },
      label: "All Clear",
      desc: "No active security alerts.",
    },
    warning: {
      icon: (
        <AlertTriangle size={15} style={{ color: "oklch(0.77 0.19 70)" }} />
      ),
      bgStyle: { background: "oklch(0.77 0.19 70 / 0.1)" },
      colorStyle: { color: "oklch(0.77 0.19 70)" },
      label: "Warning",
      desc: `${highRiskCount} high-risk file${highRiskCount > 1 ? "s" : ""} detected.`,
    },
    critical: {
      icon: <AlertTriangle size={15} style={{ color: "oklch(0.6 0.25 25)" }} />,
      bgStyle: { background: "oklch(0.6 0.25 25 / 0.1)" },
      colorStyle: { color: "oklch(0.6 0.25 25)" },
      label: "Critical",
      desc: `${highRiskCount} high-risk files require immediate attention.`,
    },
  };

  const cfg = alertConfig[alertLevel];

  return (
    <Card data-ocid="dashboard.alerts.card" className="flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Alerts</CardTitle>
          <div
            className="w-8 h-8 rounded flex items-center justify-center"
            style={cfg.bgStyle}
          >
            {cfg.icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3" data-ocid="dashboard.alerts.loading_state">
            <div className="h-12 rounded bg-muted/50 animate-pulse" />
            <div className="h-8 rounded bg-muted/50 animate-pulse" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 py-1">
            {/* Count badge */}
            <div className="flex items-end gap-3">
              <span
                className="text-4xl font-display font-bold tabular-nums"
                style={cfg.colorStyle}
              >
                {highRiskCount}
              </span>
              <div className="pb-1.5">
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                  Active Alerts
                </p>
                <p
                  className="text-xs font-semibold font-mono"
                  style={cfg.colorStyle}
                >
                  {cfg.label}
                </p>
              </div>
            </div>

            {/* Status message */}
            <div
              className="flex items-start gap-2 px-3 py-2 rounded border text-xs border-current/10"
              style={{ ...cfg.bgStyle, ...cfg.colorStyle }}
            >
              <span className="mt-0.5 shrink-0">{cfg.icon}</span>
              <span>{cfg.desc}</span>
            </div>

            {/* Stat row */}
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono border-t border-border pt-3">
              <span>Total files scanned</span>
              <span className="text-foreground font-semibold">
                {totalFiles}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Dashboard Content ───────────────────────────────────────────────────────

function DashboardContent() {
  const { data: profile } = useCallerProfile();
  const { data: files = [], isLoading: filesLoading } = useMyFiles();
  const { data: logs = [], isLoading: logsLoading } = useMyActivityLogs();

  const loginTimeRef = useRef(new Date());
  const loginTime = loginTimeRef.current;

  const typedFiles = files as Array<{
    id: string;
    filename: string;
    uploadDate: bigint;
    riskLevel: RiskLevel;
  }>;

  const highRiskCount = useMemo(
    () => typedFiles.filter((f) => f.riskLevel === "high").length,
    [typedFiles],
  );

  const { score: riskScore, label: riskLabel } = useMemo(
    () => computeRiskScore(typedFiles),
    [typedFiles],
  );

  const recentFiles = useMemo(() => typedFiles.slice(0, 5), [typedFiles]);

  const recentActivity = useMemo(() => logs.slice(0, 5), [logs]);

  const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: i * 0.1, ease: "easeOut" as const },
    }),
  };

  return (
    <div data-ocid="dashboard.page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="mb-7"
      >
        <p className="text-xs font-mono text-primary uppercase tracking-widest mb-1">
          Overview
        </p>
        <h1 className="text-2xl font-display font-bold text-foreground">
          {profile?.name ? `Welcome back, ${profile.name}` : "Welcome"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's what's happening in your secure vault.
        </p>
      </motion.div>

      {/* Threat Alert Banner */}
      {highRiskCount > 0 && !filesLoading && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-6"
        >
          <AlertBanner
            variant="warning"
            title="High-Risk Files Detected"
            message={`${highRiskCount} file${highRiskCount > 1 ? "s" : ""} flagged as high-risk in your vault. Review immediately.`}
            dismissible
            data-ocid="dashboard.threat_alert"
          />
        </motion.div>
      )}

      {/* 4-Widget Grid — staggered card fade-in */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <RiskScoreWidget
            score={riskScore}
            label={riskLabel}
            loading={filesLoading}
          />
        </motion.div>

        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <AlertsWidget
            highRiskCount={highRiskCount}
            totalFiles={typedFiles.length}
            loading={filesLoading}
          />
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <LastLoginWidget loginTime={loginTime} />
        </motion.div>

        {/* Summary stat card */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card
            data-ocid="dashboard.activity_summary.card"
            className="flex flex-col"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Activity</CardTitle>
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <Clock size={15} className="text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div
                  className="space-y-3"
                  data-ocid="dashboard.activity_summary.loading_state"
                >
                  <div className="h-10 rounded bg-muted/50 animate-pulse" />
                  <div className="h-6 rounded bg-muted/50 animate-pulse" />
                </div>
              ) : (
                <div className="flex flex-col gap-4 py-1">
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-display font-bold tabular-nums text-primary">
                      {logs.length}
                    </span>
                    <div className="pb-1.5">
                      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                        Events
                      </p>
                      <p className="text-xs font-semibold font-mono text-primary">
                        Logged
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-mono border-t border-border pt-3">
                    <span>Files total</span>
                    <span className="text-foreground font-semibold">
                      {filesLoading ? "—" : typedFiles.length}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Lower row — Recent Files + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <RecentFilesWidget files={recentFiles} loading={filesLoading} />
        </motion.div>

        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card data-ocid="dashboard.recent_activity.card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activity</CardTitle>
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                  <Clock size={15} className="text-primary" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div
                  className="space-y-3"
                  data-ocid="dashboard.activity.loading_state"
                >
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-10 rounded bg-muted/50 animate-pulse"
                    />
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground text-sm"
                  data-ocid="dashboard.activity.empty_state"
                >
                  <Clock size={28} className="mx-auto mb-2 opacity-30" />
                  <p>No activity recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentActivity.map((log, i) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 py-2.5 border-b border-border last:border-0"
                      data-ocid={`dashboard.activity.item.${i + 1}`}
                    >
                      <div className="w-7 h-7 rounded bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={12} className="text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-tight">
                          {log.action}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {log.ipAddress}
                        </p>
                      </div>
                      <p className="text-[11px] text-muted-foreground font-mono shrink-0 ml-1 mt-0.5">
                        {formatDate(log.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// ── Page export ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DashboardContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
