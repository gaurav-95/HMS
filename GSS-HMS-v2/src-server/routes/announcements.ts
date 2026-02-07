import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { announcements } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("announcements:read"), (_req, res) => {
  res.json(db.select().from(announcements).all());
});

router.post("/", requireAuth, requirePermission("announcements:write"), (req, res) => {
  const id = randomUUID();
  const body = { ...req.body };
  // Map frontend field names to schema column names
  if (body.body && !body.content) { body.content = body.body; delete body.body; }
  if (body.createdBy && !body.postedBy) { body.postedBy = body.createdBy; delete body.createdBy; }
  if (!body.postedDate) { body.postedDate = new Date().toISOString().slice(0, 10); }
  if (!body.type) { body.type = "General"; }
  delete body.targetRoles; // not in schema
  if (body.penaltyConfig && typeof body.penaltyConfig === "object") {
    body.penaltyConfig = JSON.stringify(body.penaltyConfig);
  }
  db.insert(announcements).values({ id, ...body }).run();
  const created = db.select().from(announcements).where(eq(announcements.id, id)).get();
  res.status(201).json({
    ...created,
    penaltyConfig: created?.penaltyConfig ? JSON.parse(created.penaltyConfig) : null,
  });
});

router.put("/:id", requireAuth, requirePermission("announcements:write"), (req, res) => {
  const { id: _id, ...data } = req.body;
  // Map frontend field names to schema column names
  if (data.body && !data.content) { data.content = data.body; delete data.body; }
  if (data.createdBy && !data.postedBy) { data.postedBy = data.createdBy; delete data.createdBy; }
  delete data.targetRoles;
  if (data.penaltyConfig && typeof data.penaltyConfig === "object") {
    data.penaltyConfig = JSON.stringify(data.penaltyConfig);
  }
  db.update(announcements).set(data).where(eq(announcements.id, req.params.id)).run();
  const updated = db.select().from(announcements).where(eq(announcements.id, req.params.id)).get();
  if (!updated) return res.status(404).json({ error: "Announcement not found" });
  res.json({
    ...updated,
    penaltyConfig: updated.penaltyConfig ? JSON.parse(updated.penaltyConfig) : null,
  });
});

router.delete("/:id", requireAuth, requirePermission("announcements:delete"), (req, res) => {
  db.delete(announcements).where(eq(announcements.id, req.params.id)).run();
  res.status(204).send();
});

export default router;
