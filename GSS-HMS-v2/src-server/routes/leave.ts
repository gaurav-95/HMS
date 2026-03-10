import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { leaveRequests } from "../db/schema";
import { requireAuth, requirePermission, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("leave:apply"), (_req, res) => {
  res.json(db.select().from(leaveRequests).all());
});

/** POST /api/leave – apply for leave */
router.post("/", requireAuth, requirePermission("leave:apply"), (req, res) => {
  const id = randomUUID();
  db.insert(leaveRequests).values({ id, ...req.body, status: "Pending", appliedDate: new Date().toISOString() }).run();
  res.status(201).json(db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).get());
});

/** PATCH /api/leave/:id/status – approve / reject */
router.patch("/:id/status", requireAuth, requirePermission("leave:approve"), (req: AuthRequest, res) => {
  const leaveId = String(req.params.id);
  const { status } = req.body; // "Approved" | "Rejected"
  db.update(leaveRequests)
    .set({ status, approvedBy: req.user!.name })
    .where(eq(leaveRequests.id, leaveId))
    .run();
  res.json(db.select().from(leaveRequests).where(eq(leaveRequests.id, leaveId)).get());
});

/** PATCH /api/leave/:id/cancel – cancel a pending leave request */
router.patch("/:id/cancel", requireAuth, requirePermission("leave:apply"), (req, res) => {
  const leaveId = String(req.params.id);
  const record = db.select().from(leaveRequests).where(eq(leaveRequests.id, leaveId)).get() as any;
  if (!record) return res.status(404).json({ error: "Leave request not found" });
  if (record.status !== "Pending") return res.status(400).json({ error: "Only pending requests can be cancelled" });
  db.update(leaveRequests).set({ status: "Cancelled" }).where(eq(leaveRequests.id, leaveId)).run();
  res.json(db.select().from(leaveRequests).where(eq(leaveRequests.id, leaveId)).get());
});

export default router;
