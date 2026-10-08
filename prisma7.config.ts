// Prisma CLI config (migrate, generate, studio). The app itself connects via src/lib/prisma.ts.
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js reads .env.local, so the Prisma CLI reads the same file to keep one source of truth.
// On Vercel the file doesn't exist and DATABASE_URL comes from the platform's env vars instead.
config({ path: ".env.local", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
