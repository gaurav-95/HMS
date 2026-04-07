import { Router } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { leaveRequests, leaveTypes, staff, attendanceRecords } from "../db/schema";
import { requireAuth, requirePermission, AuthRequest, hasPermission } from "../middleware/auth";

/** Generate all YYYY-MM-DD strings from start to end (inclusive) */
function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + "T00:00:00");
  const last = new Date(end + "T00:00:00");
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** Create OnLeave attendance records for each day in an approved leave */
function syncLeaveToAttendance(staffId: string, staffName: string, startDate: string, endDate: string) {
  for (const d of dateRange(startDate, endDate)) {
    const exists = db.select({ id: attendanceRecords.id }).from(attendanceRecords)
      .where(and(eq(attendanceRecords.staffId, staffId), eq(attendanceRecords.date, d))).get();
    if (!exists) {
      db.insert(attendanceRecords).values({ id: randomUUID(), staffId, staffName, date: d, status: "OnLeave" }).run();
    }
  }
}

/** Remove auto-created OnLeave attendance records when a leave is un-approved */
function removeLeaveAttendance(staffId: string, startDate: string, endDate: string) {
  for (const d of dateRange(startDate, endDate)) {
    db.delete(attendanceRecords)
      .where(and(eq(attendanceRecords.staffId, staffId), eq(attendanceRecords.date, d), eq(attendanceRecords.status, "OnLeave")))
      .run();
  }
}

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
router.post("/types", requireAuth, requirePermission("leave:manage-types"), (req: AuthRequest, res) => {
  const id = randomUUID();
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });
  db.insert(leaveTypes).values({ id, name, createdBy: req.user!.name, createdAt: new Date().toISOString() }).run();
  res.status(201).json(db.select().from(leaveTypes).where(eq(leaveTypes.id, id)).get());
});

/** DELETE /api/leave/types/:id – deactivate a leave type (Super Admin) */
router.delete("/types/:id", requireAuth, requirePermission("leave:manage-types"), (req, res) => {
  db.update(leaveTypes).set({ isActive: false }).where(eq(leaveTypes.id, String(req.params.id))).run();
  res.status(204).send();
});

/** POST /api/leave – apply for leave */
router.post("/", requireAuth, requirePermission("leave:apply"), (req: AuthRequest, res) => {
  const { startDate, endDate } = req.body;
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ error: "End date must be on or after start date" });
  }

  // STAFF can only apply leave for themselves
  if (req.user!.role === "STAFF" && req.body.staffId) {
    const linkedStaff = db.select({ id: staff.id }).from(staff).where(eq(staff.userId, req.user!.id)).get();
    if (!linkedStaff || req.body.staffId !== linkedStaff.id) {
      return res.status(403).json({ error: "You can only apply leave for yourself" });
    }
  }

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

  const wasApproved = record.status === "Approved";

  db.update(leaveRequests)
    .set({ status, approvedBy: req.user!.name })
    .where(eq(leaveRequests.id, leaveId))
    .run();

  // Sync attendance: create OnLeave records when approved, remove them when un-approved
  if (status === "Approved" && !wasApproved) {
    syncLeaveToAttendance(record.staffId, record.staffName, record.startDate, record.endDate);
  } else if (status !== "Approved" && wasApproved) {
    removeLeaveAttendance(record.staffId, record.startDate, record.endDate);
  }

  res.json(db.select().from(leaveRequests).where(eq(leaveRequests.id, leaveId)).get());
});

/** PATCH /api/leave/:id/cancel – cancel a pending leave request */
router.patch("/:id/cancel", requireAuth, requirePermission("leave:apply"), (req: AuthRequest, res) => {
  const leaveId = String(req.params.id);
  const record = db.select().from(leaveRequests).where(eq(leaveRequests.id, leaveId)).get() as any;
  if (!record) return res.status(404).json({ error: "Leave request not found" });
  if (record.status !== "Pending") return res.status(400).json({ error: "Only pending requests can be cancelled" });

  // Only the leave owner or a manager (leave:approve) can cancel
  const linkedStaff = db.select({ id: staff.id }).from(staff).where(eq(staff.userId, req.user!.id)).get();
  const isOwner = linkedStaff && record.staffId === linkedStaff.id;
  const canApprove = hasPermission(req.user!.role, "leave:approve");
  if (!isOwner && !canApprove) {
    return res.status(403).json({ error: "You can only cancel your own leave requests" });
  }

  // If the leave was somehow approved before cancellation (SUPER_ADMIN flow), clean up attendance
  if (record.status === "Approved") {
    removeLeaveAttendance(record.staffId, record.startDate, record.endDate);
  }

  db.update(leaveRequests).set({ status: "Cancelled" }).where(eq(leaveRequests.id, leaveId)).run();
  res.json(db.select().from(leaveRequests).where(eq(leaveRequests.id, leaveId)).get());
});

export default router;
