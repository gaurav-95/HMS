import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db/index";
import {
  staff, patients, labTests, tokens, documents,
  announcements, attendanceRecords, certifications,
  prescriptions, billingRecords, medicineAdministrations, doctorReviews,
} from "../db/schema";
import { requireAuth } from "../middleware/auth";

const router = Router();

/** GET /api/dashboard/stats */
router.get("/stats", requireAuth, (_req, res) => {
  const totalStaff = db.select({ count: sql<number>`COUNT(*)` }).from(staff).get()?.count ?? 0;
  const totalPatients = db.select({ count: sql<number>`COUNT(*)` }).from(patients).get()?.count ?? 0;

  const pendingTests = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(labTests)
    .where(sql`status IN ('Pending', 'InProgress')`)
    .get()?.count ?? 0;

  const today = new Date().toISOString().slice(0, 10);
  const todayAttendance = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(attendanceRecords)
    .where(sql`date = ${today} AND status = 'Present'`)
    .get()?.count ?? 0;

  const expiringDocs = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(certifications)
    .where(sql`status IN ('Expiring', 'Expired')`)
    .get()?.count ?? 0;

  const activeAnnouncements = db
    .select()
    .from(announcements)
    .where(sql`is_active = 1`)
    .all();

  const recentTests = db
    .select()
    .from(labTests)
    .orderBy(sql`ordered_date DESC`)
    .limit(5)
    .all();

  const waitingTokens = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tokens)
    .where(sql`status = 'Waiting' AND date(created_at) = ${today}`)
    .get()?.count ?? 0;

  const pendingPrescriptions = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(prescriptions)
    .where(sql`status = 'Pending'`)
    .get()?.count ?? 0;

  const unpaidBills = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(billingRecords)
    .where(sql`status IN ('Unpaid', 'Partial')`)
    .get()?.count ?? 0;

  // License expiration details
  const expiringCerts = db
    .select()
    .from(certifications)
    .where(sql`status IN ('Expiring', 'Expired')`)
    .all();

  // Medicine discrepancy count
  const discrepancyCount = db
    .select({ count: sql<number>`COUNT(*)` })
    .from(medicineAdministrations)
    .where(sql`has_discrepancy = 1 AND status = 'Flagged'`)
    .get()?.count ?? 0;

  // Penalty announcements (active penalties)
  const penaltyAnnouncements = db
    .select()
    .from(announcements)
    .where(sql`is_active = 1 AND type = 'Penalty'`)
    .all();

  // Attendance-based penalty computation
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthAbsences = db
    .select({
      staffId: attendanceRecords.staffId,
      staffName: attendanceRecords.staffName,
      absences: sql<number>`COUNT(*)`,
    })
    .from(attendanceRecords)
    .where(sql`date LIKE ${currentMonth + '%'} AND status = 'Absent'`)
    .groupBy(attendanceRecords.staffId, attendanceRecords.staffName)
    .all();

  // Calculate penalty amounts per staff based on penalty announcements
  const penaltySummary = monthAbsences.map((a: any) => {
    let totalDeduction = 0;
    for (const pa of penaltyAnnouncements) {
      if (pa.penaltyConfig) {
        try {
          const cfg = JSON.parse(pa.penaltyConfig);
          const limit = cfg.absenceLimit || 0;
          const deduction = cfg.deductionAmount || 0;
          const excessAbsences = Math.max(0, a.absences - limit);
          totalDeduction += excessAbsences * deduction;
        } catch {}
      }
    }
    return { staffId: a.staffId, staffName: a.staffName, absences: a.absences, totalDeduction };
  }).filter((p: any) => p.totalDeduction > 0);

  res.json({
    totalStaff,
    totalPatients,
    pendingTests,
    todayAttendance,
    expiringDocs,
    waitingTokens,
    pendingPrescriptions,
    unpaidBills,
    discrepancyCount,
    expiringCerts,
    penaltySummary,
    announcements: activeAnnouncements,
    recentTests,
  });
});

export default router;
