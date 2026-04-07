import { Router } from "express";
import { eq, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { leaveRequests, leaveTypes, staff } from "../db/schema";
import { requireAuth, requirePermission, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("leave:apply"), (req: AuthRequest, res) => {
  const userRole = req.user!.role;
  const userDept = req.user!.department;

  // LEADER: only see leaves for staff in their department
  if (userRole === "LEADER" && userDept) {
    const deptStaffIds = db.select({ id: staff.id }).from(staff)
      .where(eq(staff.department, userDept)).all().map((s) => s.id);
    if (deptStaffIds.length === 0) return res.json([]);
    return res.json(db.select().from(leaveRequests).where(inArray(leaveRequests.staffId, deptStaffIds)).all());
  }

  // STAFF: only see their own leave requests
  if (userRole === "STAFF") {
    const linkedStaff = db.select({ id: staff.id }).from(staff)
      .where(eq(staff.userId, req.user!.id)).get();
    if (!linkedStaff) return res.json([]);
    return res.json(db.select().from(leaveRequests).where(eq(leaveRequests.staffId, linkedStaff.id)).all());
  }

  // SUPER_ADMIN / ADMIN: see everything
  res.json(db.select().from(leaveRequests).all());
});

/** GET /api/leave/types – list active leave types */
router.get("/types", requireAuth, (_req, res) => {
  res.json(db.select().from(leaveTypes).where(eq(leaveTypes.isActive, true)).all());
});

/** POST /api/leave/types – create a leave type (Super Admin) */
router.post("/types", requireAuth, requirePermission("settings:write"), (req: AuthRequest, res) => {
  const id = randomUUID();
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  db.insert(leaveTypes).values({ id, name, createdBy: req.user!.name, createdAt: new Date().toISOString() }).run();
  res.status(201).json(db.select().from(leaveTypes).where(eq(leaveTypes.id, id)).get());
});

/** DELETE /api/leave/types/:id – deactivate a leave type (Super Admin) */
router.delete("/types/:id", requireAuth, requirePermission("settings:write"), (req, res) => {
  db.update(leaveTypes).set({ isActive: false }).where(eq(leaveTypes.id, String(req.params.id))).run();
  res.status(204).send();
});

/** POST /api/leave – apply for leave */
router.post("/", requireAuth, requirePermission("leave:apply"), (req, res) => {
  const id = randomUUID();
  db.insert(leaveRequests).values({ id, ...req.body, status: "Pending", appliedDate: new Date().toISOString() }).run();
  res.status(201).json(db.select().from(leaveRequests).where(eq(leaveRequests.id, id)).get());
});

/** PATCH /api/leave/:id/status – approve / reject / edit status */
router.patch("/:id/status", requireAuth, requirePermission("leave:approve"), (req: AuthRequest, res) => {
  const leaveId = String(req.params.id);
  const { status } = req.body; // "Approved" | "Rejected" | "Pending"
  const allowed = ["Approved", "Rejected", "Pending"];
  if (!status || !allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const record = db.select().from(leaveRequests).where(eq(leaveRequests.id, leaveId)).get() as any;
  if (!record) return res.status(404).json({ error: "Leave request not found" });

  // Only SUPER_ADMIN can change status of already-decided leaves
  if (record.status !== "Pending" && req.user!.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can change a decided leave status" });
  }

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
