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
};

export const patientsApi = {
  list: () => api.get("/patients"),
  get: (id: string) => api.get(`/patients/${id}`),
  create: (data: Record<string, unknown>) => api.post("/patients", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/patients/${id}`, data),
  delete: (id: string) => api.delete(`/patients/${id}`),
  permanentDelete: (id: string) => api.delete(`/patients/${id}?permanent=true`),
};

export const labApi = {
  list: () => api.get("/lab-tests"),
  get: (id: string) => api.get(`/lab-tests/${id}`),
  create: (data: Record<string, unknown>) => api.post("/lab-tests", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/lab-tests/${id}`, data),
  updateStatus: (id: string, data: Record<string, unknown>) => api.patch(`/lab-tests/${id}/status`, data),
  delete: (id: string) => api.delete(`/lab-tests/${id}`),
  permanentDelete: (id: string) => api.delete(`/lab-tests/${id}?permanent=true`),
};

export const tokensApi = {
  list: () => api.get("/tokens"),
  create: (data: Record<string, unknown>) => api.post("/tokens", data),
  updateStatus: (id: string, status: string) => api.patch(`/tokens/${id}/status`, { status }),
};

export const documentsApi = {
  list: () => api.get("/documents"),
  create: (data: Record<string, unknown>) => api.post("/documents", data),
  delete: (id: string) => api.delete(`/documents/${id}`),
  permanentDelete: (id: string) => api.delete(`/documents/${id}?permanent=true`),
};

export const announcementsApi = {
  list: () => api.get("/announcements"),
  create: (data: Record<string, unknown>) => api.post("/announcements", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/announcements/${id}`, data),
  delete: (id: string) => api.delete(`/announcements/${id}`),
  permanentDelete: (id: string) => api.delete(`/announcements/${id}?permanent=true`),
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
};

export const payrollApi = {
  list: () => api.get("/payroll"),
  create: (data: Record<string, unknown>) => api.post("/payroll", data),
  updateStatus: (id: string, status: string) => api.patch(`/payroll/${id}/status`, { status }),
};

export const inventoryApi = {
  list: () => api.get("/inventory"),
  get: (id: string) => api.get(`/inventory/${id}`),
  create: (data: Record<string, unknown>) => api.post("/inventory", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/inventory/${id}`, data),
  delete: (id: string) => api.delete(`/inventory/${id}`),
};

export const usersApi = {
  list: () => api.get("/users"),
  create: (data: Record<string, unknown>) => api.post("/users", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  permanentDelete: (id: string) => api.delete(`/users/${id}?permanent=true`),
};

export const schedulesApi = {
  list: () => api.get("/schedules"),
  create: (data: Record<string, unknown>) => api.post("/schedules", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/schedules/${id}`),
  permanentDelete: (id: string) => api.delete(`/schedules/${id}?permanent=true`),
};

export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
};

export const pharmacyApi = {
  list: () => api.get("/pharmacy"),
  get: (id: string) => api.get(`/pharmacy/${id}`),
  create: (data: Record<string, unknown>) => api.post("/pharmacy", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/pharmacy/${id}`, data),
  dispense: (id: string, data: Record<string, unknown>) => api.patch(`/pharmacy/${id}/dispense`, data),
  delete: (id: string) => api.delete(`/pharmacy/${id}`),
};

export const billingApi = {
  list: () => api.get("/billing"),
  get: (id: string) => api.get(`/billing/${id}`),
  create: (data: Record<string, unknown>) => api.post("/billing", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/billing/${id}`, data),
  pay: (id: string, data: Record<string, unknown>) => api.patch(`/billing/${id}/pay`, data),
  delete: (id: string) => api.delete(`/billing/${id}`),
  permanentDelete: (id: string) => api.delete(`/billing/${id}?permanent=true`),
};

export const medicineAdminApi = {
  list: () => api.get("/medicine-admin"),
  discrepancies: () => api.get("/medicine-admin/discrepancies"),
  get: (id: string) => api.get(`/medicine-admin/${id}`),
  create: (data: Record<string, unknown>) => api.post("/medicine-admin", data),
  resolve: (id: string, data: Record<string, unknown>) => api.patch(`/medicine-admin/${id}/resolve`, data),
  delete: (id: string) => api.delete(`/medicine-admin/${id}`),
};

export const doctorReviewsApi = {
  list: () => api.get("/doctor-reviews"),
  karma: () => api.get("/doctor-reviews/karma"),
  get: (id: string) => api.get(`/doctor-reviews/${id}`),
  create: (data: Record<string, unknown>) => api.post("/doctor-reviews", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/doctor-reviews/${id}`, data),
  delete: (id: string) => api.delete(`/doctor-reviews/${id}`),
};
