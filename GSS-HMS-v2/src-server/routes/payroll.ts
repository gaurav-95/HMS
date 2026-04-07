import { Router } from "express";
import { eq, and, like, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { payrollRecords, staff, attendanceRecords, appSettings } from "../db/schema";
import { requireAuth, requirePermission, AuthRequest } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("payroll:read"), (req: AuthRequest, res) => {
  const userRole = req.user!.role;
  const userDept = req.user!.department;

  // LEADER: only see payroll for staff in their department
  if (userRole === "LEADER" && userDept) {
    const deptStaffIds = db.select({ id: staff.id }).from(staff)
      .where(eq(staff.department, userDept)).all().map((s) => s.id);
    if (deptStaffIds.length === 0) return res.json([]);
    return res.json(db.select().from(payrollRecords).where(inArray(payrollRecords.staffId, deptStaffIds)).all());
  }

  // STAFF: only see their own payroll
  if (userRole === "STAFF") {
    const linkedStaff = db.select({ id: staff.id }).from(staff)
      .where(eq(staff.userId, req.user!.id)).get();
    if (!linkedStaff) return res.json([]);
    return res.json(db.select().from(payrollRecords).where(eq(payrollRecords.staffId, linkedStaff.id)).all());
  }

  // SUPER_ADMIN / ADMIN: see everything
  res.json(db.select().from(payrollRecords).all());
});

/** POST /api/payroll/generate – auto-generate for selected (or all) active staff for a month */
router.post("/generate", requireAuth, requirePermission("payroll:write"), (req, res) => {
  try {
  const { month, year, staffIds } = req.body;
  if (!month || !year) return res.status(400).json({ error: "month and year required" });

  const settingsRow = db.select().from(appSettings).where(eq(appSettings.key, "workingDaysPerMonth")).get() as any;
  const workingDays = settingsRow ? Number(settingsRow.value) : 26;

  let activeStaff = db.select().from(staff).all().filter((s: any) => s.isActive !== 0 && s.isActive !== false);

  // If specific staff IDs provided, filter to only those
  if (Array.isArray(staffIds) && staffIds.length > 0) {
    const idSet = new Set(staffIds);
    activeStaff = activeStaff.filter((s: any) => idSet.has(s.id));
  }

  // Check which staff already have a record for this month
  const existing = db.select().from(payrollRecords)
    .where(and(eq(payrollRecords.month, month), eq(payrollRecords.year, String(year)))).all() as any[];
  const existingStaffIds = new Set(existing.map((r: any) => r.staffId));

  const datePrefix = `${year}-${String("January,February,March,April,May,June,July,August,September,October,November,December".split(",").indexOf(month) + 1).padStart(2, "0")}`;

  const created: any[] = [];
  for (const s of activeStaff as any[]) {
    if (existingStaffIds.has(s.id)) continue;

    // Count attendance for the month
    const attendanceRows = db.select().from(attendanceRecords)
      .where(and(eq(attendanceRecords.staffId, s.id), like(attendanceRecords.date, `${datePrefix}%`))).all() as any[];
    const present = attendanceRows.filter((a: any) => ["Present", "Late"].includes(a.status)).length;
    const halfDays = attendanceRows.filter((a: any) => a.status === "HalfDay").length;
    const attendedShifts = present + halfDays * 0.5;
    const leavesTaken = attendanceRows.filter((a: any) => a.status === "OnLeave").length;

    const basicSalary = s.baseSalary || 60000;
    const hra = Math.round(basicSalary * 0.5);
    const epfEmployer = 1800;
    const otherAllowance = Math.round(basicSalary * 0.47);
    const grossSalary = basicSalary + hra + otherAllowance;
    const professionalTax = 200;
    const epfEmployee = 1800;
    const shiftRate = grossSalary / workingDays;
    const leaveDeductions = Math.round((workingDays - attendedShifts) * shiftRate);
    const netSalary = grossSalary - professionalTax - epfEmployee - (leaveDeductions > 0 ? leaveDeductions : 0);

    const id = randomUUID();
    db.insert(payrollRecords).values({
      id,
      staffId: s.id,
      staffName: s.name,
      department: s.department,
      month,
      year,
      baseSalary: basicSalary,
      basicSalary,
      hra,
      epfEmployer,
      otherAllowance,
      grossSalary,
      professionalTax,
      epfEmployee,
      leaveDeductions: leaveDeductions > 0 ? leaveDeductions : 0,
      totalShifts: workingDays,
      attendedShifts,
      leavesTaken,
      shiftRate: Math.round(shiftRate),
      deductions: professionalTax + epfEmployee + (leaveDeductions > 0 ? leaveDeductions : 0),
      bonus: 0,
      netSalary: Math.round(netSalary),
      status: "Draft",
    }).run();
    created.push(db.select().from(payrollRecords).where(eq(payrollRecords.id, id)).get());
  }

  res.status(201).json({ generated: created.length, records: created });
  } catch (err: any) {
    console.error("Payroll generate error:", err);
    res.status(500).json({ error: "Failed to generate payroll: " + (err.message || err) });
  }
});

/** POST /api/payroll – create individual payroll entry */
router.post("/", requireAuth, requirePermission("payroll:write"), (req, res) => {
  const id = randomUUID();
  const data = req.body;

  const basicSalary = data.basicSalary ?? data.baseSalary ?? 0;
  const hra = data.hra ?? 0;
  const epfEmployer = data.epfEmployer ?? 1800;
  const otherAllowance = data.otherAllowance ?? 0;
  const grossSalary = basicSalary + hra + otherAllowance;
  const professionalTax = data.professionalTax ?? 200;
  const epfEmployee = data.epfEmployee ?? 1800;
  const leaveDeductions = data.leaveDeductions ?? 0;
  const netSalary = grossSalary - professionalTax - epfEmployee - leaveDeductions;

  db.insert(payrollRecords).values({
    id,
    staffId: data.staffId,
    staffName: data.staffName,
    department: data.department,
    month: data.month,
    year: data.year,
    baseSalary: basicSalary,
    basicSalary,
    hra,
    epfEmployer,
    otherAllowance,
    grossSalary,
    professionalTax,
    epfEmployee,
    leaveDeductions,
    totalShifts: data.totalShifts ?? 0,
    attendedShifts: data.attendedShifts ?? 0,
    leavesTaken: data.leavesTaken ?? 0,
    shiftRate: data.shiftRate ?? 0,
    deductions: professionalTax + epfEmployee + leaveDeductions,
    bonus: data.bonus ?? 0,
    netSalary: Math.round(netSalary),
    status: data.status || "Draft",
  }).run();
  res.status(201).json(db.select().from(payrollRecords).where(eq(payrollRecords.id, id)).get());
});

/** PATCH /api/payroll/:id/status – mark as processed / paid */
router.patch("/:id/status", requireAuth, requirePermission("payroll:approve"), (req, res) => {
  const payId = String(req.params.id);
  db.update(payrollRecords).set({ status: req.body.status }).where(eq(payrollRecords.id, payId)).run();
  res.json(db.select().from(payrollRecords).where(eq(payrollRecords.id, payId)).get());
});

/** DELETE /api/payroll/:id – delete draft payroll entry */
router.delete("/:id", requireAuth, requirePermission("payroll:write"), (req, res) => {
  const payId = String(req.params.id);
  const record = db.select().from(payrollRecords).where(eq(payrollRecords.id, payId)).get() as any;
  if (!record) return res.status(404).json({ error: "Payroll record not found" });
  if (record.status !== "Draft") return res.status(400).json({ error: "Only draft entries can be deleted" });
  db.delete(payrollRecords).where(eq(payrollRecords.id, payId)).run();
  res.json({ success: true });
});

export default router;
