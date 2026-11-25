// Runs prisma migrate deploy over DIRECT_URL when it is set: Neon's pooled address cannot hold Prisma's migration lock.
import "dotenv/config";
import { spawnSync } from "node:child_process";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
const result = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url }
});
process.exit(result.status ?? 1);
