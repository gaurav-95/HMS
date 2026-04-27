import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db, clearAllData } from "../db/index";
import { users, appSettings, leaveTypes } from "../db/schema";
import { seedDemoData } from "../db/seed";
import { requireAuth, requirePermission, AuthRequest } from "../middleware/auth";

const router = Router();

/** GET /api/settings/mode — returns current app mode (public) */
router.get("/mode", (_req, res) => {
  const setting = db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, "appMode"))
    .get();
  res.json({ mode: setting?.value || "demo" });
});

/**
 * POST /api/settings/mode — switch between demo ↔ user mode.
 * This is a standalone desktop app — mode switching is always allowed from
 * the login page regardless of current mode. The confirmation dialog on the
 * frontend is the safety gate (not auth).
 */
router.post("/mode", requireAuth, (req: AuthRequest, res) => {
  if (req.user!.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can switch app mode" });
  }
  const { mode } = req.body;
  if (!mode || !["demo", "user"].includes(mode)) {
    return res.status(400).json({ error: "Invalid mode. Use 'demo' or 'user'." });
  }

  try {
    // 1. Clear all operational data
    clearAllData();

    if (mode === "demo") {
      // 2a. Re-seed demo data (includes leave types, etc.)
      seedDemoData();
    } else {
      // 2b. Create a fresh SUPER_ADMIN + defaults for user mode
      const now = new Date().toISOString();
      db.insert(users)
        .values({
          id: randomUUID(),
          email: "admin@hospital.com",
          password: bcrypt.hashSync("admin123", 10),
          name: "Administrator",
          role: "SUPER_ADMIN",
          isActive: true,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      // Re-seed default leave types
      db.insert(leaveTypes)
        .values({ id: "lt-casual", name: "Casual Leave", isActive: true, createdBy: "system", createdAt: now })
        .run();
      db.insert(leaveTypes)
        .values({ id: "lt-sick", name: "Sick Leave", isActive: true, createdBy: "system", createdAt: now })
        .run();
    }

    // 3. Persist the mode in app_settings
    const now = new Date().toISOString();
    const existing = db.select().from(appSettings).where(eq(appSettings.key, "appMode")).get();
    if (existing) {
      db.update(appSettings)
        .set({ value: mode, updatedAt: now })
        .where(eq(appSettings.key, "appMode"))
        .run();
    } else {
      db.insert(appSettings).values({ key: "appMode", value: mode, updatedAt: now }).run();
    }

    const info =
      mode === "demo"
        ? {
            message: "Demo mode activated — sample data loaded",
            credentials: [
              { role: "Super Admin", email: "superadmin@gsshospital.com", password: "password123" },
              { role: "Admin", email: "admin@gsshospital.com", password: "password123" },
              { role: "Leader", email: "leader@gsshospital.com", password: "password123" },
              { role: "Staff", email: "staff@gsshospital.com", password: "password123" },
            ],
          }
        : {
            message: "User mode activated — start fresh",
            credentials: [{ role: "Super Admin", email: "admin@hospital.com", password: "admin123" }],
          };

    res.json({ mode, ...info });
  } catch (err: any) {
    console.error("Mode switch error:", err);
    res.status(500).json({ error: "Failed to switch mode: " + (err.message || err) });
  }
});

/** GET /api/settings/hospital — return saved hospital info */
router.get("/hospital", requireAuth, (_req, res) => {
  const row = db.select().from(appSettings).where(eq(appSettings.key, "hospitalInfo")).get();
  if (!row) {
    // Return defaults if not yet saved
    return res.json({
      name: "Gandhi Seva Sadan Hospital",
      address: "207/1, SK Deb Rd, Sreebhumi, Lake Town, South Dumdum, West Bengal 700048",
      phone: "+91 612 222 1234",
      email: "info@gsshospital.com",
      website: "www.gsshospital.com",
      registrationNo: "GSS/REG/2024/001",
    });
  }
  try {
    res.json(JSON.parse(row.value));
  } catch {
    res.json({});
  }
});

/** PUT /api/settings/hospital — save hospital info (SUPER_ADMIN only) */
router.put("/hospital", requireAuth, (req: AuthRequest, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can update hospital information" });
  }
  const now = new Date().toISOString();
  const value = JSON.stringify(req.body);
  const existing = db.select().from(appSettings).where(eq(appSettings.key, "hospitalInfo")).get();
  if (existing) {
    db.update(appSettings).set({ value, updatedAt: now }).where(eq(appSettings.key, "hospitalInfo")).run();
  } else {
    db.insert(appSettings).values({ key: "hospitalInfo", value, updatedAt: now }).run();
  }
  res.json({ ok: true });
});

/** GET /api/settings/opd — return saved OPD settings */
router.get("/opd", requireAuth, (_req, res) => {
  const row = db.select().from(appSettings).where(eq(appSettings.key, "opdInfo")).get();
  if (!row) {
    return res.json({
      startTime: "09:00",
      endTime: "17:00",
      maxTokensPerDay: 100,
      tokenPrefix: "GSS",
      consultationFee: 200,
    });
  }
  try {
    res.json(JSON.parse(row.value));
  } catch {
    res.json({});
  }
});

/** PUT /api/settings/opd — save OPD settings (SUPER_ADMIN only) */
router.put("/opd", requireAuth, (req: AuthRequest, res) => {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can update OPD settings" });
  }
  const now = new Date().toISOString();
  const value = JSON.stringify(req.body);
  const existing = db.select().from(appSettings).where(eq(appSettings.key, "opdInfo")).get();
  if (existing) {
    db.update(appSettings).set({ value, updatedAt: now }).where(eq(appSettings.key, "opdInfo")).run();
  } else {
    db.insert(appSettings).values({ key: "opdInfo", value, updatedAt: now }).run();
  }
  res.json({ ok: true });
});

export default router;
