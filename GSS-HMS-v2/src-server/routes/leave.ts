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
  const { status } = req.body; // "Approved" | "Rejected"
  db.update(leaveRequests)
    .set({ status, approvedBy: req.user!.name })
    .where(eq(leaveRequests.id, req.params.id))
    .run();
  res.json(db.select().from(leaveRequests).where(eq(leaveRequests.id, req.params.id)).get());
});

export default router;
