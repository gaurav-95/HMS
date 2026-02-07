import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { attendanceRecords } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("attendance:read"), (_req, res) => {
  res.json(db.select().from(attendanceRecords).all());
});

/** POST /api/attendance – mark attendance for a staff member */
router.post("/", requireAuth, requirePermission("attendance:write"), (req, res) => {
  const id = randomUUID();
  db.insert(attendanceRecords).values({ id, ...req.body }).run();
  res.status(201).json(db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id)).get());
});

/** PUT /api/attendance/:id – update (e.g. add check-out time) */
router.put("/:id", requireAuth, requirePermission("attendance:write"), (req, res) => {
  const { id: _id, ...data } = req.body;
  db.update(attendanceRecords).set(data).where(eq(attendanceRecords.id, req.params.id)).run();
  const updated = db.select().from(attendanceRecords).where(eq(attendanceRecords.id, req.params.id)).get();
  if (!updated) return res.status(404).json({ error: "Record not found" });
  res.json(updated);
});

export default router;
