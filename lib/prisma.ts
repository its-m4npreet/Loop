import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

// In dev, the global cache may hold a stale client from before schema changes.
// Invalidate it if it's missing models that the current schema defines.
if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
  if (!("workspace" in globalForPrisma.prisma)) {
    globalForPrisma.prisma = undefined
  }
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

export * from "../app/generated/prisma/client"
