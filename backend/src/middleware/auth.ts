import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  const userRole = req.headers["x-user-role"] as string;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Anda harus login terlebih dahulu." });
  }

  try {
    const user = await prisma.pengguna.findUnique({ where: { id_pengguna: userId } });
    if (!user || user.peran !== "Admin") {
      return res.status(403).json({ error: "Forbidden: Hanya Admin yang dapat mengakses fitur ini." });
    }
    next();
  } catch (err) {
    return res.status(500).json({ error: "Gagal memverifikasi akses." });
  }
}
