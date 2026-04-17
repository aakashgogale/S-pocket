import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export type UserId = Principal;
export type Timestamp = bigint;
export interface ActivityLog {
    id: string;
    action: string;
    userId: UserId;
    timestamp: Timestamp;
    ipAddress: string;
}
export interface FileRecord {
    id: string;
    owner: UserId;
    blob: ExternalBlob;
    size: bigint;
    fileType: string;
    filename: string;
    uploadDate: Timestamp;
    riskLevel: RiskLevel;
}
export interface UserProfile {
    name: string;
    createdAt: Timestamp;
    email: string;
}
export enum RiskLevel {
    low = "low",
    high = "high",
    medium = "medium"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    adminAssignRole(user: Principal, role: UserRole): Promise<void>;
    adminGetAllActivityLogs(): Promise<Array<ActivityLog>>;
    adminListAllFiles(): Promise<Array<FileRecord>>;
    adminListUsers(): Promise<Array<[Principal, UserProfile]>>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteFile(id: string): Promise<void>;
    getAdminStats(): Promise<{
        totalFiles: bigint;
        threatLevel: string;
        highRiskFiles: bigint;
        recentAlerts: bigint;
        totalUsers: bigint;
    }>;
    getCallerRole(): Promise<UserRole>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getFile(id: string): Promise<FileRecord | null>;
    getMyActivityLogs(): Promise<Array<ActivityLog>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listMyFiles(): Promise<Array<FileRecord>>;
    logActivity(action: string, ipAddress: string): Promise<void>;
    registerUser(name: string, email: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    uploadFile(filename: string, size: bigint, fileType: string, blob: ExternalBlob): Promise<FileRecord>;
}
