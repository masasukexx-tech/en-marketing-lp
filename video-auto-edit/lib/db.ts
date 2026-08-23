import { PrismaClient } from "@prisma/client";

// Next.js の dev サーバーはホットリロードのたびにモジュールを再評価するため、
// グローバルに1つだけ PrismaClient を保持して接続過多を防ぐ。
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
