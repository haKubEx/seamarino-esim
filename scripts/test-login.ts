import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config({
  path: ".env.local",
});

async function main() {
  const email =
    "jerome.pineda13@gmail.com"
      .trim()
      .toLowerCase();

  const password =
    "Seamarino2026";

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL was not loaded from .env.local",
    );
  }

  const { prisma } =
    await import(
      "../app/lib/prisma"
    );

  try {
    const user =
      await prisma.user.findFirst({
        where: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },

        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          role: true,
        },
      });

    if (!user) {
      console.error(
        "RESULT: USER NOT FOUND",
      );

      return;
    }

    const storedHash =
      user.passwordHash.trim();

    const hashLooksValid =
      /^\$2[aby]\$\d{2}\$/.test(
        storedHash,
      );

    let passwordMatches =
      false;

    if (hashLooksValid) {
      passwordMatches =
        await bcrypt.compare(
          password,
          storedHash,
        );
    }

    console.log({
      result:
        passwordMatches
          ? "LOGIN SHOULD WORK"
          : "PASSWORD DOES NOT MATCH",

      userId:
        user.id,

      email:
        user.email,

      role:
        user.role,

      hashPrefix:
        storedHash.slice(
          0,
          7,
        ),

      hashLength:
        storedHash.length,

      hashLooksValid,

      passwordMatches,
    });
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    "LOGIN TEST FAILED:",
    error,
  );

  process.exitCode = 1;
});