import { PrismaClient } from "../app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Bump this whenever schema fields change so the dev global singleton is rebuilt.
const PRISMA_CLIENT_VERSION = "ask-loop-v1"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaClientVersion?: string
}

function createPrisma() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

// In dev, HMR can keep a PrismaClient built from an older generated schema.
// Drop the cache when models are missing OR when our schema version changes.
if (process.env.NODE_ENV !== "production" && globalForPrisma.prisma) {
  const missingModels =
    !("workspace" in globalForPrisma.prisma) ||
    !("invitation" in globalForPrisma.prisma) ||
    !("feedback" in globalForPrisma.prisma) ||
    !("askLoopConversation" in globalForPrisma.prisma)
  const versionMismatch =
    globalForPrisma.prismaClientVersion !== PRISMA_CLIENT_VERSION

  if (missingModels || versionMismatch) {
    void globalForPrisma.prisma.$disconnect().catch(() => {})
    globalForPrisma.prisma = undefined
  }
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION
}

export * from "../app/generated/prisma/client"
