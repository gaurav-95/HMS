import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { users } from "../db/schema";
import { signToken, requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

/** POST /api/auth/login */
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user || !user.isActive) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Update last login
  db.update(users)
    .set({ lastLogin: new Date().toISOString() })
    .where(eq(users.id, user.id))
    .run();

  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
    },
  });
});

/** GET /api/auth/me – current user from token */
router.get("/me", requireAuth, (req: AuthRequest, res) => {
  const user = db.select().from(users).where(eq(users.id, req.user!.id)).get();
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
  });
});

export default router;
