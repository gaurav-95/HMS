import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "../db/index";
import { hospitalLicenses } from "../db/schema";
import { requireAuth, requirePermission, AuthRequest } from "../middleware/auth";

const __filename_esm = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const __dirname_esm = typeof __dirname !== "undefined" ? __dirname : path.dirname(__filename_esm);

const UPLOAD_DIR = path.resolve(__dirname_esm, "..", "..", "data", "uploads", "hospital-licenses");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed"));
    }
  },
});

const router = Router();

/** Recompute status based on expiry date */
function computeStatus(expiryDate: string | null | undefined): string {
  if (!expiryDate) return "Valid";
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft < 0) return "Expired";
  if (daysLeft <= 60) return "Expiring";
  return "Valid";
}

/** GET /api/hospital-licenses — list all active licenses */
router.get("/", requireAuth, (req: AuthRequest, res) => {
  const rows = db
    .select()
    .from(hospitalLicenses)
    .where(eq(hospitalLicenses.isActive, true))
    .all();

  // Recompute status on read (keeps status accurate even if never updated)
  const recomputed = rows.map((r) => ({
    ...r,
    status: r.expiryDate ? computeStatus(r.expiryDate) : r.status,
  }));

  res.json(recomputed);
});

/** POST /api/hospital-licenses — create a new license record */
router.post("/", requireAuth, requirePermission("staff:write"), (req: AuthRequest, res) => {
  const { name, category, issuingAuthority, licenseNumber, issueDate, expiryDate, uploadedBy } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: "name and category are required" });
  }
  const now = new Date().toISOString();
  const id = randomUUID();
  const status = computeStatus(expiryDate);
  db.insert(hospitalLicenses).values({
    id,
    name,
    category,
    issuingAuthority: issuingAuthority || null,
    licenseNumber: licenseNumber || null,
    issueDate: issueDate || null,
    expiryDate: expiryDate || null,
    status,
    addressed: false,
    uploadedBy: uploadedBy || req.user?.name || "System",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  }).run();
  const created = db.select().from(hospitalLicenses).where(eq(hospitalLicenses.id, id)).get();
  res.status(201).json(created);
});

/** PUT /api/hospital-licenses/:id — update a license record */
router.put("/:id", requireAuth, requirePermission("staff:write"), (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const existing = db.select().from(hospitalLicenses).where(eq(hospitalLicenses.id, id)).get();
  if (!existing || !existing.isActive) {
    return res.status(404).json({ error: "License not found" });
  }
  const { name, category, issuingAuthority, licenseNumber, issueDate, expiryDate } = req.body;
  const now = new Date().toISOString();
  const status = computeStatus(expiryDate ?? existing.expiryDate);
  db.update(hospitalLicenses).set({
    name: name ?? existing.name,
    category: category ?? existing.category,
    issuingAuthority: issuingAuthority !== undefined ? issuingAuthority : existing.issuingAuthority,
    licenseNumber: licenseNumber !== undefined ? licenseNumber : existing.licenseNumber,
    issueDate: issueDate !== undefined ? issueDate : existing.issueDate,
    expiryDate: expiryDate !== undefined ? expiryDate : existing.expiryDate,
    status,
    updatedAt: now,
  }).where(eq(hospitalLicenses.id, id)).run();
  res.json(db.select().from(hospitalLicenses).where(eq(hospitalLicenses.id, id)).get());
});

/** DELETE /api/hospital-licenses/:id — soft delete */
router.delete("/:id", requireAuth, requirePermission("staff:delete"), (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const existing = db.select().from(hospitalLicenses).where(eq(hospitalLicenses.id, id)).get();
  if (!existing) return res.status(404).json({ error: "License not found" });

  // Hard delete for SUPER_ADMIN when ?permanent=true
  if (req.query.permanent === "true" && req.user?.role === "SUPER_ADMIN") {
    if (existing.filePath && fs.existsSync(path.join(UPLOAD_DIR, path.basename(existing.filePath)))) {
      fs.unlinkSync(path.join(UPLOAD_DIR, path.basename(existing.filePath)));
    }
    db.delete(hospitalLicenses).where(eq(hospitalLicenses.id, id)).run();
  } else {
    db.update(hospitalLicenses).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(hospitalLicenses.id, id)).run();
  }
  res.status(204).send();
});

/** POST /api/hospital-licenses/:id/upload — attach a certificate file */
router.post("/:id/upload", requireAuth, requirePermission("staff:write"), (req: AuthRequest, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const id = String(req.params.id);
    const existing = db.select().from(hospitalLicenses).where(eq(hospitalLicenses.id, id)).get();
    if (!existing) return res.status(404).json({ error: "License not found" });
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // Remove old file if it existed
    if (existing.filePath) {
      const oldFile = path.join(UPLOAD_DIR, path.basename(existing.filePath));
      if (fs.existsSync(oldFile)) {
        try { fs.unlinkSync(oldFile); } catch { /* ignore */ }
      }
    }

    const filePath = `/uploads/hospital-licenses/${req.file.filename}`;
    const fileSize = `${(req.file.size / 1024).toFixed(1)} KB`;
    const now = new Date().toISOString();

    db.update(hospitalLicenses).set({
      filePath,
      fileSize,
      addressed: true, // uploading a file counts as addressing it
      updatedAt: now,
    }).where(eq(hospitalLicenses.id, id)).run();

    res.json(db.select().from(hospitalLicenses).where(eq(hospitalLicenses.id, id)).get());
  });
});

/** GET /api/hospital-licenses/:id/download — stream file to client */
router.get("/:id/download", requireAuth, (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const license = db.select().from(hospitalLicenses).where(eq(hospitalLicenses.id, id)).get();
  if (!license || !license.filePath) {
    return res.status(404).json({ error: "No file found for this license" });
  }

  const filePath = path.join(UPLOAD_DIR, path.basename(license.filePath));
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found on disk" });
  }

  res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(license.name)}${path.extname(filePath)}"`);
  res.sendFile(filePath);
});

/** PATCH /api/hospital-licenses/:id/address — mark as addressed without file */
router.patch("/:id/address", requireAuth, requirePermission("staff:write"), (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const existing = db.select().from(hospitalLicenses).where(eq(hospitalLicenses.id, id)).get();
  if (!existing) return res.status(404).json({ error: "License not found" });
  db.update(hospitalLicenses).set({ addressed: true, updatedAt: new Date().toISOString() }).where(eq(hospitalLicenses.id, id)).run();
  res.json(db.select().from(hospitalLicenses).where(eq(hospitalLicenses.id, id)).get());
});

/** PATCH /api/hospital-licenses/:id/unaddress — reopen a previously addressed license */
router.patch("/:id/unaddress", requireAuth, requirePermission("staff:write"), (req: AuthRequest, res) => {
  const id = String(req.params.id);
  const existing = db.select().from(hospitalLicenses).where(eq(hospitalLicenses.id, id)).get();
  if (!existing) return res.status(404).json({ error: "License not found" });
  db.update(hospitalLicenses).set({ addressed: false, updatedAt: new Date().toISOString() }).where(eq(hospitalLicenses.id, id)).run();
  res.json(db.select().from(hospitalLicenses).where(eq(hospitalLicenses.id, id)).get());
});

export default router;
