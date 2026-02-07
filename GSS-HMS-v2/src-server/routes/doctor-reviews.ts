import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { doctorReviews, staff } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

/** GET /api/doctor-reviews – list all reviews */
router.get("/", requireAuth, requirePermission("reports:read"), (_req, res) => {
  res.json(db.select().from(doctorReviews).all());
});

/** GET /api/doctor-reviews/karma – karma scores aggregated per doctor */
router.get("/karma", requireAuth, requirePermission("reports:read"), (_req, res) => {
  const reviews = db.select().from(doctorReviews).all();

  // Group by doctor
  const byDoctor: Record<string, { doctorId: string; doctorName: string; ratings: number[]; efficacy: number[]; cost: number[]; totalCost: number; reviewCount: number }> = {};
  for (const r of reviews) {
    if (!byDoctor[r.doctorId]) {
      byDoctor[r.doctorId] = { doctorId: r.doctorId, doctorName: r.doctorName, ratings: [], efficacy: [], cost: [], totalCost: 0, reviewCount: 0 };
    }
    const d = byDoctor[r.doctorId];
    d.ratings.push(r.rating);
    if (r.efficacyScore) d.efficacy.push(r.efficacyScore);
    if (r.costScore) d.cost.push(r.costScore);
    if (r.treatmentCost) d.totalCost += r.treatmentCost;
    d.reviewCount++;
  }

  const karma = Object.values(byDoctor).map((d) => {
    const avgRating = d.ratings.reduce((a, b) => a + b, 0) / d.ratings.length;
    const avgEfficacy = d.efficacy.length > 0 ? d.efficacy.reduce((a, b) => a + b, 0) / d.efficacy.length : 0;
    const avgCost = d.cost.length > 0 ? d.cost.reduce((a, b) => a + b, 0) / d.cost.length : 0;
    // Karma = weighted average: 40% rating (out of 5 → scaled to 10), 40% efficacy, 20% cost
    const karmaScore = Math.round(((avgRating / 5) * 10 * 0.4 + avgEfficacy * 0.4 + avgCost * 0.2) * 10) / 10;
    return {
      doctorId: d.doctorId,
      doctorName: d.doctorName,
      avgRating: Math.round(avgRating * 10) / 10,
      avgEfficacy: Math.round(avgEfficacy * 10) / 10,
      avgCost: Math.round(avgCost * 10) / 10,
      karmaScore,
      reviewCount: d.reviewCount,
      totalTreatmentCost: Math.round(d.totalCost),
    };
  }).sort((a, b) => b.karmaScore - a.karmaScore);

  res.json(karma);
});

/** GET /api/doctor-reviews/:id */
router.get("/:id", requireAuth, (req, res) => {
  const review = db.select().from(doctorReviews).where(eq(doctorReviews.id, req.params.id)).get();
  if (!review) return res.status(404).json({ error: "Review not found" });
  res.json(review);
});

/** POST /api/doctor-reviews – submit a review */
router.post("/", requireAuth, requirePermission("patient:read"), (req, res) => {
  const id = randomUUID();
  const { doctorId, doctorName, patientName, rating, efficacyScore, costScore, reviewText, diagnosis, treatmentCost } = req.body;

  db.insert(doctorReviews).values({
    id,
    doctorId,
    doctorName,
    patientName,
    rating: Number(rating),
    efficacyScore: efficacyScore ? Number(efficacyScore) : null,
    costScore: costScore ? Number(costScore) : null,
    reviewText: reviewText || null,
    diagnosis: diagnosis || null,
    treatmentCost: treatmentCost ? Number(treatmentCost) : null,
    reviewDate: new Date().toISOString().slice(0, 10),
    isResolved: false,
  }).run();

  res.status(201).json(db.select().from(doctorReviews).where(eq(doctorReviews.id, id)).get());
});

/** PUT /api/doctor-reviews/:id */
router.put("/:id", requireAuth, requirePermission("reports:read"), (req, res) => {
  const { id: _id, ...data } = req.body;
  db.update(doctorReviews).set(data).where(eq(doctorReviews.id, req.params.id)).run();
  const updated = db.select().from(doctorReviews).where(eq(doctorReviews.id, req.params.id)).get();
  if (!updated) return res.status(404).json({ error: "Review not found" });
  res.json(updated);
});

/** DELETE /api/doctor-reviews/:id */
router.delete("/:id", requireAuth, requirePermission("reports:read"), (req, res) => {
  db.delete(doctorReviews).where(eq(doctorReviews.id, req.params.id)).run();
  res.status(204).send();
});

export default router;
