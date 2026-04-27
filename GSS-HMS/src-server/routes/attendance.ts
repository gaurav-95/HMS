import { Router } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { attendanceRecords, staff } from "../db/schema";
import { requireAuth, requirePermission, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("attendance:read"), (req: AuthRequest, res) => {
  const userRole = req.user!.role;
  const userDept = req.user!.department;

  // LEADER: only see attendance for staff in their department
  if (userRole === "LEADER" && userDept) {
    const deptStaffIds = db.select({ id: staff.id }).from(staff)
      .where(eq(staff.department, userDept)).all().map((s) => s.id);
    if (deptStaffIds.length === 0) return res.json([]);
    return res.json(db.select().from(attendanceRecords).where(inArray(attendanceRecords.staffId, deptStaffIds)).all());
  }

  // STAFF: only see their own attendance (find staff linked to this user)
  if (userRole === "STAFF") {
    const linkedStaff = db.select({ id: staff.id }).from(staff)
      .where(eq(staff.userId, req.user!.id)).get();
    if (!linkedStaff) return res.json([]);
    return res.json(db.select().from(attendanceRecords).where(eq(attendanceRecords.staffId, linkedStaff.id)).all());
  }

  // SUPER_ADMIN / ADMIN: see everything
  res.json(db.select().from(attendanceRecords).all());
});

/** POST /api/attendance – mark attendance for a staff member */
router.post("/", requireAuth, requirePermission("attendance:write"), (req, res) => {
  // Prevent duplicate attendance for same staff + date
  if (req.body.staffId && req.body.date) {
    const existing = db.select().from(attendanceRecords)
      .where(and(eq(attendanceRecords.staffId, req.body.staffId), eq(attendanceRecords.date, req.body.date))).get();
    if (existing) {
      return res.status(400).json({ error: "Attendance already marked for this staff member on this date" });
    }
  }
  const id = randomUUID();
  db.insert(attendanceRecords).values({ id, ...req.body }).run();
  res.status(201).json(db.select().from(attendanceRecords).where(eq(attendanceRecords.id, id)).get());
});

/** PUT /api/attendance/:id – update (e.g. add check-out time) */
router.put("/:id", requireAuth, requirePermission("attendance:write"), (req, res) => {
  const attId = String(req.params.id);
  const { id: _id, ...data } = req.body;
  db.update(attendanceRecords).set(data).where(eq(attendanceRecords.id, attId)).run();
  const updated = db.select().from(attendanceRecords).where(eq(attendanceRecords.id, attId)).get();
  if (!updated) return res.status(404).json({ error: "Record not found" });
  res.json(updated);
});

export default router;
