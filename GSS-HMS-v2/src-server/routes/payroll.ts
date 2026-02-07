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
  db.insert(payrollRecords).values({ id, ...req.body }).run();
  res.status(201).json(db.select().from(payrollRecords).where(eq(payrollRecords.id, id)).get());
});

/** PATCH /api/payroll/:id/status – mark as processed / paid */
router.patch("/:id/status", requireAuth, requirePermission("payroll:approve"), (req, res) => {
  db.update(payrollRecords).set({ status: req.body.status }).where(eq(payrollRecords.id, req.params.id)).run();
  res.json(db.select().from(payrollRecords).where(eq(payrollRecords.id, req.params.id)).get());
});

export default router;
