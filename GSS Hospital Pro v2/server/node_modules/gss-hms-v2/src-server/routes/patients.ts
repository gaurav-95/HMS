import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { patients, patientDocuments } from "../db/schema";
import { requireAuth, requirePermission, type AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("patient:read"), (_req, res) => {
  const all = db.select().from(patients).where(eq(patients.isActive, true)).all();
  res.json(all);
});

router.get("/:id", requireAuth, requirePermission("patient:read"), (req, res) => {
  const p = db.select().from(patients).where(eq(patients.id, String(req.params.id))).get();
  if (!p) return res.status(404).json({ error: "Patient not found" });
  res.json(p);
});

router.post("/", requireAuth, requirePermission("patient:write"), (req, res) => {
  const now = new Date().toISOString();
  const id = randomUUID();
  db.insert(patients).values({ id, ...req.body, createdAt: now, updatedAt: now }).run();
  res.status(201).json(db.select().from(patients).where(eq(patients.id, id)).get());
});

router.put("/:id", requireAuth, requirePermission("patient:write"), (req, res) => {
  const patId = String(req.params.id);
  const { id: _id, createdAt: _ca, ...data } = req.body;
  db.update(patients).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(patients.id, patId)).run();
  const updated = db.select().from(patients).where(eq(patients.id, patId)).get();
  if (!updated) return res.status(404).json({ error: "Patient not found" });
  res.json(updated);
});

router.delete("/:id", requireAuth, requirePermission("patient:delete"), (req: AuthRequest, res) => {
  const patId = String(req.params.id);
  const permanent = req.query.permanent === "true" && req.user?.role === "SUPER_ADMIN";
  if (permanent) {
    // Delete related documents first (FK constraint)
    db.delete(patientDocuments).where(eq(patientDocuments.patientId, patId)).run();
    db.delete(patients).where(eq(patients.id, patId)).run();
  } else {
    db.update(patients).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(patients.id, patId)).run();
  }
  res.status(204).send();
});

// ─── Patient Documents ─────────────────────────────────────
router.get("/:id/documents", requireAuth, requirePermission("patient:read"), (req, res) => {
  const docs = db.select().from(patientDocuments).where(eq(patientDocuments.patientId, String(req.params.id))).all();
  res.json(docs);
});

router.post("/:id/documents", requireAuth, requirePermission("patient:write"), (req, res) => {
  const patId = String(req.params.id);
  const { docType, fileName, mimeType, fileData } = req.body;
  if (!docType || !fileName || !mimeType || !fileData) {
    return res.status(400).json({ error: "docType, fileName, mimeType, and fileData are required" });
  }
  const id = randomUUID();
  db.insert(patientDocuments).values({
    id,
    patientId: patId,
    docType,
    fileName,
    mimeType,
    fileData,
    uploadedAt: new Date().toISOString(),
  }).run();
  // Return without fileData to keep response small
  const doc = db.select({
    id: patientDocuments.id,
    patientId: patientDocuments.patientId,
    docType: patientDocuments.docType,
    fileName: patientDocuments.fileName,
    mimeType: patientDocuments.mimeType,
    uploadedAt: patientDocuments.uploadedAt,
  }).from(patientDocuments).where(eq(patientDocuments.id, id)).get();
  res.status(201).json(doc);
});

router.get("/:id/documents/:docId/download", requireAuth, requirePermission("patient:read"), (req, res) => {
  const doc = db.select().from(patientDocuments)
    .where(and(eq(patientDocuments.id, String(req.params.docId)), eq(patientDocuments.patientId, String(req.params.id))))
    .get();
  if (!doc) return res.status(404).json({ error: "Document not found" });
  res.json(doc);
});

router.delete("/:id/documents/:docId", requireAuth, requirePermission("patient:write"), (req, res) => {
  db.delete(patientDocuments)
    .where(and(eq(patientDocuments.id, String(req.params.docId)), eq(patientDocuments.patientId, String(req.params.id))))
    .run();
  res.status(204).send();
});

export default router;
