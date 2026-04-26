import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { performanceEvaluations } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

/** GET /api/performance-evaluations */
router.get("/", requireAuth, requirePermission("performance:read"), (_req, res) => {
  res.json(db.select().from(performanceEvaluations).all());
});

/** POST /api/performance-evaluations */
router.post("/", requireAuth, requirePermission("performance:write"), (req, res) => {
  const id = randomUUID();
  const { responsible, engaged, selfStarter, teamPlayer, challenged, employeeOriented } = req.body;
  const overallScore = ((responsible + engaged + selfStarter + teamPlayer + challenged + employeeOriented) / 6);

  db.insert(performanceEvaluations).values({
    id,
    ...req.body,
    overallScore: Math.round(overallScore * 100) / 100,
    evaluationDate: req.body.evaluationDate || new Date().toISOString().split("T")[0],
  }).run();

  res.status(201).json(db.select().from(performanceEvaluations).where(eq(performanceEvaluations.id, id)).get());
});

/** PUT /api/performance-evaluations/:id */
router.put("/:id", requireAuth, requirePermission("performance:write"), (req, res) => {
  const evalId = String(req.params.id);
  const { id: _id, ...data } = req.body;
  const { responsible, engaged, selfStarter, teamPlayer, challenged, employeeOriented } = data;
  const overallScore = ((responsible + engaged + selfStarter + teamPlayer + challenged + employeeOriented) / 6);

  db.update(performanceEvaluations)
    .set({ ...data, overallScore: Math.round(overallScore * 100) / 100 })
    .where(eq(performanceEvaluations.id, evalId))
    .run();

  const updated = db.select().from(performanceEvaluations).where(eq(performanceEvaluations.id, evalId)).get();
  if (!updated) return res.status(404).json({ error: "Evaluation not found" });
  res.json(updated);
});

/** DELETE /api/performance-evaluations/:id */
router.delete("/:id", requireAuth, requirePermission("performance:write"), (req, res) => {
  db.delete(performanceEvaluations).where(eq(performanceEvaluations.id, String(req.params.id))).run();
  res.status(204).send();
});

export default router;
