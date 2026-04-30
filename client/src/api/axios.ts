import axios from "axios";

// State to prevent multiple refresh attempts if session is clearly dead
let isSessionExpired = false;

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
  withCredentials: true, // always send cookies
  headers: { "Content-Type": "application/json" },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown) => {
  failedQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  );
  failedQueue = [];
};

// Intercept 401s — try to refresh, then retry original request
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const is401 = error.response?.status === 401;
    const isRefreshEndpoint = originalRequest.url?.includes("/auth/refresh");
    const isLoginEndpoint = originalRequest.url?.includes("/auth/login");

    // 🚨 HARD STOP: if session already marked as expired, redirect immediately
    if (isSessionExpired) {
      if (!isLoginEndpoint && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (is401 && !originalRequest._retry && !isRefreshEndpoint && !isLoginEndpoint) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/auth/refresh");
        isSessionExpired = false;
        processQueue(null);
        return api(originalRequest);

      } catch (refreshError) {
        // 🚨 Session is dead
        isSessionExpired = true;
        processQueue(refreshError);

        // clear everything
        failedQueue = [];
        isRefreshing = false;

        // Only redirect if not already on login page
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);