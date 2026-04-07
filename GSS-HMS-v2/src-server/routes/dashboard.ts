import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/index";
import {
  staff, attendanceRecords, leaveRequests,
} from "../db/schema";
import { requireAuth } from "../middleware/auth";

const router = Router();

/** GET /api/dashboard/stats?period=monthly|quarterly|yearly */
router.get("/stats", requireAuth, (req, res) => {
  const totalStaff = db.select({ count: sql<number>`COUNT(*)` }).from(staff).where(sql`is_active = 1`).get()?.count ?? 0;
  const terminatedStaff = db.select({ count: sql<number>`COUNT(*)` }).from(staff).where(sql`is_active = 0`).get()?.count ?? 0;

  const today = new Date().toISOString().slice(0, 10);
  const todayPresent = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(attendanceRecords)
    .where(sql`date = ${today} AND status IN ('Present', 'Late', 'HalfDay')`)
    .get()?.count ?? 0;

  const pendingLeaves = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(leaveRequests)
    .where(sql`status = 'Pending'`)
    .get()?.count ?? 0;

  // Staff by department
  const deptRows = db
    .select({
      department: staff.department,
      count: sql<number>`COUNT(*)`,
    })
    .from(staff)
    .where(sql`is_active = 1`)
    .groupBy(staff.department)
    .all();

  // Staff by role
  const roleRows = db
    .select({
      role: staff.role,
      count: sql<number>`COUNT(*)`,
    })
    .from(staff)
    .where(sql`is_active = 1`)
    .groupBy(staff.role)
    .all();

  // Attendance summary by period
  const period = (req.query.period as string) || "monthly";
  const now = new Date();
  let dateFrom: string;

  if (period === "yearly") {
    dateFrom = `${now.getFullYear()}-01-01`;
  } else if (period === "quarterly") {
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    dateFrom = `${now.getFullYear()}-${String(qMonth + 1).padStart(2, "0")}-01`;
  } else {
    // monthly
    dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  }

  const attendanceSummary = db
    .select({
      status: attendanceRecords.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(attendanceRecords)
    .where(sql`date >= ${dateFrom}`)
    .groupBy(attendanceRecords.status)
    .all();

  const leaveSummary = db
    .select({
      status: leaveRequests.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(leaveRequests)
    .where(sql`applied_date >= ${dateFrom}`)
    .groupBy(leaveRequests.status)
    .all();

  res.json({
    totalStaff,
    terminatedStaff,
    todayPresent,
    pendingLeaves,
    staffByDepartment: deptRows,
    staffByRole: roleRows,
    attendanceSummary,
    leaveSummary,
    period,
  });
});

export default router;
