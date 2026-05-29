import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";

// Estende o tipo Request para incluir userId
/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
      authorizedParties: [
        "https://tcgbindex.app",
        "https://www.tcgbindex.app",
        "https://tcg-collector-app.vercel.app",
        "http://localhost:8081",
        "http://localhost:8083",
      ],
    });
    req.userId = payload.sub;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("❌ Auth error:", message);
    res.status(401).json({ error: `Auth falhou: ${message}` });
  }
}
