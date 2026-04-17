import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "../lib/auth-storage";

let socketSingleton: Socket | null = null;

const resolveSocketUrl = () => {
  const fromEnv = import.meta.env.VITE_SOCKET_URL;
  if (fromEnv) return fromEnv;

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  return apiBase.replace(/\/api\/?$/, "");
};

export const getOrCreateSocket = () => {
  const token = getAccessToken();
  if (!token) return null;

  if (socketSingleton && socketSingleton.connected) {
    return socketSingleton;
  }

  socketSingleton = io(resolveSocketUrl(), {
    transports: ["websocket", "polling"],
    withCredentials: true,
    auth: { token },
  });

  return socketSingleton;
};

export const disconnectSocket = () => {
  if (!socketSingleton) return;
  socketSingleton.disconnect();
  socketSingleton = null;
};

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socket = useMemo(() => getOrCreateSocket(), []);

  useEffect(() => {
    if (!socket) return undefined;

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, [socket]);

  return { socket, connected };
}
