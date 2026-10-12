import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";
import { verifyToken, JwtPayload } from "../lib/jwt";

// Augment Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Extract token from Authorization header or custom fallback header.
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers["authorization"];
  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7).trim();
  }
  const customHeader = req.headers["x-access-token"];
  if (typeof customHeader === "string" && customHeader.trim()) {
    return customHeader.trim();
  }
  return null;
}

/**
 * Authentication Middleware.
 * Validates cryptographic JWT signature and expiration.
 * Prevents unauthenticated access to system endpoints.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ 
      error: "Unauthorized: Token autentikasi diperlukan. Harap login terlebih dahulu." 
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ 
      error: "Unauthorized: Sesi tidak valid atau telah kedaluwarsa. Harap login kembali." 
    });
  }

  req.user = payload;
  // Inject verified identity headers so existing helper logic can read safe identity
  req.headers["x-user-id"] = payload.userId;
  req.headers["x-user-role"] = payload.role;

  next();
}

/**
 * Admin Access Control Middleware.
 * Strictly verifies JWT signature AND confirms in the database that
 * the user has the 'Admin' role.
 * Completely prevents 'x-user-id' spoofing vulnerabilities.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ 
      error: "Unauthorized: Token autentikasi diperlukan untuk akses Admin." 
    });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ 
      error: "Unauthorized: Sesi tidak valid atau telah kedaluwarsa. Harap login kembali." 
    });
  }

  try {
    const user = await prisma.pengguna.findUnique({ 
      where: { id_pengguna: payload.userId } 
    });

    if (!user || user.peran !== "Admin") {
      return res.status(403).json({ 
        error: "Forbidden: Hanya Admin yang dapat mengakses fitur ini." 
      });
    }

    req.user = payload;
    req.headers["x-user-id"] = payload.userId;
    req.headers["x-user-role"] = payload.role;

    next();
  } catch (err) {
    console.error("[requireAdmin Error]", err);
    return res.status(500).json({ error: "Gagal memverifikasi akses admin." });
  }
}
