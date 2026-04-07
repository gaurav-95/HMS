import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { setupDatabase } from "./db/index";

// ESM / CJS compat — __dirname is defined in CJS (esbuild bundle) but not in ESM (tsx dev)
const __filename_esm = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const __dirname_esm = typeof __dirname !== "undefined" ? __dirname : path.dirname(__filename_esm);

// Route imports
import authRoutes from "./routes/auth";
import staffRoutes from "./routes/staff";
import attendanceRoutes from "./routes/attendance";
import leaveRoutes from "./routes/leave";
import payrollRoutes from "./routes/payroll";
import userRoutes from "./routes/users";
import dashboardRoutes from "./routes/dashboard";
import settingsRoutes from "./routes/settings";

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
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/settings", settingsRoutes);

// ─── Serve uploaded files ─────────────────────────────────────
const UPLOADS_DIR = path.resolve(__dirname_esm, "..", "data", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

// ─── Health check ───────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Serve frontend static files (for standalone / browser mode) ────
const candidateDirs = [
  path.resolve(__dirname_esm, "..", "resources", "app"),       // standalone: server/../resources/app
  path.resolve(__dirname_esm, "..", "resources", "app", "dist"),
  path.resolve(__dirname_esm, "..", "dist"),                   // dev build: dist-server/../dist
  path.resolve(__dirname_esm, "..", "resources", "dist"),
];
const frontendDir = candidateDirs.find(
  (d) => fs.existsSync(d) && fs.existsSync(path.join(d, "index.html"))
) ?? null;

if (frontendDir) {
  app.use(express.static(frontendDir, {
    // Ensure correct MIME types for all static assets
    setHeaders: (res, filePath) => {
      if (filePath.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=UTF-8");
      } else if (filePath.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript; charset=UTF-8");
      }
    },
  }));
  // SPA fallback: serve index.html for any non-API route (Express 5 syntax)
  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(frontendDir, "index.html"));
  });
  console.log(`📂 Serving frontend from ${frontendDir}`);
}

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
