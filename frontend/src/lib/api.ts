import axios from "axios";
import { authEvents, clearAccessToken, getAccessToken } from "./auth-storage";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      clearAccessToken();
      authEvents.dispatchEvent(new CustomEvent("unauthorized"));
    }
    if (status >= 500) {
      authEvents.dispatchEvent(
        new CustomEvent("server-error", {
          detail: error?.response?.data?.message || "Server error"
        })
      );
    }
    return Promise.reject(error);
  }
);
