import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { medicineAdministrations, prescriptions } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

/** GET /api/medicine-admin – list all administrations */
router.get("/", requireAuth, requirePermission("medicine:administer"), (_req, res) => {
  res.json(db.select().from(medicineAdministrations).all());
});

/** GET /api/medicine-admin/discrepancies – only flagged records */
router.get("/discrepancies", requireAuth, requirePermission("reports:read"), (_req, res) => {
  const flagged = db
    .select()
    .from(medicineAdministrations)
    .where(sql`has_discrepancy = 1`)
    .all();
  res.json(flagged);
});

/** GET /api/medicine-admin/:id */
router.get("/:id", requireAuth, (req, res) => {
  const record = db.select().from(medicineAdministrations).where(eq(medicineAdministrations.id, String(req.params.id))).get();
  if (!record) return res.status(404).json({ error: "Record not found" });
  res.json(record);
});

/** POST /api/medicine-admin – record a medicine administration */
router.post("/", requireAuth, requirePermission("medicine:administer"), (req, res) => {
  const id = randomUUID();
  const {
    prescriptionId, patientName, doctorName,
    prescribedMedicine, prescribedDosage,
    administeredMedicine, administeredDosage,
    administeredBy, administeredByRole,
  } = req.body;

  // Auto-detect discrepancy
  const hasDiscrepancy =
    prescribedMedicine?.toLowerCase().trim() !== administeredMedicine?.toLowerCase().trim() ||
    prescribedDosage?.toLowerCase().trim() !== administeredDosage?.toLowerCase().trim();

  const discrepancyNotes = hasDiscrepancy
    ? `Prescribed: ${prescribedMedicine} ${prescribedDosage} | Administered: ${administeredMedicine} ${administeredDosage}`
    : null;

  db.insert(medicineAdministrations).values({
    id,
    prescriptionId: prescriptionId || null,
    patientName,
    doctorName,
    prescribedMedicine,
    prescribedDosage,
    administeredMedicine,
    administeredDosage,
    administeredBy,
    administeredByRole,
    administeredDate: new Date().toISOString().slice(0, 10),
    hasDiscrepancy,
    discrepancyNotes,
    status: hasDiscrepancy ? "Flagged" : "Administered",
  }).run();

  res.status(201).json(db.select().from(medicineAdministrations).where(eq(medicineAdministrations.id, id)).get());
});

/** PATCH /api/medicine-admin/:id/resolve – resolve a discrepancy */
router.patch("/:id/resolve", requireAuth, requirePermission("reports:match"), (req, res) => {
  const medId = String(req.params.id);
  const { notes } = req.body;
  db.update(medicineAdministrations)
    .set({ status: "Resolved", discrepancyNotes: notes || "Resolved by reviewer" })
    .where(eq(medicineAdministrations.id, medId))
    .run();
  const updated = db.select().from(medicineAdministrations).where(eq(medicineAdministrations.id, medId)).get();
  if (!updated) return res.status(404).json({ error: "Record not found" });
  res.json(updated);
});

/** DELETE /api/medicine-admin/:id */
router.delete("/:id", requireAuth, requirePermission("medicine:administer"), (req, res) => {
  db.delete(medicineAdministrations).where(eq(medicineAdministrations.id, String(req.params.id))).run();
  res.status(204).send();
});

export default router;
