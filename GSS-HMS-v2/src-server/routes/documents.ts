import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { documents } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("documents:read"), (_req, res) => {
  res.json(db.select().from(documents).all());
});

router.post("/", requireAuth, requirePermission("documents:write"), (req, res) => {
  const id = randomUUID();
  db.insert(documents).values({ id, ...req.body }).run();
  res.status(201).json(db.select().from(documents).where(eq(documents.id, id)).get());
});

router.delete("/:id", requireAuth, requirePermission("documents:delete"), (req, res) => {
  db.delete(documents).where(eq(documents.id, req.params.id)).run();
  res.status(204).send();
});

export default router;
