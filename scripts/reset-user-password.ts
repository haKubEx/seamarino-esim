import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config({
  path: ".env.local",
});

const CUSTOMER_EMAIL =
  "jerome.pineda13@gmail.com";

const NEW_PASSWORD =
  "Seamarino2026";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL was not loaded from .env.local",
    );
  }

  /*
   * Import Prisma only after .env.local is loaded.
   */
  const { prisma } =
    await import(
      "../app/lib/prisma"
    );

  try {
    const email =
      CUSTOMER_EMAIL
        .trim()
        .toLowerCase();

    console.log(
      "Database protocol:",
      process.env.DATABASE_URL.split(
        ":",
      )[0],
    );

    console.log(
      "Searching for:",
      email,
    );

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
          name: true,
          email: true,
          passwordHash: true,
        },
      });

    if (!user) {
      throw new Error(
        `No user found for ${email}`,
      );
    }

    console.log(
      "User found:",
      {
        id: user.id,
        name: user.name,
        email: user.email,
        currentHashPrefix:
          user.passwordHash.slice(
            0,
            7,
          ),
      },
    );

    const newPasswordHash =
      await bcrypt.hash(
        NEW_PASSWORD,
        12,
      );

    await prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        email,
        passwordHash:
          newPasswordHash,
      },
    });

    await prisma.session.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const updatedUser =
      await prisma.user.findUnique({
        where: {
          id: user.id,
        },

        select: {
          email: true,
          passwordHash: true,
        },
      });

    if (!updatedUser) {
      throw new Error(
        "Updated user could not be loaded.",
      );
    }

    const passwordMatches =
      await bcrypt.compare(
        NEW_PASSWORD,
        updatedUser.passwordHash,
      );

    console.log({
      email:
        updatedUser.email,

      newHashPrefix:
        updatedUser.passwordHash.slice(
          0,
          7,
        ),

      passwordMatches,
    });

    if (!passwordMatches) {
      throw new Error(
        "Password verification failed after database update.",
      );
    }

    console.log("");
    console.log(
      "PASSWORD RESET SUCCESSFUL",
    );

    console.log(
      `Login email: ${email}`,
    );

    console.log(
      `Login password: ${NEW_PASSWORD}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    "PASSWORD RESET FAILED:",
    error,
  );

  process.exitCode = 1;
});