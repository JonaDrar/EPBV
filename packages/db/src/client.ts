import { PrismaClient } from "@prisma/client";

type GlobalForPrisma = { prisma?: PrismaClient };

const globalForPrisma = globalThis as unknown as GlobalForPrisma;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url:
          process.env.NODE_ENV === "production"
            ? process.env.DATABASE_URL
            : process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
