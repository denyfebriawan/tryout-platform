// Runs a database command against Neon (the live demo) instead of the local database:
//
//   npm run db:seed:neon       wipe and reseed the live demo
//   npm run db:deploy:neon     apply pending migrations to Neon
//
// Reads NEON_DATABASE_URL (the direct, unpooled URL) from .env.local and passes it as DATABASE_URL
// to this one command only, so local development keeps using the local database.
// Asks for confirmation first; add `-- --yes` to skip the question.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

import { parse } from "dotenv";

const COMMANDS: Record<string, { script: string; warning: string }> = {
  seed: {
    script: "db:seed",
    warning: "This deletes every tryout and attempt on the live demo and resets the demo accounts.",
  },
  deploy: {
    script: "db:deploy",
    warning: "This applies pending migrations to the production database.",
  },
};

async function confirm(question: string): Promise<boolean> {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await readline.question(question);
  readline.close();
  return answer.trim().toLowerCase() === "y";
}

async function main() {
  const [name, flag] = process.argv.slice(2);
  const command = COMMANDS[name];
  if (!command) {
    console.error("Usage: tsx scripts/neon-db.ts <seed|deploy> [--yes]");
    process.exit(1);
  }

  // parse() only reads the file. Unlike config(), it doesn't load the local DATABASE_URL into process.env.
  const env = parse(readFileSync(".env.local"));
  const url = env.NEON_DATABASE_URL;
  if (!url) {
    console.error("NEON_DATABASE_URL is not set in .env.local");
    process.exit(1);
  }

  // Refuse anything that isn't a direct Neon host, so a wrong value can't reach another database.
  const host = new URL(url).hostname;
  if (!host.endsWith(".neon.tech") || host.includes("-pooler")) {
    console.error(`NEON_DATABASE_URL must be Neon's direct (unpooled) URL, got host ${host}`);
    process.exit(1);
  }

  console.log(`Target: ${host}`);
  console.log(command.warning);
  if (flag !== "--yes" && !(await confirm("Continue? (y/N) "))) {
    console.log("Cancelled.");
    return;
  }

  // shell: true lets Windows find npm (npm.cmd). The command string is fixed, never user input.
  const result = spawnSync(`npm run ${command.script}`, {
    shell: true,
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url },
  });
  process.exitCode = result.status ?? 1;
}

main();
