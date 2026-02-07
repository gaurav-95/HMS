import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { labTests } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("lab:read"), (_req, res) => {
  res.json(db.select().from(labTests).orderBy(desc(labTests.orderedDate)).all());
});

router.get("/:id", requireAuth, requirePermission("lab:read"), (req, res) => {
  const t = db.select().from(labTests).where(eq(labTests.id, req.params.id)).get();
  if (!t) return res.status(404).json({ error: "Lab test not found" });
  res.json(t);
});

router.post("/", requireAuth, requirePermission("lab:write"), (req: any, res) => {
  const id = randomUUID();
  const orderedDate = req.body.orderedDate || new Date().toISOString().slice(0, 10);
  const status = req.body.status || "Pending";
  const orderedBy = req.body.orderedBy || req.user?.name || "System";
  db.insert(labTests).values({ id, ...req.body, orderedDate, status, orderedBy }).run();
  res.status(201).json(db.select().from(labTests).where(eq(labTests.id, id)).get());
});

router.put("/:id", requireAuth, requirePermission("lab:write"), (req, res) => {
  const { id: _id, ...data } = req.body;
  db.update(labTests).set(data).where(eq(labTests.id, req.params.id)).run();
  const updated = db.select().from(labTests).where(eq(labTests.id, req.params.id)).get();
  if (!updated) return res.status(404).json({ error: "Lab test not found" });
  res.json(updated);
});

/** PATCH /api/lab-tests/:id/status – quick status update */
router.patch("/:id/status", requireAuth, requirePermission("lab:write"), (req, res) => {
  const { status, result, completedDate } = req.body;
  db.update(labTests).set({ status, result, completedDate }).where(eq(labTests.id, req.params.id)).run();
  res.json(db.select().from(labTests).where(eq(labTests.id, req.params.id)).get());
});

router.delete("/:id", requireAuth, requirePermission("lab:delete"), (req, res) => {
  db.delete(labTests).where(eq(labTests.id, req.params.id)).run();
  res.status(204).send();
});

export default router;
