import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { billingRecords } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

/** GET /api/billing – list all billing records */
router.get("/", requireAuth, requirePermission("billing:read", "payroll:read"), (_req, res) => {
  res.json(db.select().from(billingRecords).where(eq(billingRecords.isActive, true)).all());
});

/** GET /api/billing/:id – single billing record */
router.get("/:id", requireAuth, requirePermission("billing:read", "payroll:read"), (req, res) => {
  const row = db.select().from(billingRecords).where(eq(billingRecords.id, req.params.id)).get();
  if (!row) return res.status(404).json({ error: "Billing record not found" });
  res.json(row);
});

/** POST /api/billing – create new invoice */
router.post("/", requireAuth, requirePermission("billing:write", "payroll:write"), (req, res) => {
  const id = randomUUID();
  // Auto-generate invoice number
  const count = db.select().from(billingRecords).all().length;
  const invoiceNumber = req.body.invoiceNumber || `INV-${String(count + 1).padStart(5, "0")}`;
  const createdDate = req.body.createdDate || new Date().toISOString().slice(0, 10);
  const items = typeof req.body.items === "object" ? JSON.stringify(req.body.items) : req.body.items;
  const subtotal = req.body.subtotal ?? req.body.totalAmount ?? 0;
  db.insert(billingRecords).values({ id, ...req.body, invoiceNumber, createdDate, items, subtotal }).run();
  res.status(201).json(db.select().from(billingRecords).where(eq(billingRecords.id, id)).get());
});

/** PUT /api/billing/:id – update billing record */
router.put("/:id", requireAuth, requirePermission("billing:write", "payroll:write"), (req, res) => {
  const { id: _id, ...data } = req.body;
  db.update(billingRecords).set(data).where(eq(billingRecords.id, req.params.id)).run();
  const updated = db.select().from(billingRecords).where(eq(billingRecords.id, req.params.id)).get();
  if (!updated) return res.status(404).json({ error: "Billing record not found" });
  res.json(updated);
});

/** PATCH /api/billing/:id/pay – record payment */
router.patch("/:id/pay", requireAuth, requirePermission("billing:write", "payroll:write"), (req, res) => {
  const existing = db.select().from(billingRecords).where(eq(billingRecords.id, req.params.id)).get();
  if (!existing) return res.status(404).json({ error: "Billing record not found" });

  const paidAmount = Number(req.body.paidAmount) || existing.paidAmount;
  const status = paidAmount >= existing.totalAmount ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid";

  db.update(billingRecords).set({
    paidAmount,
    paymentMethod: req.body.paymentMethod || existing.paymentMethod,
    status,
    paidDate: status === "Paid" ? new Date().toISOString().split("T")[0] : null,
  }).where(eq(billingRecords.id, req.params.id)).run();

  res.json(db.select().from(billingRecords).where(eq(billingRecords.id, req.params.id)).get());
});

/** DELETE /api/billing/:id */
router.delete("/:id", requireAuth, requirePermission("billing:delete", "payroll:write"), (req: any, res) => {
  const exists = db.select().from(billingRecords).where(eq(billingRecords.id, req.params.id)).get();
  if (!exists) return res.status(404).json({ error: "Billing record not found" });
  const permanent = req.query.permanent === "true" && req.user?.role === "SUPER_ADMIN";
  if (permanent) {
    db.delete(billingRecords).where(eq(billingRecords.id, req.params.id)).run();
  } else {
    db.update(billingRecords).set({ isActive: false }).where(eq(billingRecords.id, req.params.id)).run();
  }
  res.json({ success: true });
});

export default router;
