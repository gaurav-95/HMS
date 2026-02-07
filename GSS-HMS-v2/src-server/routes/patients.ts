import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { patients } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("patient:read"), (_req, res) => {
  res.json(db.select().from(patients).all());
});

router.get("/:id", requireAuth, requirePermission("patient:read"), (req, res) => {
  const p = db.select().from(patients).where(eq(patients.id, req.params.id)).get();
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
  const { id: _id, createdAt: _ca, ...data } = req.body;
  db.update(patients).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(patients.id, req.params.id)).run();
  const updated = db.select().from(patients).where(eq(patients.id, req.params.id)).get();
  if (!updated) return res.status(404).json({ error: "Patient not found" });
  res.json(updated);
});

router.delete("/:id", requireAuth, requirePermission("patient:delete"), (req, res) => {
  db.delete(patients).where(eq(patients.id, req.params.id)).run();
  res.status(204).send();
});

export default router;
