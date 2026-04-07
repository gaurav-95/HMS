import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { db } from "../db/index";
import { staff, certifications, kpis, attendanceRecords, leaveRequests, payrollRecords, performanceEvaluations, doctorSchedules, staffDocuments } from "../db/schema";
import { requireAuth, requirePermission, AuthRequest } from "../middleware/auth";

const __filename_esm = typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url);
const __dirname_esm = typeof __dirname !== "undefined" ? __dirname : path.dirname(__filename_esm);
const UPLOADS_DIR = path.resolve(__dirname_esm, "..", "..", "data", "uploads", "staff");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req: any, _file, cb) => {
    const staffId = String(req.params.id);
    const subDir = req.body?.category === "medical" ? "medical" : req.body?.fieldType === "photo" ? "photo" : "official";
    const dir = path.join(UPLOADS_DIR, staffId, subDir);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

const router = Router();

/** GET /api/staff */
router.get("/", requireAuth, requirePermission("staff:read"), (req: AuthRequest, res) => {
  let allStaff;

  // LEADER: only see staff in their department
  if (req.user!.role === "LEADER" && req.user!.department) {
    allStaff = db.select().from(staff)
      .where(and(eq(staff.isActive, true), eq(staff.department, req.user!.department))).all();
  } else {
    allStaff = db.select().from(staff).where(eq(staff.isActive, true)).all();
  }

  // Attach certifications and KPIs
  const result = allStaff.map((s) => {
    const certs = db.select().from(certifications).where(eq(certifications.staffId, s.id)).all();
    const staffKpis = db.select().from(kpis).where(eq(kpis.staffId, s.id)).all();
    return { ...s, certifications: certs, kpis: staffKpis };
  });

  res.json(result);
});

/** GET /api/staff/:id */
router.get("/:id", requireAuth, requirePermission("staff:read"), (req: AuthRequest, res) => {
  const s = db.select().from(staff).where(eq(staff.id, String(req.params.id))).get() as any;
  if (!s) return res.status(404).json({ error: "Staff not found" });

  // LEADER can only view staff in their department
  if (req.user!.role === "LEADER" && req.user!.department && s.department !== req.user!.department) {
    return res.status(403).json({ error: "Access denied: staff is not in your department" });
  }

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

/** POST /api/staff/:id/upload — upload profile photo */
router.post("/:id/upload", requireAuth, requirePermission("staff:write"), upload.single("file"), (req: any, res) => {
  const staffId = String(req.params.id);
  const s = db.select().from(staff).where(eq(staff.id, staffId)).get();
  if (!s) return res.status(404).json({ error: "Staff not found" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fieldType = req.body.fieldType; // "photo" or "aadhaar" (legacy compat)
  const relativePath = `/uploads/staff/${staffId}/photo/${req.file.filename}`;

  if (fieldType === "photo") {
    db.update(staff).set({ photoPath: relativePath, updatedAt: new Date().toISOString() }).where(eq(staff.id, staffId)).run();
  } else if (fieldType === "aadhaar") {
    db.update(staff).set({ aadhaarDocPath: relativePath, updatedAt: new Date().toISOString() }).where(eq(staff.id, staffId)).run();
  } else {
    return res.status(400).json({ error: "fieldType must be 'photo' or 'aadhaar'" });
  }

  res.json({ path: relativePath });
});

/** GET /api/staff/:id/documents — list all documents for a staff member */
router.get("/:id/documents", requireAuth, requirePermission("staff:read"), (req: AuthRequest, res) => {
  const staffId = String(req.params.id);
  const docs = db.select().from(staffDocuments).where(eq(staffDocuments.staffId, staffId)).all();
  res.json(docs);
});

/** POST /api/staff/:id/documents — upload a document */
router.post("/:id/documents", requireAuth, requirePermission("staff:write"), upload.single("file"), (req: any, res) => {
  const staffId = String(req.params.id);
  const s = db.select().from(staff).where(eq(staff.id, staffId)).get();
  if (!s) return res.status(404).json({ error: "Staff not found" });
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const { category, documentType } = req.body;
  if (!category || !["official", "medical"].includes(category)) {
    return res.status(400).json({ error: "category must be 'official' or 'medical'" });
  }
  if (!documentType) {
    return res.status(400).json({ error: "documentType is required" });
  }

  const id = randomUUID();
  const subDir = category === "medical" ? "medical" : "official";
  db.insert(staffDocuments).values({
    id,
    staffId,
    fileName: `${staffId}/${subDir}/${req.file.filename}`,
    originalName: req.file.originalname,
    category,
    documentType,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    uploadedAt: new Date().toISOString(),
  }).run();

  res.status(201).json(db.select().from(staffDocuments).where(eq(staffDocuments.id, id)).get());
});

/** DELETE /api/staff/:id/documents/:docId — delete a document */
router.delete("/:id/documents/:docId", requireAuth, requirePermission("staff:write"), (req: any, res) => {
  const docId = String(req.params.docId);
  const doc = db.select().from(staffDocuments).where(eq(staffDocuments.id, docId)).get() as any;
  if (!doc) return res.status(404).json({ error: "Document not found" });

  // Delete physical file
  const filePath = path.join(UPLOADS_DIR, doc.fileName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  db.delete(staffDocuments).where(eq(staffDocuments.id, docId)).run();
  res.status(204).send();
});

// ─── Certifications CRUD ────────────────────────────────────

/** GET /api/staff/:id/certifications */
router.get("/:id/certifications", requireAuth, requirePermission("staff:read"), (req, res) => {
  const staffId = String(req.params.id);
  res.json(db.select().from(certifications).where(eq(certifications.staffId, staffId)).all());
});

/** POST /api/staff/:id/certifications */
router.post("/:id/certifications", requireAuth, requirePermission("staff:write"), (req, res) => {
  const staffId = String(req.params.id);
  const s = db.select().from(staff).where(eq(staff.id, staffId)).get();
  if (!s) return res.status(404).json({ error: "Staff not found" });

  const { name, expiryDate, status } = req.body;
  if (!name || !expiryDate || !status) return res.status(400).json({ error: "name, expiryDate, status are required" });

  const id = randomUUID();
  db.insert(certifications).values({ id, staffId, name, expiryDate, status }).run();
  res.status(201).json(db.select().from(certifications).where(eq(certifications.id, id)).get());
});

/** PUT /api/staff/:id/certifications/:certId */
router.put("/:id/certifications/:certId", requireAuth, requirePermission("staff:write"), (req, res) => {
  const certId = String(req.params.certId);
  const existing = db.select().from(certifications).where(eq(certifications.id, certId)).get();
  if (!existing) return res.status(404).json({ error: "Certification not found" });

  const { name, expiryDate, status } = req.body;
  db.update(certifications).set({
    ...(name && { name }),
    ...(expiryDate && { expiryDate }),
    ...(status && { status }),
  }).where(eq(certifications.id, certId)).run();
  res.json(db.select().from(certifications).where(eq(certifications.id, certId)).get());
});

/** DELETE /api/staff/:id/certifications/:certId */
router.delete("/:id/certifications/:certId", requireAuth, requirePermission("staff:write"), (req, res) => {
  const certId = String(req.params.certId);
  db.delete(certifications).where(eq(certifications.id, certId)).run();
  res.status(204).send();
});

/** POST /api/staff/:id/photo-from-document — copy a document image as profile photo */
router.post("/:id/photo-from-document", requireAuth, requirePermission("staff:write"), (req: any, res) => {
  const staffId = String(req.params.id);
  const { documentId } = req.body;
  const doc = db.select().from(staffDocuments).where(eq(staffDocuments.id, documentId)).get() as any;
  if (!doc) return res.status(404).json({ error: "Document not found" });
  if (!doc.mimeType.startsWith("image/")) return res.status(400).json({ error: "Document is not an image" });

  // Copy the document file to the photo directory
  const srcPath = path.join(UPLOADS_DIR, doc.fileName);
  if (!fs.existsSync(srcPath)) return res.status(404).json({ error: "Document file not found on disk" });

  const photoDir = path.join(UPLOADS_DIR, staffId, "photo");
  if (!fs.existsSync(photoDir)) fs.mkdirSync(photoDir, { recursive: true });
  const ext = path.extname(doc.originalName) || ".jpg";
  const photoFileName = `${randomUUID()}${ext}`;
  fs.copyFileSync(srcPath, path.join(photoDir, photoFileName));

  const relativePath = `/uploads/staff/${staffId}/photo/${photoFileName}`;
  db.update(staff).set({ photoPath: relativePath, updatedAt: new Date().toISOString() }).where(eq(staff.id, staffId)).run();
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
    // Delete related records first (FK constraints — no cascade on these tables)
    db.delete(payrollRecords).where(eq(payrollRecords.staffId, staffId)).run();
    db.delete(attendanceRecords).where(eq(attendanceRecords.staffId, staffId)).run();
    db.delete(leaveRequests).where(eq(leaveRequests.staffId, staffId)).run();
    db.delete(performanceEvaluations).where(eq(performanceEvaluations.staffId, staffId)).run();
    db.delete(doctorSchedules).where(eq(doctorSchedules.doctorId, staffId)).run();
    // certifications and kpis cascade automatically
    db.delete(staff).where(eq(staff.id, staffId)).run();
  } else {
    db.update(staff).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(staff.id, staffId)).run();
  }
  res.status(204).send();
});

export default router;
