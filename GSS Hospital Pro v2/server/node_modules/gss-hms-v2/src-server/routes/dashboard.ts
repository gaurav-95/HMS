import { Router } from "express";
import { sql, eq } from "drizzle-orm";
import { db } from "../db/index";
import {
  staff, attendanceRecords, leaveRequests, certifications, hospitalLicenses,
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
    .innerJoin(staff, sql`${attendanceRecords.staffId} = ${staff.id}`)
    .where(sql`${attendanceRecords.date} = ${today} AND ${attendanceRecords.status} IN ('Present', 'Late', 'HalfDay') AND ${staff.isActive} = 1`)
    .get()?.count ?? 0;

  const pendingLeaves = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(leaveRequests)
    .innerJoin(staff, sql`${leaveRequests.staffId} = ${staff.id}`)
    .where(sql`${leaveRequests.status} = 'Pending' AND ${staff.isActive} = 1`)
    .get()?.count ?? 0;

  // Staff by department (active only)
  const deptRows = db
    .select({
      department: staff.department,
      count: sql<number>`COUNT(*)`,
    })
    .from(staff)
    .where(sql`is_active = 1`)
    .groupBy(staff.department)
    .all();

  // Staff by role (active only)
  const roleRows = db
    .select({
      role: staff.role,
      count: sql<number>`COUNT(*)`,
    })
    .from(staff)
    .where(sql`is_active = 1`)
    .groupBy(staff.role)
    .all();

  // Attendance summary by period — only active staff
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

  // Overall attendance summary (active staff only)
  const attendanceSummary = db
    .select({
      status: attendanceRecords.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(attendanceRecords)
    .innerJoin(staff, sql`${attendanceRecords.staffId} = ${staff.id}`)
    .where(sql`${attendanceRecords.date} >= ${dateFrom} AND ${staff.isActive} = 1`)
    .groupBy(attendanceRecords.status)
    .all();

  // Attendance breakdown by department (active staff only)
  const deptAttendanceRows = db
    .select({
      department: staff.department,
      status: attendanceRecords.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(attendanceRecords)
    .innerJoin(staff, sql`${attendanceRecords.staffId} = ${staff.id}`)
    .where(sql`${attendanceRecords.date} >= ${dateFrom} AND ${staff.isActive} = 1`)
    .groupBy(sql`${staff.department}, ${attendanceRecords.status}`)
    .all();

  // Reshape dept attendance into { department, present, absent, onLeave }[]
  const deptAttendanceMap: Record<string, { department: string; present: number; absent: number; onLeave: number }> = {};
  for (const row of deptAttendanceRows) {
    const dept = row.department || "Unassigned";
    if (!deptAttendanceMap[dept]) {
      deptAttendanceMap[dept] = { department: dept, present: 0, absent: 0, onLeave: 0 };
    }
    if (row.status === "Present" || row.status === "Late") {
      deptAttendanceMap[dept].present += row.count;
    } else if (row.status === "Absent") {
      deptAttendanceMap[dept].absent += row.count;
    } else if (row.status === "OnLeave") {
      deptAttendanceMap[dept].onLeave += row.count;
    }
  }
  const attendanceByDept = Object.values(deptAttendanceMap).sort((a, b) => a.department.localeCompare(b.department));

  // Leave summary (active staff only)
  const leaveSummary = db
    .select({
      status: leaveRequests.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(leaveRequests)
    .innerJoin(staff, sql`${leaveRequests.staffId} = ${staff.id}`)
    .where(sql`${leaveRequests.appliedDate} >= ${dateFrom} AND ${staff.isActive} = 1`)
    .groupBy(leaveRequests.status)
    .all();

  // Expired / Expiring staff certifications (not yet addressed)
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

  // Hospital licenses that are Expired or Expiring and not addressed
  const today2 = new Date();
  const allLicenses = db
    .select()
    .from(hospitalLicenses)
    .where(sql`${hospitalLicenses.isActive} = 1`)
    .all();

  // Recompute status and filter to alert ones
  const hospitalLicenseAlerts = allLicenses.map((l) => {
    let status = l.status;
    if (l.expiryDate) {
      const daysLeft = Math.floor((new Date(l.expiryDate).getTime() - today2.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 0) status = "Expired";
      else if (daysLeft <= 60) status = "Expiring";
      else status = "Valid";
    }
    return { ...l, status };
  });

  res.json({
    totalStaff,
    terminatedStaff,
    todayPresent,
    pendingLeaves,
    staffByDepartment: deptRows,
    staffByRole: roleRows,
    attendanceSummary,
    attendanceByDept,
    leaveSummary,
    expiredCerts,
    hospitalLicenses: hospitalLicenseAlerts,
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

/** PATCH /api/dashboard/certifications/:certId/unaddress — reopen a cert */
router.patch("/certifications/:certId/unaddress", requireAuth, (req, res) => {
  const certId = String(req.params.certId);
  const cert = db.select().from(certifications).where(eq(certifications.id, certId)).get();
  if (!cert) return res.status(404).json({ error: "Certification not found" });
  db.update(certifications).set({ addressed: false }).where(eq(certifications.id, certId)).run();
  res.json({ ok: true });
});

/** GET /api/dashboard/certifications — return all staff certifications */
router.get("/certifications", requireAuth, (_req, res) => {
  const rows = db
    .select({
      id: certifications.id,
      staffId: certifications.staffId,
      staffName: staff.name,
      department: staff.department,
      certName: certifications.name,
      expiryDate: certifications.expiryDate,
      status: certifications.status,
      addressed: certifications.addressed,
      filePath: certifications.filePath,
      fileSize: certifications.fileSize,
    })
    .from(certifications)
    .innerJoin(staff, sql`${certifications.staffId} = ${staff.id}`)
    .where(sql`${staff.isActive} = 1`)
    .all();
  res.json(rows);
});

export default router;
