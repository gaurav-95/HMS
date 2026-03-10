import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../db/index";
import { users } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("users:read"), (_req, res) => {
  const allUsers = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    isActive: users.isActive,
    lastLogin: users.lastLogin,
    createdAt: users.createdAt,
  }).from(users).where(eq(users.isActive, true)).all();
  res.json(allUsers);
});

router.post("/", requireAuth, requirePermission("users:write"), (req, res) => {
  const id = randomUUID();
  const now = new Date().toISOString();
  const hashed = bcrypt.hashSync(req.body.password || "password123", 10);
  db.insert(users).values({
    id,
    email: req.body.email,
    name: req.body.name,
    role: req.body.role,
    password: hashed,
    isActive: req.body.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  }).run();

  const created = db.select({
    id: users.id, email: users.email, name: users.name,
    role: users.role, isActive: users.isActive, createdAt: users.createdAt,
  }).from(users).where(eq(users.id, id)).get();
  res.status(201).json(created);
});

router.put("/:id", requireAuth, requirePermission("users:write"), (req, res) => {
  const userId = String(req.params.id);
  const data: Record<string, unknown> = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    isActive: req.body.isActive,
    updatedAt: new Date().toISOString(),
  };
  if (req.body.password) {
    data.password = bcrypt.hashSync(req.body.password, 10);
  }
  db.update(users).set(data).where(eq(users.id, userId)).run();

  const updated = db.select({
    id: users.id, email: users.email, name: users.name,
    role: users.role, isActive: users.isActive, createdAt: users.createdAt,
  }).from(users).where(eq(users.id, userId)).get();
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json(updated);
});

router.delete("/:id", requireAuth, requirePermission("users:delete"), (req: any, res) => {
  const userId = String(req.params.id);
  const permanent = req.query.permanent === "true" && req.user?.role === "SUPER_ADMIN";
  if (permanent) {
    db.delete(users).where(eq(users.id, userId)).run();
  } else {
    db.update(users).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(users.id, userId)).run();
  }
  res.status(204).send();
});

export default router;
