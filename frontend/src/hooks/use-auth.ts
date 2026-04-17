import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { api } from "../lib/api";
import {
  authEvents,
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from "../lib/auth-storage";
import { disconnectSocket } from "./use-socket";

export type AuthStatus =
  | "idle"
  | "logging-in"
  | "logged-in"
  | "logged-out"
  | "error";

export interface AuthUser {
  id: string;
  _id?: string;
  username: string;
  fullName?: string;
  email: string;
  role: "user" | "admin";
  profilePic?: string;
  avatar?: string;
  location?: string;
  bio?: string;
  createdAt?: string;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface GoogleLoginPayload {
  idToken: string;
}

interface RegisterPayload {
  username: string;
  fullName?: string;
  email: string;
  password: string;
}

const AUTH_ME_QUERY_KEY = ["auth", "me"];

const normalizeUser = (user: Partial<AuthUser> | undefined | null): AuthUser | null => {
  const normalizedId = user?.id || user?._id;
  if (!user || !normalizedId || !user.email || !user.username || !user.role) {
    return null;
  }
  return {
    id: normalizedId,
    _id: user._id || normalizedId,
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    profilePic: user.profilePic,
    avatar: user.avatar,
    location: user.location,
    bio: user.bio,
    createdAt: user.createdAt,
  };
};

export function useAuth() {
  const queryClient = useQueryClient();
  const token = getAccessToken();

  const meQuery = useQuery({
    queryKey: AUTH_ME_QUERY_KEY,
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return normalizeUser(res.data?.data);
    },
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  });

  useEffect(() => {
    const onUnauthorized = () => {
      clearAccessToken();
      disconnectSocket();
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
    };
    authEvents.addEventListener("unauthorized", onUnauthorized);
    return () => authEvents.removeEventListener("unauthorized", onUnauthorized);
  }, [queryClient]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: LoginPayload) => {
      const res = await api.post("/auth/login", { email, password });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.token) setAccessToken(data.token);
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, normalizeUser(data?.user));
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ username, fullName, email, password }: RegisterPayload) => {
      const res = await api.post("/auth/signup", {
        username,
        fullName,
        email,
        password,
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.token) setAccessToken(data.token);
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, normalizeUser(data?.user));
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: async ({ idToken }: GoogleLoginPayload) => {
      const res = await api.post("/auth/google", { idToken });
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.token) setAccessToken(data.token);
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, normalizeUser(data?.user));
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => {
      clearAccessToken();
      disconnectSocket();
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
      queryClient.removeQueries({ queryKey: ["myFiles"] });
      queryClient.removeQueries({ queryKey: ["myActivityLogs"] });
      queryClient.removeQueries({ queryKey: ["myThreats"] });
    },
  });

  const user = normalizeUser(meQuery.data) || null;
  const isAuthenticated = Boolean(user && getAccessToken());
  const isBootstrapping = Boolean(token) && meQuery.isLoading;

  const loginStatus: AuthStatus = useMemo(() => {
    if (isBootstrapping) return "idle";
    if (
      loginMutation.isPending ||
      googleLoginMutation.isPending ||
      registerMutation.isPending ||
      logoutMutation.isPending
    ) {
      return "logging-in";
    }
    if (isAuthenticated) return "logged-in";
    if (loginMutation.isError || googleLoginMutation.isError || registerMutation.isError) return "error";
    return "logged-out";
  }, [
    isAuthenticated,
    isBootstrapping,
    loginMutation.isPending,
    googleLoginMutation.isPending,
    registerMutation.isPending,
    logoutMutation.isPending,
    loginMutation.isError,
    googleLoginMutation.isError,
    registerMutation.isError,
  ]);

  const handleLogin = useCallback(
    async ({ email, password }: LoginPayload) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation]
  );

  const handleRegister = useCallback(
    async ({ username, fullName, email, password }: RegisterPayload) => {
      await registerMutation.mutateAsync({ username, fullName, email, password });
    },
    [registerMutation]
  );

  const handleGoogleLogin = useCallback(
    async ({ idToken }: GoogleLoginPayload) => {
      await googleLoginMutation.mutateAsync({ idToken });
    },
    [googleLoginMutation]
  );

  const handleLogout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const setSessionUser = useCallback(
    (nextUser: Partial<AuthUser> | null) => {
      const normalized = normalizeUser(nextUser);
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, normalized);
    },
    [queryClient]
  );

  return {
    isAuthenticated,
    loginStatus,
    identity: user,
    user,
    loginError: loginMutation.error,
    googleLoginError: googleLoginMutation.error,
    registerError: registerMutation.error,
    login: handleLogin,
    loginWithGoogle: handleGoogleLogin,
    register: handleRegister,
    logout: handleLogout,
    setSessionUser,
    refreshSession: () => queryClient.invalidateQueries({ queryKey: AUTH_ME_QUERY_KEY }),
  };
}
