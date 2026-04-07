import axios from "axios";

// In Tauri production builds, the frontend is served from disk (tauri://localhost),
// so relative "/api" won't reach the Express server. Use absolute URL instead.
const isTauri =
  typeof window !== "undefined" &&
  (window.location.protocol === "tauri:" ||
    window.location.protocol === "https:" && window.location.hostname === "tauri.localhost" ||
    "__TAURI__" in window);

const api = axios.create({
  baseURL: isTauri ? "http://localhost:3001/api" : "/api",
  headers: { "Content-Type": "application/json" },
});

// ─── Request interceptor: attach JWT token ──────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: handle 401 ───────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth-token");
      // Only redirect if not already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ─── Typed API helpers ──────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; user: { id: string; email: string; name: string; role: string } }>("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
};

export const staffApi = {
  list: () => api.get("/staff"),
  get: (id: string) => api.get(`/staff/${id}`),
  create: (data: Record<string, unknown>) => api.post("/staff", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/staff/${id}`, data),
  delete: (id: string) => api.delete(`/staff/${id}`),
  permanentDelete: (id: string) => api.delete(`/staff/${id}?permanent=true`),
  uploadFile: (id: string, file: File, fieldType: "photo" | "aadhaar") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fieldType", fieldType);
    return api.post(`/staff/${id}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const attendanceApi = {
  list: () => api.get("/attendance"),
  create: (data: Record<string, unknown>) => api.post("/attendance", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/attendance/${id}`, data),
};

export const leaveApi = {
  list: () => api.get("/leave"),
  apply: (data: Record<string, unknown>) => api.post("/leave", data),
  updateStatus: (id: string, status: string) => api.patch(`/leave/${id}/status`, { status }),
  cancel: (id: string) => api.patch(`/leave/${id}/cancel`),
  listTypes: () => api.get("/leave/types"),
  createType: (data: { name: string }) => api.post("/leave/types", data),
  deleteType: (id: string) => api.delete(`/leave/types/${id}`),
};

export const payrollApi = {
  list: () => api.get("/payroll"),
  create: (data: Record<string, unknown>) => api.post("/payroll", data),
  generate: (data: { month: string; year: string }) => api.post("/payroll/generate", data),
  updateStatus: (id: string, status: string) => api.patch(`/payroll/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/payroll/${id}`),
};

export const usersApi = {
  list: () => api.get("/users"),
  create: (data: Record<string, unknown>) => api.post("/users", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  permanentDelete: (id: string) => api.delete(`/users/${id}?permanent=true`),
};

export const dashboardApi = {
  stats: (period?: string) => api.get("/dashboard/stats", { params: { period: period || "monthly" } }),
};

export const settingsApi = {
  getMode: () => api.get<{ mode: "demo" | "user" }>("/settings/mode"),
  switchMode: (mode: "demo" | "user") =>
    api.post<{
      mode: string;
      message: string;
      credentials: { role: string; email: string; password: string }[];
    }>("/settings/mode", { mode }),
};
