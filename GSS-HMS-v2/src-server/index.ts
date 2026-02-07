import express from "express";
import cors from "cors";
import { setupDatabase } from "./db/index";

// Route imports
import authRoutes from "./routes/auth";
import staffRoutes from "./routes/staff";
import patientRoutes from "./routes/patients";
import labRoutes from "./routes/laboratory";
import opdRoutes from "./routes/opd";
import docRoutes from "./routes/documents";
import announcementRoutes from "./routes/announcements";
import attendanceRoutes from "./routes/attendance";
import leaveRoutes from "./routes/leave";
import payrollRoutes from "./routes/payroll";
import inventoryRoutes from "./routes/inventory";
import userRoutes from "./routes/users";
import scheduleRoutes from "./routes/schedules";
import dashboardRoutes from "./routes/dashboard";
import pharmacyRoutes from "./routes/pharmacy";
import billingRoutes from "./routes/billing";
import medicineAdminRoutes from "./routes/medicine-admin";
import doctorReviewRoutes from "./routes/doctor-reviews";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ─── Self-initialize database ───────────────────────────────
setupDatabase();

// ─── API Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/lab-tests", labRoutes);
app.use("/api/tokens", opdRoutes);
app.use("/api/documents", docRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/users", userRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/medicine-admin", medicineAdminRoutes);
app.use("/api/doctor-reviews", doctorReviewRoutes);

// ─── Health check ───────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Global error handler ───────────────────────────────────
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Unhandled error:", err?.message || err);
  res.status(500).json({ error: err?.message || "Internal server error" });
});

// ─── Start ──────────────────────────────────────────────────
app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n🏥 GSS Hospital API running on http://0.0.0.0:${PORT}`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   LAN:     http://<your-ip>:${PORT}\n`);
});
