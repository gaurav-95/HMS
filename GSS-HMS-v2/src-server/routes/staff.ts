import { Router } from "express";
import { eq, like, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { staff, certifications, kpis } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

/** GET /api/staff */
router.get("/", requireAuth, requirePermission("staff:read"), (_req, res) => {
  const allStaff = db.select().from(staff).where(eq(staff.isActive, true)).all();

  // Attach certifications and KPIs
  const result = allStaff.map((s) => {
    const certs = db.select().from(certifications).where(eq(certifications.staffId, s.id)).all();
    const staffKpis = db.select().from(kpis).where(eq(kpis.staffId, s.id)).all();
    return { ...s, certifications: certs, kpis: staffKpis };
  });

  res.json(result);
});

/** GET /api/staff/:id */
router.get("/:id", requireAuth, requirePermission("staff:read"), (req, res) => {
  const s = db.select().from(staff).where(eq(staff.id, req.params.id)).get();
  if (!s) return res.status(404).json({ error: "Staff not found" });

  const certs = db.select().from(certifications).where(eq(certifications.staffId, s.id)).all();
  const staffKpis = db.select().from(kpis).where(eq(kpis.staffId, s.id)).all();
  res.json({ ...s, certifications: certs, kpis: staffKpis });
});

/** POST /api/staff */
router.post("/", requireAuth, requirePermission("staff:write"), (req, res) => {
  const now = new Date().toISOString();
  const id = randomUUID();
  const { certifications: certs, kpis: staffKpis, ...data } = req.body;

  db.insert(staff).values({ id, ...data, createdAt: now, updatedAt: now }).run();

  // Insert certifications
  if (Array.isArray(certs)) {
    for (const c of certs) {
      db.insert(certifications).values({ id: randomUUID(), staffId: id, ...c }).run();
    }
  }

  // Insert KPIs
  if (Array.isArray(staffKpis)) {
    for (const k of staffKpis) {
      db.insert(kpis).values({ id: randomUUID(), staffId: id, ...k }).run();
    }
  }

  const created = db.select().from(staff).where(eq(staff.id, id)).get();
  res.status(201).json(created);
});

/** PUT /api/staff/:id */
router.put("/:id", requireAuth, requirePermission("staff:write"), (req, res) => {
  const { certifications: _c, kpis: _k, id: _id, createdAt: _ca, ...data } = req.body;
  db.update(staff)
    .set({ ...data, updatedAt: new Date().toISOString() })
    .where(eq(staff.id, req.params.id))
    .run();

  const updated = db.select().from(staff).where(eq(staff.id, req.params.id)).get();
  if (!updated) return res.status(404).json({ error: "Staff not found" });
  res.json(updated);
});

/** DELETE /api/staff/:id */
router.delete("/:id", requireAuth, requirePermission("staff:delete"), (req: any, res) => {
  const permanent = req.query.permanent === "true" && req.user?.role === "SUPER_ADMIN";
  if (permanent) {
    db.delete(staff).where(eq(staff.id, req.params.id)).run();
  } else {
    db.update(staff).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(staff.id, req.params.id)).run();
  }
  res.status(204).send();
});

export default router;
