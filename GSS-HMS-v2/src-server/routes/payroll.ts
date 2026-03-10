import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { payrollRecords } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("payroll:read"), (_req, res) => {
  res.json(db.select().from(payrollRecords).all());
});

/** POST /api/payroll – create payroll entry */
router.post("/", requireAuth, requirePermission("payroll:write"), (req, res) => {
  const id = randomUUID();
  const data = req.body;

  // Auto-compute net salary from breakdown if provided
  const basicSalary = data.basicSalary ?? data.baseSalary ?? 0;
  const ta = data.ta ?? 0;
  const conveyance = data.conveyance ?? 0;
  const hra = data.hra ?? 0;
  const bonus = data.bonus ?? 0;
  const pf = data.pf ?? 0;
  const tds = data.tds ?? 0;
  const deductions = data.deductions ?? 0;
  const netSalary = basicSalary + ta + conveyance + hra + bonus - pf - tds - deductions;

  db.insert(payrollRecords).values({
    id,
    staffId: data.staffId,
    staffName: data.staffName,
    month: data.month,
    year: data.year,
    baseSalary: data.baseSalary ?? basicSalary,
    basicSalary,
    ta,
    conveyance,
    hra,
    pf,
    tds,
    bonus,
    deductions,
    netSalary,
    status: data.status,
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
