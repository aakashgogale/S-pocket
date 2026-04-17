import type { Principal } from "@icp-sdk/core/principal";
import {
  Activity,
  AlertTriangle,
  FileText,
  Files,
  Globe,
  ShieldAlert,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { UserRole } from "../backend";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { RiskBadge } from "../components/ui/AppBadge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/AppCard";
import { StatCard } from "../components/ui/StatCard";
import {
  useAdminAllActivityLogs,
  useAdminAllFiles,
  useAdminAssignRole,
  useAdminListUsers,
} from "../hooks/use-backend";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(ts: bigint): string {
  return new Date(Number(ts / BigInt(1_000_000))).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDatetime(ts: bigint): string {
  return new Date(Number(ts / BigInt(1_000_000))).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: bigint): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function truncatePrincipal(p: Principal): string {
  const s = p.toString();
  if (s.length <= 14) return s;
  return `${s.slice(0, 7)}…${s.slice(-5)}`;
}

function getThreatLevel(highRiskCount: number): {
  label: string;
  colorStyle: React.CSSProperties;
  bgStyle: React.CSSProperties;
  borderStyle: React.CSSProperties;
} {
  if (highRiskCount === 0)
    return {
      label: "LOW",
      colorStyle: { color: "oklch(0.72 0.19 162)" },
      bgStyle: { background: "oklch(0.72 0.19 162 / 0.1)" },
      borderStyle: { borderColor: "oklch(0.72 0.19 162 / 0.3)" },
    };
  if (highRiskCount < 3)
    return {
      label: "MEDIUM",
      colorStyle: { color: "oklch(0.77 0.19 70)" },
      bgStyle: { background: "oklch(0.77 0.19 70 / 0.1)" },
      borderStyle: { borderColor: "oklch(0.77 0.19 70 / 0.3)" },
    };
  if (highRiskCount < 8)
    return {
      label: "HIGH",
      colorStyle: { color: "oklch(0.7 0.22 40)" },
      bgStyle: { background: "oklch(0.7 0.22 40 / 0.1)" },
      borderStyle: { borderColor: "oklch(0.7 0.22 40 / 0.3)" },
    };
  return {
    label: "CRITICAL",
    colorStyle: { color: "oklch(0.6 0.25 25)" },
    bgStyle: { background: "oklch(0.6 0.25 25 / 0.1)" },
    borderStyle: { borderColor: "oklch(0.6 0.25 25 / 0.3)" },
  };
}

// ─── Skeleton Row ────────────────────────────────────────────────────────────

function SkeletonRows({ cols, rows = 4 }: { cols: number; rows?: number }) {
  return (
    <div className="space-y-px" data-ocid="admin.loading_state">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          key={i}
          className="flex gap-4 px-4 py-3"
        >
          {Array.from({ length: cols }).map((__, j) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
              key={j}
              className="h-5 rounded bg-muted/50 animate-pulse flex-1"
              style={{ animationDelay: `${i * 80}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  count,
}: {
  icon: React.ReactNode;
  title: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="accent-line">
        <h2 className="text-base font-display font-semibold text-foreground leading-none">
          {title}
          {count !== undefined && (
            <span className="ml-2 text-xs font-mono text-muted-foreground">
              ({count})
            </span>
          )}
        </h2>
      </div>
    </div>
  );
}

// ─── Table Shell ─────────────────────────────────────────────────────────────

function TableHeader({ columns }: { columns: string[] }) {
  return (
    <div
      className="grid gap-4 px-4 py-2 border-b border-border bg-muted/20"
      style={{
        gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
      }}
    >
      {columns.map((col) => (
        <span
          key={col}
          className="text-[10px] font-mono font-medium text-muted-foreground uppercase tracking-widest"
        >
          {col}
        </span>
      ))}
    </div>
  );
}

// ─── Users Table ─────────────────────────────────────────────────────────────

function UsersTable() {
  const { data: users = [], isLoading } = useAdminListUsers();
  const assignRole = useAdminAssignRole();
  const [assigningUser, setAssigningUser] = useState<string | null>(null);

  const handleAssignRole = async (principal: Principal, role: UserRole) => {
    const key = principal.toString();
    setAssigningUser(key);
    try {
      await assignRole.mutateAsync({ user: principal, role });
    } finally {
      setAssigningUser(null);
    }
  };

  return (
    <Card data-ocid="admin.users.table">
      <CardHeader>
        <SectionHeader
          icon={<Users size={16} />}
          title="All Users"
          count={isLoading ? undefined : users.length}
        />
      </CardHeader>
      <CardContent className="p-0">
        <TableHeader
          columns={["Principal", "Name", "Email", "Role", "Joined"]}
        />
        {isLoading ? (
          <SkeletonRows cols={5} />
        ) : users.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground text-sm"
            data-ocid="admin.users.empty_state"
          >
            No users registered yet.
          </div>
        ) : (
          <div>
            {users.map(([principal, profile], i) => {
              const key = principal.toString();
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: i * 0.04 }}
                  className="grid gap-4 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-fast items-center"
                  style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
                  data-ocid={`admin.users.item.${i + 1}`}
                >
                  <span
                    className="text-xs font-mono text-muted-foreground truncate"
                    title={key}
                  >
                    {truncatePrincipal(principal)}
                  </span>
                  <span className="text-sm text-foreground font-medium truncate">
                    {profile.name || "—"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {profile.email || "—"}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      onChange={(e) =>
                        handleAssignRole(principal, e.target.value as UserRole)
                      }
                      disabled={assigningUser === key}
                      defaultValue=""
                      data-ocid={`admin.users.role_select.${i + 1}`}
                      className="text-xs font-mono bg-background border border-input text-foreground rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary transition-fast disabled:opacity-50 w-full"
                    >
                      <option value="" disabled>
                        Role…
                      </option>
                      <option value={UserRole.user}>user</option>
                      <option value={UserRole.admin}>admin</option>
                      <option value={UserRole.guest}>guest</option>
                    </select>
                    {assigningUser === key && (
                      <div className="w-3.5 h-3.5 border border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                    )}
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {profile.createdAt ? formatDate(profile.createdAt) : "—"}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Files Table ─────────────────────────────────────────────────────────────

function FilesTable() {
  const { data: files = [], isLoading } = useAdminAllFiles();

  return (
    <Card data-ocid="admin.files.table">
      <CardHeader>
        <SectionHeader
          icon={<Files size={16} />}
          title="All Files"
          count={isLoading ? undefined : files.length}
        />
      </CardHeader>
      <CardContent className="p-0">
        <TableHeader
          columns={["Filename", "Owner", "Type", "Size", "Uploaded", "Risk"]}
        />
        {isLoading ? (
          <SkeletonRows cols={6} />
        ) : files.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground text-sm"
            data-ocid="admin.files.empty_state"
          >
            No files uploaded yet.
          </div>
        ) : (
          <div>
            {files.map((file, i) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="grid gap-4 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-fast items-center"
                style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}
                data-ocid={`admin.files.item.${i + 1}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText
                    size={13}
                    className="text-muted-foreground shrink-0"
                  />
                  <span className="text-sm text-foreground truncate">
                    {file.filename}
                  </span>
                </div>
                <span
                  className="text-xs font-mono text-muted-foreground truncate"
                  title={file.owner.toString()}
                >
                  {truncatePrincipal(file.owner)}
                </span>
                <span className="text-xs font-mono text-muted-foreground uppercase truncate">
                  {file.fileType}
                </span>
                <span className="text-xs font-mono text-muted-foreground tabular-nums">
                  {formatBytes(file.size)}
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  {formatDate(file.uploadDate)}
                </span>
                <RiskBadge risk={file.riskLevel} />
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Activity Table ───────────────────────────────────────────────────────────

function ActivityTable() {
  const { data: logs = [], isLoading } = useAdminAllActivityLogs();

  return (
    <Card data-ocid="admin.activity.table">
      <CardHeader>
        <SectionHeader
          icon={<Activity size={16} />}
          title="Platform Activity"
          count={isLoading ? undefined : logs.length}
        />
      </CardHeader>
      <CardContent className="p-0">
        <TableHeader columns={["Action", "User", "IP Address", "Timestamp"]} />
        {isLoading ? (
          <SkeletonRows cols={4} />
        ) : logs.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground text-sm"
            data-ocid="admin.activity.empty_state"
          >
            No activity recorded yet.
          </div>
        ) : (
          <div>
            {logs.map((log, i) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                className="grid gap-4 px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-fast items-center"
                style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
                data-ocid={`admin.activity.item.${i + 1}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-sm text-foreground truncate">
                    {log.action}
                  </span>
                </div>
                <span
                  className="text-xs font-mono text-muted-foreground truncate"
                  title={log.userId.toString()}
                >
                  {truncatePrincipal(log.userId)}
                </span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <Globe size={12} className="text-muted-foreground shrink-0" />
                  <span className="text-xs font-mono text-muted-foreground truncate">
                    {log.ipAddress || "—"}
                  </span>
                </div>
                <span className="text-xs font-mono text-muted-foreground tabular-nums">
                  {formatDatetime(log.timestamp)}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      delay: i * 0.08,
      ease: [0.4, 0, 0.2, 1] as const,
    },
  }),
};

function AdminContent() {
  const { data: users = [], isLoading: usersLoading } = useAdminListUsers();
  const { data: files = [], isLoading: filesLoading } = useAdminAllFiles();
  const { data: logs = [], isLoading: logsLoading } = useAdminAllActivityLogs();

  const highRiskCount = files.filter((f) => f.riskLevel === "high").length;
  const highRiskUsers = new Set(
    files.filter((f) => f.riskLevel === "high").map((f) => f.owner.toString()),
  ).size;
  const totalAlerts = logs.filter(
    (l) =>
      l.action.toLowerCase().includes("alert") ||
      l.action.toLowerCase().includes("threat") ||
      l.action.toLowerCase().includes("fail"),
  ).length;
  const threat = getThreatLevel(highRiskCount);

  const isAnyLoading = usersLoading || filesLoading || logsLoading;

  return (
    <div data-ocid="admin.page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={14} className="text-primary" />
          <p className="text-xs font-mono text-primary uppercase tracking-widest">
            Admin · Security
          </p>
        </div>
        <h1 className="text-3xl font-display font-bold text-gradient-cyan mb-1">
          Security Command Center
        </h1>
        <p className="text-muted-foreground text-sm">
          Full administrative oversight — users, files, and platform activity.
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          {
            label: "Total Users",
            value: usersLoading ? "—" : users.length,
            icon: <Users size={16} />,
            accent: true,
            ocid: "admin.total_users.card",
          },
          {
            label: "Total Alerts",
            value: isAnyLoading ? "—" : totalAlerts,
            icon: <AlertTriangle size={16} />,
            ocid: "admin.total_alerts.card",
          },
          {
            label: "High Risk Users",
            value: filesLoading ? "—" : highRiskUsers,
            icon: <ShieldAlert size={16} />,
            ocid: "admin.high_risk_users.card",
          },
          null, // threat level handled separately
        ].map((card, i) =>
          card ? (
            <motion.div
              key={card.ocid}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <StatCard
                label={card.label}
                value={card.value}
                icon={card.icon}
                accent={card.accent}
                data-ocid={card.ocid}
              />
            </motion.div>
          ) : (
            <motion.div
              key="threat"
              custom={3}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
            >
              <div
                className="bg-card border rounded p-5 transition-smooth shadow-card"
                style={{ ...threat.bgStyle, ...threat.borderStyle }}
                data-ocid="admin.threat_level.card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                      Threat Level
                    </span>
                    <span
                      className="text-2xl font-display font-bold tabular-nums"
                      style={threat.colorStyle}
                    >
                      {filesLoading ? "—" : threat.label}
                    </span>
                  </div>
                  <div
                    className="w-9 h-9 rounded flex items-center justify-center"
                    style={threat.bgStyle}
                  >
                    <ShieldAlert size={16} style={threat.colorStyle} />
                  </div>
                </div>
              </div>
            </motion.div>
          ),
        )}
      </div>

      {/* Data Sections */}
      <div className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <UsersTable />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <FilesTable />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          <ActivityTable />
        </motion.div>
      </div>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function Admin() {
  return (
    <ProtectedRoute adminOnly>
      <DashboardLayout>
        <AdminContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
