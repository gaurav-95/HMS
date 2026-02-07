import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = "gss-hms-standalone-secret-2026";
const JWT_EXPIRES_IN = "24h";

// ─── Role → Permission mapping (mirrors frontend) ──────────
const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: [
    "staff:read","staff:write","staff:delete","patient:read","patient:write","patient:delete",
    "lab:read","lab:write","lab:delete","payroll:read","payroll:write","payroll:approve",
    "documents:read","documents:write","documents:delete","performance:read","performance:write",
    "roster:read","roster:write","users:read","users:write","users:delete",
    "announcements:read","announcements:write","announcements:delete",
    "attendance:read","attendance:write","leave:apply","leave:approve",
    "insurance:read","insurance:write","inventory:read","inventory:write","inventory:delete",
    "reports:read","reports:match","tokens:read","tokens:write",
    "schedule:read","schedule:write","settings:read","settings:write",
    "medicine:administer","medicine:prescribe",
  ],
  CEO: [
    "staff:read","staff:write","patient:read","lab:read","payroll:read","payroll:approve",
    "documents:read","documents:write","performance:read","performance:write",
    "roster:read","users:read","announcements:read","announcements:write",
    "attendance:read","leave:approve","insurance:read","inventory:read",
    "reports:read","tokens:read","schedule:read","settings:read",
  ],
  CMO: [
    "staff:read","patient:read","patient:write","lab:read","lab:write",
    "documents:read","performance:read","roster:read","announcements:read",
    "attendance:read","leave:approve","reports:read","reports:match",
    "tokens:read","tokens:write","schedule:read","schedule:write",
    "medicine:prescribe","medicine:administer",
  ],
  COO: [
    "staff:read","staff:write","patient:read","lab:read","payroll:read","payroll:write",
    "documents:read","documents:write","performance:read","roster:read","roster:write",
    "announcements:read","announcements:write","attendance:read","attendance:write",
    "leave:approve","insurance:read","insurance:write","inventory:read","inventory:write",
    "reports:read","tokens:read","schedule:read",
  ],
  DOCTOR: [
    "patient:read","patient:write","lab:read","lab:write",
    "documents:read","performance:read","announcements:read",
    "attendance:read","leave:apply","reports:read","reports:match",
    "tokens:read","tokens:write","schedule:read",
    "medicine:prescribe",
  ],
  METRON: [
    "staff:read","patient:read","lab:read","documents:read",
    "roster:read","roster:write","announcements:read","announcements:write",
    "attendance:read","attendance:write","leave:approve",
    "inventory:read","inventory:write","tokens:read","schedule:read",
  ],
  ACCOUNTANT: [
    "staff:read","payroll:read","payroll:write","documents:read",
    "announcements:read","attendance:read","leave:apply",
    "insurance:read","insurance:write","inventory:read","reports:read",
  ],
  NURSE: [
    "patient:read","patient:write","lab:read","documents:read",
    "announcements:read","attendance:read","leave:apply",
    "inventory:read","tokens:read","schedule:read",
    "medicine:administer",
  ],
  RECEPTIONIST: [
    "patient:read","patient:write","lab:read","documents:read",
    "announcements:read","attendance:read","leave:apply",
    "tokens:read","tokens:write","schedule:read",
  ],
  TECHNICIAN: [
    "lab:read","lab:write","documents:read","announcements:read",
    "attendance:read","leave:apply","reports:match",
  ],
  PHARMACIST: [
    "patient:read","lab:read","documents:read","announcements:read",
    "attendance:read","leave:apply","inventory:read","inventory:write",
    "medicine:administer","medicine:prescribe",
  ],
  STAFF: [
    "announcements:read","attendance:read","leave:apply","documents:read",
  ],
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
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
