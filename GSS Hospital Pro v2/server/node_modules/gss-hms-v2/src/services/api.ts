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

/** Resolve an upload path to a full URL (handles Tauri vs dev modes) */
export function getUploadUrl(uploadPath: string): string {
  if (!uploadPath) return "";
  // uploadPath is like "/uploads/staff/{id}/photo/file.jpg"
  return isTauri ? `http://localhost:3001${uploadPath}` : uploadPath;
}

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
  // Document management
  listDocuments: (id: string) => api.get(`/staff/${id}/documents`),
  uploadDocument: (id: string, file: File, category: "official" | "medical", documentType: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category", category);
    formData.append("documentType", documentType);
    return api.post(`/staff/${id}/documents`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteDocument: (staffId: string, docId: string) => api.delete(`/staff/${staffId}/documents/${docId}`),
  useDocumentAsPhoto: (staffId: string, documentId: string) => api.post(`/staff/${staffId}/photo-from-document`, { documentId }),
  // Certifications
  listCertifications: (id: string) => api.get(`/staff/${id}/certifications`),
  createCertification: (staffId: string, data: Record<string, unknown>) => api.post(`/staff/${staffId}/certifications`, data),
  updateCertification: (staffId: string, certId: string, data: Record<string, unknown>) => api.put(`/staff/${staffId}/certifications/${certId}`, data),
  deleteCertification: (staffId: string, certId: string) => api.delete(`/staff/${staffId}/certifications/${certId}`),
  uploadCertification: (staffId: string, certId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/staff/${staffId}/certifications/${certId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  certDownloadUrl: (staffId: string, certId: string) => {
    const base = isTauri ? "http://localhost:3001/api" : "/api";
    return `${base}/staff/${staffId}/certifications/${certId}/download`;
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
  generate: (data: { month: string; year: string; staffIds?: string[] }) => api.post("/payroll/generate", data),
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
  addressCertification: (certId: string) => api.patch(`/dashboard/certifications/${certId}/address`),
  unaddressCertification: (certId: string) => api.patch(`/dashboard/certifications/${certId}/unaddress`),
  allCertifications: () => api.get("/dashboard/certifications"),
};

export const settingsApi = {
  getMode: () => api.get<{ mode: "demo" | "user" }>("/settings/mode"),
  switchMode: (mode: "demo" | "user") =>
    api.post<{
      mode: string;
      message: string;
      credentials: { role: string; email: string; password: string }[];
    }>("/settings/mode", { mode }),
  getHospital: () => api.get("/settings/hospital"),
  saveHospital: (data: Record<string, unknown>) => api.put("/settings/hospital", data),
  getOPD: () => api.get("/settings/opd"),
  saveOPD: (data: Record<string, unknown>) => api.put("/settings/opd", data),
};

export const hospitalLicensesApi = {
  list: () => api.get("/hospital-licenses"),
  create: (data: Record<string, unknown>) => api.post("/hospital-licenses", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/hospital-licenses/${id}`, data),
  delete: (id: string) => api.delete(`/hospital-licenses/${id}`),
  upload: (id: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post(`/hospital-licenses/${id}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  downloadUrl: (id: string) => {
    const base = isTauri ? "http://localhost:3001/api" : "/api";
    return `${base}/hospital-licenses/${id}/download`;
  },
  address: (id: string) => api.patch(`/hospital-licenses/${id}/address`),
  unaddress: (id: string) => api.patch(`/hospital-licenses/${id}/unaddress`),
};
