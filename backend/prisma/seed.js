import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  const email = "sudeepsubedi72@gmail.com";
  const rawPassword = process.env.ADMIN_SEED_PASSWORD || "Admin@1234";

  if (!rawPassword || rawPassword.length < 8) {
    throw new Error(
      "ADMIN_SEED_PASSWORD in .env must be at least 8 characters."
    );
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(rawPassword, salt);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: {}, // Do NOT overwrite an existing admin password on re-seed
    create: {
      email,
      password: hashedPassword,
    },
  });

  console.log(`✅ Admin seeded: ${admin.email}`);
  console.log(
    "⚠️  Remember to change the default password via the Admin Panel → Change Password."
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
