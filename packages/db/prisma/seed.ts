import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim();

  if (!email || !password) {
    console.error("ADMIN_EMAIL y ADMIN_PASSWORD son requeridos para seed.");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const fallbackName = name || email.split("@")[0] || "Administrador";

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: Role.ADMIN, active: true, name: fallbackName },
    create: { email, passwordHash, role: Role.ADMIN, active: true, name: fallbackName },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
