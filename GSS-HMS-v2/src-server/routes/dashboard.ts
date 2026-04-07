import { Router } from "express";
import { sql, eq } from "drizzle-orm";
import { db } from "../db/index";
import {
  staff, attendanceRecords, leaveRequests, certifications,
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

  // Expired / Expiring certifications (not yet addressed)
  const expiredCerts = db
    .select({
      id: certifications.id,
      staffId: certifications.staffId,
      staffName: staff.name,
      department: staff.department,
      certName: certifications.name,
      expiryDate: certifications.expiryDate,
      status: certifications.status,
    })
    .from(certifications)
    .innerJoin(staff, sql`${certifications.staffId} = ${staff.id}`)
    .where(sql`${certifications.status} IN ('Expired', 'Expiring') AND (${certifications.addressed} = 0 OR ${certifications.addressed} IS NULL) AND ${staff.isActive} = 1`)
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
    expiredCerts,
    period,
  });
});

/** PATCH /api/dashboard/certifications/:certId/address — mark a cert as addressed */
router.patch("/certifications/:certId/address", requireAuth, (req, res) => {
  const certId = String(req.params.certId);
  const cert = db.select().from(certifications).where(eq(certifications.id, certId)).get();
  if (!cert) return res.status(404).json({ error: "Certification not found" });
  db.update(certifications).set({ addressed: true }).where(eq(certifications.id, certId)).run();
  res.json({ ok: true });
});

export default router;
