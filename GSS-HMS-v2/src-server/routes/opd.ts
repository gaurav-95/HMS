import { Router } from "express";
import { eq, sql, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { tokens } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("tokens:read"), (_req, res) => {
  res.json(db.select().from(tokens).orderBy(desc(tokens.createdAt)).all());
});

/** POST /api/tokens – auto-increments token number for the day */
router.post("/", requireAuth, requirePermission("tokens:write"), (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const lastToken = db
    .select({ max: sql<number>`MAX(token_number)` })
    .from(tokens)
    .where(sql`date(created_at) = ${today}`)
    .get();

  const tokenNumber = (lastToken?.max ?? 0) + 1;
  const id = randomUUID();
  db.insert(tokens)
    .values({ id, tokenNumber, ...req.body, status: "Waiting", createdAt: new Date().toISOString() })
    .run();

  res.status(201).json(db.select().from(tokens).where(eq(tokens.id, id)).get());
});

/** PATCH /api/tokens/:id/status */
router.patch("/:id/status", requireAuth, requirePermission("tokens:write"), (req, res) => {
  db.update(tokens).set({ status: req.body.status }).where(eq(tokens.id, req.params.id)).run();
  res.json(db.select().from(tokens).where(eq(tokens.id, req.params.id)).get());
});

export default router;
