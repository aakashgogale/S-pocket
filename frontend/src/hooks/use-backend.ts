import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { ActivityLog } from "../types";
import { useAuth } from "./use-auth";

type ApiUser = {
  _id: string;
  id?: string;
  username: string;
  fullName?: string;
  email: string;
  role: "user" | "admin";
  createdAt?: string;
  profilePic?: string;
};

type ApiFile = {
  _id: string;
  id?: string;
  filename?: string;
  originalName: string;
  fileType?: string;
  mimeType?: string;
  size?: string;
  bytes?: number;
  createdAt: string;
  riskLevel?: string;
  user?: string | { _id?: string; id?: string };
  url?: string;
};

type ApiActivity = {
  _id: string;
  action: string;
  user?: string;
  ipAddress?: string;
  createdAt: string;
  status?: string;
  category?: string;
  riskLevel?: string;
  isThreat?: boolean;
  meta?: Record<string, unknown>;
};

type PrincipalLike = Principal & { toString: () => string };

const toPrincipalLike = (id: string): PrincipalLike =>
  ({ toString: () => id } as PrincipalLike);

const principalToId = (principal: Principal | string): string => {
  if (typeof principal === "string") return principal;
  return principal.toString();
};

const toNanoTs = (value: string | number | Date | undefined): bigint => {
  if (!value) return BigInt(Date.now()) * BigInt(1_000_000);
  const ms = new Date(value).getTime();
  return BigInt(ms) * BigInt(1_000_000);
};

const normalizeRisk = (risk: string | undefined): "low" | "medium" | "high" => {
  const safe = (risk || "low").toLowerCase();
  if (safe === "high" || safe === "critical") return "high";
  if (safe === "medium" || safe === "moderate") return "medium";
  return "low";
};

const parseSizeToBytes = (size?: string) => {
  if (!size) return BigInt(0);
  const [raw, unit] = size.split(" ");
  const value = Number(raw);
  if (!Number.isFinite(value)) return BigInt(0);
  if (unit?.toUpperCase() === "MB") return BigInt(Math.round(value * 1024 * 1024));
  if (unit?.toUpperCase() === "KB") return BigInt(Math.round(value * 1024));
  if (unit?.toUpperCase() === "B") return BigInt(Math.round(value));
  return BigInt(0);
};

const mapFileRecord = (file: ApiFile) => {
  const ownerId =
    typeof file.user === "string" ? file.user : file.user?._id || file.user?.id || "";
  return {
    id: file._id || file.id || "",
    owner: toPrincipalLike(ownerId),
    filename: file.filename || file.originalName,
    fileType: file.fileType || file.mimeType || "application/octet-stream",
    size: file.bytes ? BigInt(file.bytes) : parseSizeToBytes(file.size),
    uploadDate: toNanoTs(file.createdAt),
    riskLevel: normalizeRisk(file.riskLevel),
    url: file.url,
  };
};

const mapActivity = (activity: ApiActivity): ActivityLog => ({
  id: activity._id,
  action: activity.action,
  userId: toPrincipalLike(activity.user || ""),
  timestamp: toNanoTs(activity.createdAt),
  ipAddress: activity.ipAddress || "N/A",
  status:
    activity.status === "success" || activity.status === "fail" || activity.status === "threat"
      ? activity.status
      : undefined,
  category:
    activity.category === "Auth" || activity.category === "File" || activity.category === "System"
      ? activity.category
      : undefined,
  riskLevel:
    activity.riskLevel === "Low" ||
    activity.riskLevel === "Moderate" ||
    activity.riskLevel === "Critical"
      ? activity.riskLevel
      : undefined,
  isThreat: Boolean(activity.isThreat),
  meta: activity.meta || {},
});

export function useBackend() {
  return { actor: null, isLoading: false };
}

export function useCallerRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["callerRole", user?.id],
    queryFn: async () => (user?.role === "admin" ? "admin" : "user"),
    enabled: Boolean(user),
  });
}

export function useCallerProfile() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      const res = await api.get("/users/me");
      const user: ApiUser = res.data?.data;
      if (!user) return null;
      return {
        id: user._id || user.id || "",
        name: user.fullName || user.username,
        username: user.username,
        email: user.email,
        createdAt: toNanoTs(user.createdAt),
        role: user.role,
        profilePic: user.profilePic,
      };
    },
    enabled: isAuthenticated,
  });
}

export function useIsAdmin() {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => user?.role === "admin",
    enabled: isAuthenticated,
  });
}

export function useRegisterUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, email }: { name: string; email: string }) => {
      const username = name.toLowerCase().replace(/\s+/g, "_");
      const password = `Temp@${Date.now().toString().slice(-8)}`;
      return api.post("/auth/register", {
        username,
        fullName: name,
        email,
        password,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["callerProfile"] }),
  });
}

export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profile: {
      name?: string;
      username?: string;
      email?: string;
      location?: string;
      bio?: string;
      profilePic?: File | string | null;
    }) => {
      const formData = new FormData();
      if (profile.name) formData.append("fullName", profile.name);
      if (profile.username) formData.append("username", profile.username);
      if (profile.location) formData.append("location", profile.location);
      if (profile.bio) formData.append("bio", profile.bio);
      if (profile.profilePic instanceof File) {
        formData.append("profilePic", profile.profilePic);
      }
      const res = await api.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.data;
    },
    onSuccess: (updatedUser: ApiUser | undefined) => {
      if (!updatedUser) return;

      const id = updatedUser._id || updatedUser.id || "";

      queryClient.setQueryData(["auth", "me"], {
        id,
        _id: id,
        username: updatedUser.username,
        fullName: updatedUser.fullName || updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePic: updatedUser.profilePic,
        avatar: updatedUser.profilePic,
        location: (updatedUser as any).location,
        bio: (updatedUser as any).bio,
        createdAt: updatedUser.createdAt,
      });

      queryClient.setQueryData(["callerProfile"], {
        id,
        name: updatedUser.fullName || updatedUser.username,
        username: updatedUser.username,
        email: updatedUser.email,
        createdAt: toNanoTs(updatedUser.createdAt),
        role: updatedUser.role,
        profilePic: updatedUser.profilePic,
      });
    },
  });
}

export function useMyFiles() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["myFiles"],
    queryFn: async () => {
      const res = await api.get("/files");
      const files: ApiFile[] = res.data?.data || [];
      return files.map(mapFileRecord);
    },
    enabled: isAuthenticated,
  });
}

export function useAdminAllFiles() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["adminAllFiles"],
    queryFn: async () => {
      const res = await api.get("/admin/files");
      const files: ApiFile[] = res.data?.data || [];
      return files.map(mapFileRecord);
    },
    enabled: isAuthenticated,
  });
}

type UploadInput =
  | { file: File }
  | {
      filename: string;
      fileType: string;
      size: bigint;
      blob: { getBytes?: () => Promise<Uint8Array>; _blob?: Uint8Array };
    };

export function useUploadFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UploadInput) => {
      const formData = new FormData();

      if ("file" in input) {
        formData.append("file", input.file);
      } else {
        const raw = input.blob.getBytes
          ? await input.blob.getBytes()
          : input.blob._blob || new Uint8Array();
        const bytes = raw instanceof Uint8Array ? new Uint8Array(raw) : new Uint8Array();
        const blob = new Blob([bytes], { type: input.fileType || "application/octet-stream" });
        const file = new File([blob], input.filename, { type: input.fileType });
        formData.append("file", file);
      }

      const res = await api.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.file;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFiles"] });
      queryClient.invalidateQueries({ queryKey: ["adminAllFiles"] });
      queryClient.invalidateQueries({ queryKey: ["myActivityLogs"] });
      queryClient.invalidateQueries({ queryKey: ["myThreats"] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFiles"] });
      queryClient.invalidateQueries({ queryKey: ["adminAllFiles"] });
      queryClient.invalidateQueries({ queryKey: ["myActivityLogs"] });
    },
  });
}

export function useMyActivityLogs() {
  const { isAuthenticated } = useAuth();
  return useQuery<ActivityLog[]>({
    queryKey: ["myActivityLogs"],
    queryFn: async () => {
      const res = await api.get("/activities");
      const logs: ApiActivity[] = res.data?.data || [];
      return logs.map(mapActivity);
    },
    enabled: isAuthenticated,
  });
}

export function useAdminAllActivityLogs() {
  const { isAuthenticated } = useAuth();
  return useQuery<ActivityLog[]>({
    queryKey: ["adminAllActivityLogs"],
    queryFn: async () => {
      const res = await api.get("/admin/logs?limit=200&page=1");
      const logs: ApiActivity[] = res.data?.data || [];
      return logs.map(mapActivity);
    },
    enabled: isAuthenticated,
  });
}

export function useLogActivity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      action,
      ipAddress,
      status = "success",
      category = "System",
      riskLevel = "Low",
      isThreat = false,
      meta = {},
    }: {
      action: string;
      ipAddress: string;
      status?: "success" | "fail" | "threat";
      category?: "Auth" | "File" | "System";
      riskLevel?: "Low" | "Moderate" | "Critical";
      isThreat?: boolean;
      meta?: Record<string, unknown>;
    }) => {
      await api.post("/activities", {
        action,
        ipAddress,
        status,
        category,
        riskLevel,
        isThreat,
        meta,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myActivityLogs"] }),
  });
}

export function useAdminListUsers() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["adminListUsers"],
    queryFn: async () => {
      const res = await api.get("/admin/users");
      const users: ApiUser[] = res.data?.data || [];
      return users.map(
        (user): [PrincipalLike, { name: string; email: string; createdAt: bigint; role: "user" | "admin" }] => [
          toPrincipalLike(user._id || user.id || ""),
          {
            name: user.fullName || user.username || "",
            email: user.email || "",
            createdAt: toNanoTs(user.createdAt),
            role: user.role,
          },
        ]
      );
    },
    enabled: isAuthenticated,
  });
}

export function useAdminAssignRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: string }) => {
      const userId = principalToId(user);
      const normalizedRole = role === "admin" ? "admin" : "user";
      await api.patch(`/admin/users/${userId}/role`, { role: normalizedRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminListUsers"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useMyThreats() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["myThreats"],
    queryFn: async () => {
      const res = await api.get("/threats");
      return res.data?.data || [];
    },
    enabled: isAuthenticated,
  });
}
