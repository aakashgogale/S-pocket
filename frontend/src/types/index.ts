import type { Principal } from "@icp-sdk/core/principal";

export type RiskLevel = "low" | "medium" | "high";
export type UserRole = "user" | "admin" | "guest";

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  username?: string;
  createdAt: bigint;
  role?: UserRole;
  profilePic?: string;
}

export interface FileRecord {
  id: string;
  owner: Principal;
  size: bigint;
  fileType: string;
  filename: string;
  uploadDate: bigint;
  riskLevel: RiskLevel;
  url?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  userId: Principal;
  timestamp: bigint;
  ipAddress: string;
  status?: "success" | "fail" | "threat";
  category?: "Auth" | "File" | "System";
  riskLevel?: "Low" | "Moderate" | "Critical";
  isThreat?: boolean;
  meta?: Record<string, unknown>;
}

export interface AdminStats {
  totalUsers: bigint;
  totalFiles: bigint;
  highRiskFiles: bigint;
  recentAlerts: bigint;
  threatLevel: string;
}

export interface UserListEntry {
  principal: Principal;
  profile: UserProfile;
}

export type NavItem = {
  label: string;
  path: string;
  icon: string;
  adminOnly?: boolean;
};
