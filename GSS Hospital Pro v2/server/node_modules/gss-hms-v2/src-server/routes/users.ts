import { Router } from "express";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../db/index";
import { users, staff } from "../db/schema";
import { requireAuth, requirePermission } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, requirePermission("users:read"), (_req, res) => {
  const allUsers = db.select({
    id: users.id,
    email: users.email,
    name: users.name,
    role: users.role,
    department: users.department,
    isActive: users.isActive,
    lastLogin: users.lastLogin,
    createdAt: users.createdAt,
  }).from(users).all();

  // Attach staff photo if linked
  const result = allUsers.map((u) => {
    const linked = db.select({ photoPath: staff.photoPath, avatar: staff.avatar })
      .from(staff).where(eq(staff.userId, u.id)).get();
    return { ...u, photoPath: linked?.photoPath || null, avatar: linked?.avatar || null };
  });

  res.json(result);
});

router.post("/", requireAuth, requirePermission("users:write"), (req: any, res) => {
  // Prevent role escalation: only SUPER_ADMIN can create SUPER_ADMIN users
  if (req.body.role === "SUPER_ADMIN" && req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can create Super Admin accounts" });
  }
  // LEADER role requires a department
  if (req.body.role === "LEADER" && !req.body.department) {
    return res.status(400).json({ error: "Department is required for Leader role" });
  }
  const id = randomUUID();
  const now = new Date().toISOString();
  const hashed = bcrypt.hashSync(req.body.password || "password123", 10);
  db.insert(users).values({
    id,
    email: req.body.email,
    name: req.body.name,
    role: req.body.role,
    department: req.body.department || null,
    password: hashed,
    isActive: req.body.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  }).run();

  const created = db.select({
    id: users.id, email: users.email, name: users.name,
    role: users.role, department: users.department, isActive: users.isActive, createdAt: users.createdAt,
  }).from(users).where(eq(users.id, id)).get();
  res.status(201).json(created);
});

router.put("/:id", requireAuth, requirePermission("users:write"), (req: any, res) => {
  // Prevent role escalation: only SUPER_ADMIN can assign SUPER_ADMIN role
  if (req.body.role === "SUPER_ADMIN" && req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "Only Super Admin can assign Super Admin role" });
  }
  if (req.body.role === "LEADER" && !req.body.department) {
    return res.status(400).json({ error: "Department is required for Leader role" });
  }
  const userId = String(req.params.id);
  const data: Record<string, unknown> = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
    department: req.body.department ?? null,
    isActive: req.body.isActive,
    updatedAt: new Date().toISOString(),
  };
  if (req.body.password) {
    data.password = bcrypt.hashSync(req.body.password, 10);
  }
  db.update(users).set(data).where(eq(users.id, userId)).run();

  const updated = db.select({
    id: users.id, email: users.email, name: users.name,
    role: users.role, department: users.department, isActive: users.isActive, createdAt: users.createdAt,
  }).from(users).where(eq(users.id, userId)).get();
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json(updated);
});

router.delete("/:id", requireAuth, requirePermission("users:delete"), (req: any, res) => {
  const userId = String(req.params.id);
  if (userId === req.user?.id) {
    return res.status(400).json({ error: "Cannot delete your own account" });
  }
  const permanent = req.query.permanent === "true" && req.user?.role === "SUPER_ADMIN";
  if (permanent) {
    // Unlink any staff referencing this user before deleting
    db.update(staff).set({ userId: null }).where(eq(staff.userId, userId)).run();
    db.delete(users).where(eq(users.id, userId)).run();
  } else {
    db.update(users).set({ isActive: false, updatedAt: new Date().toISOString() }).where(eq(users.id, userId)).run();
  }
  res.status(204).send();
});

export default router;
