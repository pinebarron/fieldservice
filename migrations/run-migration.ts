import "dotenv/config";
import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigration() {
  const sql = postgres(process.env.DATABASE_URL!);

  const migrationPath = path.join(__dirname, "add_schedule_columns.sql");
  const migrationSql = fs.readFileSync(migrationPath, "utf-8");

  console.log("Running migration...");

  try {
    await sql.unsafe(migrationSql);
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigration().catch((err) => {
  console.error(err);
  process.exit(1);
});
