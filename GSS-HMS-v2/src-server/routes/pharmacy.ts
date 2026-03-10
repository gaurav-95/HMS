import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { prescriptions } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

/** GET /api/pharmacy – list all prescriptions */
router.get("/", requireAuth, requirePermission("patient:read"), (_req, res) => {
  res.json(db.select().from(prescriptions).all());
});

/** GET /api/pharmacy/:id – single prescription */
router.get("/:id", requireAuth, requirePermission("patient:read"), (req, res) => {
  const row = db.select().from(prescriptions).where(eq(prescriptions.id, String(req.params.id))).get();
  if (!row) return res.status(404).json({ error: "Prescription not found" });
  res.json(row);
});

/** POST /api/pharmacy – new prescription */
router.post("/", requireAuth, requirePermission("lab:write"), (req, res) => {
  const id = randomUUID();
  db.insert(prescriptions).values({ id, ...req.body }).run();
  res.status(201).json(db.select().from(prescriptions).where(eq(prescriptions.id, id)).get());
});

/** PUT /api/pharmacy/:id – update prescription */
router.put("/:id", requireAuth, requirePermission("lab:write"), (req, res) => {
  const rxId = String(req.params.id);
  const { id: _id, ...data } = req.body;
  db.update(prescriptions).set(data).where(eq(prescriptions.id, rxId)).run();
  const updated = db.select().from(prescriptions).where(eq(prescriptions.id, rxId)).get();
  if (!updated) return res.status(404).json({ error: "Prescription not found" });
  res.json(updated);
});

/** PATCH /api/pharmacy/:id/dispense – dispense a prescription */
router.patch("/:id/dispense", requireAuth, requirePermission("inventory:write"), (req, res) => {
  const rxId = String(req.params.id);
  const { dispensedBy } = req.body;
  db.update(prescriptions).set({
    status: "Dispensed",
    dispensedDate: new Date().toISOString().split("T")[0],
    dispensedBy: dispensedBy || "Pharmacy",
  }).where(eq(prescriptions.id, rxId)).run();
  const updated = db.select().from(prescriptions).where(eq(prescriptions.id, rxId)).get();
  if (!updated) return res.status(404).json({ error: "Prescription not found" });
  res.json(updated);
});

/** DELETE /api/pharmacy/:id */
router.delete("/:id", requireAuth, requirePermission("lab:delete"), (req, res) => {
  const rxId = String(req.params.id);
  const exists = db.select().from(prescriptions).where(eq(prescriptions.id, rxId)).get();
  if (!exists) return res.status(404).json({ error: "Prescription not found" });
  db.delete(prescriptions).where(eq(prescriptions.id, rxId)).run();
  res.json({ success: true });
});

export default router;
