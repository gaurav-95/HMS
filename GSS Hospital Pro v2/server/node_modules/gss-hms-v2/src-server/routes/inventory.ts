import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { db } from "../db/index";
import { inventoryItems } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("inventory:read"), (_req, res) => {
  res.json(db.select().from(inventoryItems).all());
});

router.get("/:id", requireAuth, requirePermission("inventory:read"), (req, res) => {
  const item = db.select().from(inventoryItems).where(eq(inventoryItems.id, String(req.params.id))).get();
  if (!item) return res.status(404).json({ error: "Item not found" });
  res.json(item);
});

router.post("/", requireAuth, requirePermission("inventory:write"), (req, res) => {
  const id = randomUUID();
  db.insert(inventoryItems).values({ id, ...req.body }).run();
  res.status(201).json(db.select().from(inventoryItems).where(eq(inventoryItems.id, id)).get());
});

router.put("/:id", requireAuth, requirePermission("inventory:write"), (req, res) => {
  const itemId = String(req.params.id);
  const { id: _id, ...data } = req.body;
  db.update(inventoryItems).set(data).where(eq(inventoryItems.id, itemId)).run();
  const updated = db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId)).get();
  if (!updated) return res.status(404).json({ error: "Item not found" });
  res.json(updated);
});

router.delete("/:id", requireAuth, requirePermission("inventory:delete"), (req, res) => {
  db.delete(inventoryItems).where(eq(inventoryItems.id, String(req.params.id))).run();
  res.status(204).send();
});

export default router;
