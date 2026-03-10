import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "../db/index";
import { staff, certifications, kpis } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const __filename_esm = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const __dirname_esm = typeof __dirname !== "undefined" ? __dirname : path.dirname(__filename_esm);
const UPLOADS_DIR = path.resolve(__dirname_esm, "..", "..", "data", "uploads", "staff");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

const router = Router();

/** GET /api/staff */
router.get("/", requireAuth, requirePermission("staff:read"), (_req, res) => {
  const allStaff = db.select().from(staff).where(eq(staff.isActive, true)).all();

  // Attach certifications and KPIs
  const result = allStaff.map((s) => {
    const certs = db.select().from(certifications).where(eq(certifications.staffId, s.id)).all();
    const staffKpis = db.select().from(kpis).where(eq(kpis.staffId, s.id)).all();
    return { ...s, certifications: certs, kpis: staffKpis };
  });

  res.json(result);
});

/** GET /api/staff/:id */
router.get("/:id", requireAuth, requirePermission("staff:read"), (req, res) => {
  const s = db.select().from(staff).where(eq(staff.id, String(req.params.id))).get();
  if (!s) return res.status(404).json({ error: "Staff not found" });

  const certs = db.select().from(certifications).where(eq(certifications.staffId, s.id)).all();
  const staffKpis = db.select().from(kpis).where(eq(kpis.staffId, s.id)).all();
  res.json({ ...s, certifications: certs, kpis: staffKpis });
});

/** POST /api/staff */
router.post("/", requireAuth, requirePermission("staff:write"), (req, res) => {
  const now = new Date().toISOString();
  const id = randomUUID();
  const { certifications: certs, kpis: staffKpis, ...data } = req.body;

  db.insert(staff).values({ id, ...data, createdAt: now, updatedAt: now }).run();

  // Insert certifications
  if (Array.isArray(certs)) {
    for (const c of certs) {
      db.insert(certifications).values({ id: randomUUID(), staffId: id, ...c }).run();
    }
  }

  // Insert KPIs
  if (Array.isArray(staffKpis)) {
    for (const k of staffKpis) {
      db.insert(kpis).values({ id: randomUUID(), staffId: id, ...k }).run();
    }
  }

  const created = db.select().from(staff).where(eq(staff.id, id)).get();
  res.status(201).json(created);
});

/** POST /api/staff/:id/upload — upload photo or aadhaar document */
router.post("/:id/upload", requireAuth, requirePermission("staff:write"), upload.single("file"), (req: any, res) => {
  const staffId = String(req.params.id);
  const s = db.select().from(staff).where(eq(staff.id, staffId)).get();
  if (!s) return res.status(404).json({ error: "Staff not found" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fieldType = req.body.fieldType; // "photo" or "aadhaar"
  const relativePath = `/uploads/staff/${req.file.filename}`;

  if (fieldType === "photo") {
    db.update(staff).set({ photoPath: relativePath, updatedAt: new Date().toISOString() }).where(eq(staff.id, staffId)).run();
  } else if (fieldType === "aadhaar") {
    db.update(staff).set({ aadhaarDocPath: relativePath, updatedAt: new Date().toISOString() }).where(eq(staff.id, staffId)).run();
  } else {
    return res.status(400).json({ error: "fieldType must be 'photo' or 'aadhaar'" });
  }

  res.json({ path: relativePath });
});

/** PUT /api/staff/:id */
router.put("/:id", requireAuth, requirePermission("staff:write"), (req, res) => {
  const staffId = String(req.params.id);
  const { certifications: _c, kpis: _k, id: _id, createdAt: _ca, ...data } = req.body;
  db.update(staff)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(staff.id, staffId))
    .run();

  const updated = db.select().from(staff).where(eq(staff.id, staffId)).get();
  if (!updated) return res.status(404).json({ error: "Staff not found" });
  res.json(updated);
});

/** DELETE /api/staff/:id */
router.delete("/:id", requireAuth, requirePermission("staff:delete"), (req: any, res) => {
  const staffId = String(req.params.id);
  const permanent = req.query.permanent === "true" && req.user?.role === "SUPER_ADMIN";
  if (permanent) {
    db.delete(staff).where(eq(staff.id, staffId)).run();
  } else {
    db.update(staff).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(staff.id, staffId)).run();
  }
  res.status(204).send();
});

export default router;
