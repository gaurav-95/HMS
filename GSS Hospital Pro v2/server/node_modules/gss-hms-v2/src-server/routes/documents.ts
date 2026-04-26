import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { documents } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("documents:read"), (_req, res) => {
  res.json(db.select().from(documents).where(eq(documents.isActive, true)).all());
});

router.post("/", requireAuth, requirePermission("documents:write"), (req, res) => {
  const id = randomUUID();
  db.insert(documents).values({ id, ...req.body }).run();
  res.status(201).json(db.select().from(documents).where(eq(documents.id, id)).get());
});

router.delete("/:id", requireAuth, requirePermission("documents:delete"), (req: any, res) => {
  const docId = String(req.params.id);
  const permanent = req.query.permanent === "true" && req.user?.role === "SUPER_ADMIN";
  if (permanent) {
    db.delete(documents).where(eq(documents.id, docId)).run();
  } else {
    db.update(documents).set({ isActive: false }).where(eq(documents.id, docId)).run();
  }
  res.status(204).send();
});

export default router;
