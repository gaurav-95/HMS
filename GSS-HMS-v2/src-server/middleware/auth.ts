import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = "gss-hms-standalone-secret-2026";
const JWT_EXPIRES_IN = "24h";

// ─── Role → Permission mapping (simplified 4-role system) ──────────
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    "dashboard:view",
    "staff:read","staff:write","staff:delete",
    "payroll:read","payroll:write","payroll:approve",
    "users:read","users:write","users:delete",
    "leave:apply","leave:approve","leave:manage-types",
    "attendance:read","attendance:write",
    "settings:read","settings:write",
  ],
  ADMIN: [
    "dashboard:view",
    "staff:read","staff:write",
    "payroll:read",
    "users:read","users:write",
    "leave:apply","leave:approve",
    "attendance:read","attendance:write",
    "settings:read",
  ],
  LEADER: [
    "dashboard:view",
    "staff:read",
    "payroll:read",
    "leave:apply","leave:approve",
    "attendance:read","attendance:write",
  ],
  STAFF: [
    "dashboard:view",
    "attendance:read",
    "leave:apply",
    "payroll:read",
  ],
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function signToken(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as AuthUser;
}

/** Middleware: require a valid JWT */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Middleware factory: require specific permission */
export function requirePermission(...permissions: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Authentication required" });

    const userPerms = ROLE_PERMISSIONS[req.user.role] || [];
    const hasRequired = permissions.some((p) => userPerms.includes(p));

    if (!hasRequired) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}
