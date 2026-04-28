import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env["ADMIN_SEED_EMAIL"]?.trim().toLowerCase();
  const password = process.env["ADMIN_SEED_PASSWORD"];
  const name = process.env["ADMIN_SEED_NAME"]?.trim() || null;

  if (!email || !password) {
    console.error(
      "ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD must be set (use apps/web/.env.local).",
    );
    process.exit(1);
  }

  const adminEmails = (process.env["ADMIN_EMAILS"] ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(email)) {
    console.warn(
      `WARNING: ${email} is not in ADMIN_EMAILS. The account will be created but will NOT receive admin elevation until you add it to ADMIN_EMAILS in .env.local.`,
    );
  }

  const passwordHash = await hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash,
        ...(name ? { name } : {}),
        tier: "creator",
      },
    });
    console.log(`Updated admin account: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name ?? email.split("@")[0],
        tier: "creator",
      },
    });
    console.log(`Created admin account: ${email}`);
  }

  console.log("Sign in at /auth/sign-in with the email + password you set.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
