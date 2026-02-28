import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { doctorSchedules } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("schedule:read"), (_req, res) => {
  res.json(db.select().from(doctorSchedules).where(eq(doctorSchedules.isActive, true)).all());
});

router.post("/", requireAuth, requirePermission("schedule:write"), (req, res) => {
  const id = randomUUID();
  db.insert(doctorSchedules).values({ id, ...req.body }).run();
  res.status(201).json(db.select().from(doctorSchedules).where(eq(doctorSchedules.id, id)).get());
});

router.put("/:id", requireAuth, requirePermission("schedule:write"), (req, res) => {
  const { id: _id, ...data } = req.body;
  db.update(doctorSchedules).set(data).where(eq(doctorSchedules.id, req.params.id)).run();
  const updated = db.select().from(doctorSchedules).where(eq(doctorSchedules.id, req.params.id)).get();
  if (!updated) return res.status(404).json({ error: "Schedule not found" });
  res.json(updated);
});

router.delete("/:id", requireAuth, requirePermission("schedule:delete"), (req: any, res) => {
  const permanent = req.query.permanent === "true" && req.user?.role === "SUPER_ADMIN";
  if (permanent) {
    db.delete(doctorSchedules).where(eq(doctorSchedules.id, req.params.id)).run();
  } else {
    db.update(doctorSchedules).set({ isActive: false }).where(eq(doctorSchedules.id, req.params.id)).run();
  }
  res.status(204).send();
});

export default router;
